"""Evaluation harness: precision@k, recall, recovery rates, confusion matrix,
ATS-baseline comparison. Benchmark mode uses labelled demo data — these are
evaluation-harness numbers, never production performance claims.
"""
from __future__ import annotations
from . import config, scoring

GOOD = {"strong", "hidden"}


def pred_band(ov):
    return "High" if ov >= config.PRED_HIGH else "Medium" if ov >= config.PRED_MEDIUM else "Low"


def evaluate(pipeline, labels: dict, weights=None):
    recs = pipeline.ranked(weights)
    n = len(recs)
    gt = lambda r: labels.get(r["cid"], "medium")

    def p_at(k):
        top = recs[:min(k, n)]
        return round(100 * sum(1 for r in top if gt(r) in GOOD) / max(1, len(top)))

    strong_ids = [c for c, g in labels.items() if g == "strong"]
    recall10 = round(100 * sum(1 for r in recs[:10] if gt(r) == "strong") / max(1, len(strong_ids)))

    hidden_ids = [c for c, g in labels.items() if g == "hidden"]
    flagged = {r["cid"] for r in pipeline.second_look_lane()}
    recovery = (100 if not hidden_ids else
                round(100 * sum(1 for c in hidden_ids if c in flagged) / len(hidden_ids)))

    verify_ids = [c for c, g in labels.items() if g == "verify"]
    vdet = (100 if not verify_ids else
            round(100 * sum(1 for r in recs if r["cid"] in verify_ids
                            and r["verify_risk"] >= config.VERIFY_RISK_THRESHOLD) / len(verify_ids)))

    confusion = {}
    for r in recs:
        confusion.setdefault(gt(r), {"High": 0, "Medium": 0, "Low": 0})[pred_band(r["overall"])] += 1

    K = max(3, round(0.4 * n))
    kw = pipeline.keyword_only_ranking()[:K]
    kw_ids = {r["cid"] for r in kw}
    missed = [r["cid"] for r in recs if gt(r) in GOOD and r["cid"] not in kw_ids]
    recovered = [c for c in missed if c in flagged or
                 any(r["cid"] == c for r in recs[:10])]

    return {
        "n": n, "embedder": pipeline.embedder_name,
        "precision_at_5": p_at(5), "precision_at_10": p_at(10),
        "strong_recall_at_10": recall10,
        "hidden_fit_recovery": recovery, "verification_detection": vdet,
        "evidence_coverage": round(sum(r["scores"]["ev"] for r in recs) / max(1, n)),
        "parse_success": round(100 * sum(1 for r in recs if r["parse"] >= config.MIN_PARSE_CONFIDENCE) / max(1, n)),
        "manual_review_rate": round(100 * sum(1 for r in recs if r["status"] == "Needs Manual Parse Review") / max(1, n)),
        "confusion": confusion,
        "ats_comparison": {"keyword_shortlist": [r["cid"] for r in kw],
                           "missed_by_keyword": missed, "recovered": recovered},
        "auto_rejections": 0,
    }
