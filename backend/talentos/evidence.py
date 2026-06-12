"""Evidence mapper: every JD requirement is linked to resume evidence with a
match type (Direct / Semantic / Adjacent / Inferred / Missing), a strength,
and the supporting sentence. This is the trust-building core: no score exists
without a traceable line of evidence.
"""
from __future__ import annotations
import re
from . import taxonomy, parsing

PRODUCTION_SIGNALS = re.compile(
    r"(deploy|production|on-call|oncall|rollback|sla|slo|uptime|monitor|alert|"
    r"serving|req/min|requests|events/day|events/sec|per day|per second|per minute|"
    r"scaled?|operate|runbook|real-time|retraining|drift|"
    r"mttr|incident|million|petabyte|gb/day|tb)", re.I)
NUMBERS = re.compile(r"\d[\d,.]*\s*(%|x|k|m|million|billion|gb|tb|req|rps|qps|users|pods|records)", re.I)


def sentence_strength(sent: str) -> str:
    """Strong = applied context with operational/quantified signals.
    Medium = applied context. Weak = list-style mention."""
    prod = bool(PRODUCTION_SIGNALS.search(sent))
    num = bool(NUMBERS.search(sent))
    verbs = bool(re.search(r"\b(built|designed|led|implemented|developed|owned|architected|"
                           r"deployed|operated?|maintained|optimi[sz]ed|reduced|improved|wrote)\b", sent, re.I))
    if verbs and (prod or num):
        return "Strong"
    if verbs or prod:
        return "Medium"
    return "Weak"


def find_evidence_sentence(resume: parsing.Resume, skill: str):
    """Best sentence mentioning the skill (any alias), preferring applied
    context over skills-list mentions."""
    aliases = taxonomy.SKILLS.get(skill, [skill])
    best, best_rank = None, -1
    order = {"Strong": 2, "Medium": 1, "Weak": 0}
    for sent in parsing.sentences(resume.text):
        low = sent.lower()
        if any(re.search(r"(?<![a-z0-9])" + re.escape(a) + r"(?![a-z0-9])", low) for a in aliases):
            st = sentence_strength(sent)
            if order[st] > best_rank:
                best, best_rank = (sent, st), order[st]
    return best


def map_requirement(resume: parsing.Resume, req_text: str):
    """Map one JD requirement line to its best evidence."""
    req_skills = taxonomy.extract_skills(req_text)
    have = resume.skills

    direct = sorted(req_skills & have)
    if direct:
        hits = [(s, find_evidence_sentence(resume, s)) for s in direct]
        hits = [(s, h) for s, h in hits if h]
        if hits:
            skill, (sent, strength) = max(hits, key=lambda x: {"Strong": 2, "Medium": 1, "Weak": 0}[x[1][1]])
            return {"req": req_text, "type": "Direct", "strength": strength,
                    "skill": skill, "evidence": sent[:300]}
        return {"req": req_text, "type": "Direct", "strength": "Weak",
                "skill": direct[0], "evidence": "Listed in skills; no applied sentence found."}

    for want in sorted(req_skills):
        sem = [h for h in have if taxonomy.classes_of(h) & taxonomy.classes_of(want)]
        if sem:
            hit = find_evidence_sentence(resume, sem[0])
            return {"req": req_text, "type": "Semantic", "strength": (hit[1] if hit else "Medium"),
                    "skill": sem[0],
                    "evidence": (hit[0][:300] if hit else f"Equivalent-stack skill present: {sem[0]}")}

    for want in sorted(req_skills):
        adj = taxonomy.adjacent_satisfies(have, want)
        if adj:
            h, note = adj
            hit = find_evidence_sentence(resume, h)
            return {"req": req_text, "type": "Adjacent", "strength": "Medium", "skill": h,
                    "evidence": (hit[0][:300] if hit else h) + f"  [{note}]"}

    # Inferred: requirement words co-occur in applied sentences without taxonomy hits
    words = [w for w in re.findall(r"[a-z]{5,}", req_text.lower())
             if w not in ("skills", "production", "experience")]
    for sent in parsing.sentences(resume.text):
        if sum(w in sent.lower() for w in words) >= 2:
            return {"req": req_text, "type": "Inferred", "strength": "Weak",
                    "skill": None, "evidence": sent[:300]}

    return {"req": req_text, "type": "Missing", "strength": "Weak", "skill": None,
            "evidence": "No supporting evidence found in resume."}


def evidence_map(resume: parsing.Resume, jd: parsing.JD):
    return [map_requirement(resume, r) for r in jd.mandatory]


def evidence_confidence(emap, parse: int) -> int:
    """0-100: strength-weighted coverage, attenuated by parse quality."""
    w = {"Strong": 1.0, "Medium": 0.6, "Weak": 0.2}
    t = {"Direct": 1.0, "Semantic": 0.9, "Adjacent": 0.7, "Inferred": 0.4, "Missing": 0.0}
    if not emap:
        return int(parse * 0.5)
    cov = sum(w[e["strength"]] * t[e["type"]] for e in emap) / len(emap)
    return int(round((0.65 * cov + 0.35 * (parse / 100)) * 100))
