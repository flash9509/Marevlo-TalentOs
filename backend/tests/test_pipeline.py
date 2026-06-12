"""Quality gates for the Marevlo TalentOS pipeline. Runs with plain Python
(no pytest needed):   cd backend && python tests/test_pipeline.py
These encode the product's behavioral guarantees — the things a buyer's
technical panel will probe.
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from talentos import pipeline as pl, config, anonymize, parsing, scoring
from talentos.demo import load_jd, load_resumes, DATA

LABELS = json.loads((DATA / "labels.json").read_text())
PIPES = {jid: pl.Pipeline(load_jd(jid), load_resumes(pfx))
         for jid, pfx in [("REQ-0417", "be"), ("REQ-0421", "ds"), ("REQ-0428", "de")]}
PASS = []


def check(name, cond, detail=""):
    PASS.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (f"  [{detail}]" if detail and not cond else ""))


# 1. Hidden-fit candidates are flagged to the second-look lane, never lost.
for jid, labels in LABELS.items():
    if jid not in PIPES: continue
    flagged = {r["cid"] for r in PIPES[jid].second_look_lane()}
    for cid, gt in labels.items():
        if gt == "hidden":
            check(f"hidden-fit flagged: {cid}", cid in flagged, f"flagged={flagged}")

# 2. Verification-risk profiles are flagged (advisory, with probing questions).
for jid, labels in LABELS.items():
    if jid not in PIPES: continue
    recs = {r["cid"]: r for r in PIPES[jid].ranked()}
    for cid, gt in labels.items():
        if gt == "verify":
            r = recs[cid]
            check(f"verification flagged: {cid}",
                  r["verify_risk"] >= config.VERIFY_RISK_THRESHOLD, f"risk={r['verify_risk']}")
            check(f"verification has probes: {cid}", len(r["verify_probes"]) > 0)

# 3. Duplicates: both copies frozen for human disposition.
recs = {r["cid"]: r for r in PIPES["REQ-0417"].ranked()}
check("duplicate copy A frozen", recs["be_tara_sen"]["duplicate_of"] is not None)
check("duplicate copy B frozen", recs["be_tara_s_duplicate"]["duplicate_of"] is not None)
check("duplicates routed to manual review",
      recs["be_tara_sen"]["status"] == "Needs Manual Parse Review")

# 4. Messy resume: low parse confidence reduces evidence weight but the
#    candidate is still ranked — never silently dropped.
messy = recs["be_unnamed_messy"]
check("messy resume still evaluated", messy["rank"] is not None and messy["overall"] is not None)
check("messy resume routed to manual review", messy["status"] == "Needs Manual Parse Review")
check("messy parse below threshold detected", messy["parse"] < config.MIN_PARSE_CONFIDENCE)

# 5. Name-bias: randomizing display names cannot move the ranking.
for jid in PIPES:
    res = anonymize.name_bias_test(PIPES[jid])
    check(f"name bias delta zero: {jid}", res["delta"] == 0, str(res))

# 6. Weight governance: changing weights visibly re-orders the ranking.
base = [r["cid"] for r in PIPES["REQ-0421"].ranked(config.DEFAULT_WEIGHTS)]
heavy_depth = dict(config.DEFAULT_WEIGHTS, dp=50, sk=5)
moved = [r["cid"] for r in PIPES["REQ-0421"].ranked(heavy_depth)]
check("weight change re-orders ranking", base != moved)

# 7. No rejection authority exists anywhere in the pipeline.
for jid in PIPES:
    for r in PIPES[jid].ranked():
        assert "reject" not in r["status"].lower()
        assert "reject" not in r["recommendation"].lower()
check("no auto-rejection state in any status or recommendation", True)

# 8. Divergence sanity: the naive keyword channel must under-score the
#    hidden-fit Flask candidate relative to the semantic channel.
tara = recs["be_tara_sen"]["scores"]
check("keyword channel naive (Tara kw < sem)", tara["sk"] < tara["se"],
      f"kw={tara['sk']} sem={tara['se']}")

# 9. Evidence traceability: every mandatory requirement gets a mapped entry.
jd = PIPES["REQ-0417"].jd
for r in PIPES["REQ-0417"].ranked():
    assert len(r["evidence"]) == len(jd.mandatory)
check("every mandatory requirement has an evidence entry for every candidate", True)

# 10. PII never reaches downstream text.
sample = parsing.parse_resume("t", "Jane Roe\njane@example.com +91 98765 43210\nEXPERIENCE\nBuilt Flask APIs 2020 - 2023")
check("emails/phones stripped before processing",
      "example.com" not in sample.text and "98765" not in sample.text)

fails = [n for n, ok in PASS if not ok]
print(f"\n{len(PASS) - len(fails)}/{len(PASS)} checks passed")
sys.exit(1 if fails else 0)
