"""Verification-risk scoring and duplicate detection.

All outputs here are ADVISORY flags with suggested probing questions —
they raise human attention, never automatic consequences. The system has
no rejection authority.
"""
from __future__ import annotations
import re
from . import config, parsing


def shingles(text: str, k: int = config.SHINGLE_SIZE):
    toks = re.findall(r"[a-z0-9]+", text.lower())
    return {" ".join(toks[i:i + k]) for i in range(max(0, len(toks) - k + 1))}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def find_duplicates(resumes):
    """Pairs with shingle-Jaccard above threshold. Both copies freeze for
    human disposition — duplication is a fact to resolve, not a verdict."""
    sh = {r.cid: shingles(r.text) for r in resumes}
    out = []
    ids = [r.cid for r in resumes]
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            sim = jaccard(sh[ids[i]], sh[ids[j]])
            if sim >= config.DUPLICATE_JACCARD:
                out.append({"a": ids[i], "b": ids[j], "similarity": round(sim, 3)})
    return out


def verification_risk(resume: parsing.Resume, emap, proj):
    """0-100 advisory risk with named reasons and probing questions."""
    risk, reasons, probes = 8, [], []

    stated, dated = resume.timeline["stated_years"], resume.timeline["dated_years"]
    if stated and dated >= 0 and stated - dated > config.VERIFY_TIMELINE_SLACK_YEARS:
        risk += 38
        reasons.append(f"Stated experience ({stated:g}+ years) exceeds dated history (~{dated:g} years)")
        probes.append("Walk through the dated timeline; reconcile it with the stated years of experience.")

    evidenced = {e["skill"] for e in emap if e["skill"] and e["strength"] in ("Strong", "Medium")}
    n_skills = len(resume.skills)
    if n_skills >= 24:
        risk += 44
        reasons.append(f"{n_skills} technologies listed — far beyond what any evidence supports")
        probes.append("Pick any three listed technologies and show owned work in each.")
    elif n_skills >= 14 and n_skills / max(1, len(evidenced)) > config.VERIFY_SKILL_EVIDENCE_RATIO:
        risk += 26
        reasons.append(f"{n_skills} skills listed; only {len(evidenced)} carry applied evidence")
        probes.append("Pick any three listed technologies and show owned work in each.")

    if not any(e["strength"] == "Strong" for e in emap) and n_skills >= 9:
        risk += 12
        reasons.append("No requirement is backed by strong applied evidence despite a broad skill list")
        probes.append("Walk through one project end-to-end with operational specifics.")

    import re as _re
    claims_scale = bool(_re.search(r"(millions? of (requests|users)|at scale|in production|deployed)",
                                   resume.text, _re.I))
    if claims_scale and resume.timeline["dated_years"] < 1.0:
        risk += 20
        reasons.append("Deployment/scale claims with under a year of dated history")
        probes.append("Who operated the deployment, on what infrastructure, for how long?")

    if proj["inflated"]:
        risk += 22
        reasons.append(f"{proj['inflated']} scale claim(s) without infrastructure detail")
        probes.append("Describe the infrastructure behind the scale claim — components, ops, numbers.")
    if proj["tutorial"] >= 2:
        risk += 12
        reasons.append("Multiple tutorial-pattern projects presented as applied work")
        probes.append("Which project diverged most from its reference tutorial, and how?")

    if re.search(r"founder\s*&?\s*ceo", resume.text, re.I) and dated < 2.5:
        risk += 14
        reasons.append("Executive title alongside a very short dated history")
        probes.append("Describe team size, users, and revenue/usage evidence for the founded venture.")

    return min(95, risk), reasons, probes
