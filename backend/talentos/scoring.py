"""The seven-dimension scoring engine and the Second-Look detector.

Design intents encoded here:
  * keyword and semantic channels are scored independently — their divergence
    is the recall-risk signal that powers hidden-fit recovery;
  * evidence confidence gates keyword-stuffed profiles instead of letting
    raw keyword coverage dominate;
  * nothing in this module rejects anyone. It ranks and flags. Humans decide.
"""
from __future__ import annotations
from . import config, taxonomy


def _aliases_in(text: str):
    """Alias strings literally present in a piece of text (token-boundary)."""
    import re
    low = text.lower()
    out = []
    for alias, canon in taxonomy.alias_index():
        if re.search(r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])", low):
            out.append(alias)
    return out


def skill_match(resume, jd) -> int:
    """Keyword channel: replicates a NAIVE ATS on purpose — a mandatory bullet
    is satisfied only if one of the alias strings *written in that bullet*
    appears literally in the resume. No synonyms, no stemming, no taxonomy.
    The intelligence lives in the semantic channel; the divergence between
    the two channels is the recall-risk signal."""
    import re
    if not jd.mandatory:
        return 50
    low_resume = resume.text.lower()
    hits = 0
    for bullet in jd.mandatory:
        aliases = _aliases_in(bullet)
        if aliases:
            if any(re.search(r"(?<![a-z0-9])" + re.escape(a) + r"(?![a-z0-9])", low_resume)
                   for a in aliases):
                hits += 1
        else:
            words = [w for w in re.findall(r"[a-z]{5,}", bullet.lower())
                     if w not in ("including", "production", "equivalent")]
            present = sum(1 for w in words if w in low_resume)
            if words and present >= max(2, (len(words) + 1) // 2):
                hits += 1
    return int(round(100 * hits / len(jd.mandatory)))


def preferred_match(resume, jd) -> int:
    if not jd.preferred_skills:
        return 50
    return int(round(100 * len(jd.preferred_skills & resume.skills) / len(jd.preferred_skills)))


def semantic_fit(resume, jd, dense_sim: float) -> int:
    """Semantic channel: taxonomy-class coverage of mandatory skills blended
    with dense-embedding similarity (backend-pluggable)."""
    if not jd.mandatory_skills:
        return int(dense_sim * 100)
    covered = 0
    for want in jd.mandatory_skills:
        if want in resume.skills:
            covered += 1.0
        elif taxonomy.semantic_satisfies(resume.skills, want):
            covered += 0.85
        elif taxonomy.adjacent_satisfies(resume.skills, want):
            covered += 0.65
    cov = covered / len(jd.mandatory_skills)
    return int(round(100 * (0.75 * cov + 0.25 * max(0.0, min(1.0, dense_sim)))))


def experience_alignment(resume, jd) -> int:
    yrs = resume.timeline["dated_years"] or resume.timeline["stated_years"]
    lo, hi = jd.exp_band
    if yrs >= lo:
        return 95 if yrs <= hi + 2 else 80
    return max(10, int(95 * yrs / lo))


def tooling_fit(resume, jd) -> int:
    pool = jd.preferred_skills | jd.mandatory_skills
    if not pool:
        return 50
    return int(round(100 * len(pool & resume.skills) / len(pool)))


def score_candidate(resume, jd, emap, proj, dense_sim, ev_conf):
    s = {
        "sk": skill_match(resume, jd),
        "pf": preferred_match(resume, jd),
        "se": semantic_fit(resume, jd, dense_sim),
        "dp": proj["depth"],
        "pr": proj["production"],
        "ex": experience_alignment(resume, jd),
        "to": tooling_fit(resume, jd),
        "ev": ev_conf,
    }
    return s


def overall(s: dict, weights=None) -> int:
    w = weights or config.DEFAULT_WEIGHTS
    t = sum(w.values()) or 1
    return int(round(sum(s[k] * w[k] for k in w) / t))


def second_look(s: dict, resume, jd):
    """Recall-risk detector with two triggers:

    A) DIVERGENCE — semantic far above keyword: strong meaning, weak
       vocabulary. The classic hidden-fit profile.
    B) SPECIALIST SHAPE — at least two JD requirements (mandatory or
       preferred) are satisfied ONLY through semantic-class or adjacency
       mappings: equivalent capability under a different label.

    Either way the outcome is identical and bounded: a flag routing the
    candidate to mandatory human review. Never an auto-shortlist; never a
    rejection."""
    divergence = s["se"] - s["sk"]
    mapped = []
    for want in sorted(jd.mandatory_skills | jd.preferred_skills):
        if want in resume.skills:
            continue
        a = taxonomy.adjacent_satisfies(resume.skills, want)
        if a:
            mapped.append(f"{a[0]} → {want}: {a[1]}")
        elif taxonomy.semantic_satisfies(resume.skills, want):
            eq = [h for h in resume.skills if taxonomy.classes_of(h) & taxonomy.classes_of(want)]
            mapped.append(f"{eq[0]} ≈ {want} (same semantic class)")

    trigger_a = divergence >= config.SECOND_LOOK_DIVERGENCE and s["dp"] >= config.SECOND_LOOK_MIN_DEPTH
    trigger_b = len(mapped) >= 2 and s["dp"] >= config.SECOND_LOOK_MIN_DEPTH
    if trigger_a or trigger_b:
        why = "divergence" if trigger_a else "specialist shape"
        return {
            "flag": True, "divergence": divergence, "trigger": why, "mappings": mapped[:4],
            "missed": f"Keyword channel scores {s['sk']} — below typical shortlist gates; "
                      f"the vocabulary, not the capability, is what's missing.",
            "surfaced": f"Semantic channel scores {s['se']} with project depth {s['dp']} "
                        f"({why} trigger). " + ("; ".join(mapped[:3]) if mapped else ""),
            "verify": "Human review should confirm transfer appetite for the exact stack; "
                      "concepts are demonstrated, labels differ.",
            "confidence": min(95, 50 + max(divergence, 0) + 6 * min(len(mapped), 4)
                              + (8 if s["pr"] >= 70 else 0)),
        }
    return {"flag": False, "divergence": divergence, "trigger": None, "mappings": mapped}


def recommendation(ov: int, sl: dict, v_risk: int) -> str:
    if v_risk >= config.VERIFY_RISK_THRESHOLD:
        return "Verification recommended before progression"
    if sl["flag"]:
        return "Second-look review recommended"
    if ov >= config.PRED_HIGH:
        return "Strong fit — recommend shortlist / technical panel"
    if ov >= config.PRED_MEDIUM:
        return "Medium fit — recommend recruiter review"
    return "Low ranking — human review optional"
