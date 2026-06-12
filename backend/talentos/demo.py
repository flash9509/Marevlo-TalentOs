"""CLI demo: run the full pipeline on the benchmark batch and print the
evaluation report. This is the fastest way to see every algorithm working:

    cd backend && python -m talentos.demo            # all three roles
    python -m talentos.demo --jd REQ-0417            # one role
"""
from __future__ import annotations
import json, sys
from pathlib import Path
from . import parsing, pipeline as pl, metrics, anonymize, config, scoring

DATA = Path(__file__).resolve().parent.parent / "data"


def load_jd(jid: str):
    path = next(DATA.glob(f"jds/{jid}*.txt"))
    return parsing.parse_jd(jid, path.read_text())


def load_resumes(prefix: str):
    out = []
    for p in sorted(DATA.glob(f"resumes/{prefix}_*.txt")):
        out.append(parsing.parse_resume(p.stem, p.read_text()))
    return out


def run(jid: str, prefix: str, verbose=True):
    jd = load_jd(jid)
    resumes = load_resumes(prefix)
    labels = json.loads((DATA / "labels.json").read_text()).get(jid, {})
    pipe = pl.Pipeline(jd, resumes)
    report = metrics.evaluate(pipe, labels)
    if not verbose:
        return pipe, report
    bar = "=" * 78
    print(f"\n{bar}\n{jd.title}  ({jid})  ·  {len(resumes)} resumes  ·  embedder: {report['embedder']}\n{bar}")
    print(f"{'#':>2}  {'candidate':<24}{'overall':>7}{'kw':>5}{'sem':>5}{'depth':>6}{'ev':>5}  flags")
    for r in pipe.ranked():
        flags = []
        if r["second_look"]["flag"]:
            flags.append("SECOND-LOOK")
        if r["verify_risk"] >= config.VERIFY_RISK_THRESHOLD:
            flags.append(f"VERIFY({r['verify_risk']})")
        if r["duplicate_of"]:
            flags.append(f"DUP→{r['duplicate_of']}")
        if r["parse"] < config.MIN_PARSE_CONFIDENCE:
            flags.append(f"PARSE({r['parse']})")
        s = r["scores"]
        print(f"{r['rank']:>2}  {r['name'][:23]:<24}{r['overall']:>7}{s['sk']:>5}{s['se']:>5}"
              f"{s['dp']:>6}{s['ev']:>5}  {' '.join(flags)}")
    print("\n-- second-look lane " + "-" * 58)
    for r in pipe.second_look_lane():
        sl = r["second_look"]
        print(f"  {r['name']}: divergence +{sl['divergence']}, confidence {sl['confidence']}%")
        print(f"    missed:   {sl['missed']}")
        print(f"    surfaced: {sl['surfaced'][:140]}")
    print("\n-- verification flags " + "-" * 56)
    for r in pipe.ranked():
        if r["verify_risk"] >= config.VERIFY_RISK_THRESHOLD:
            print(f"  {r['name']} (risk {r['verify_risk']}): " + "; ".join(r["verify_reasons"]))
    print("\n-- benchmark metrics (labelled demo data — not production claims) " + "-" * 12)
    for k in ("precision_at_5", "precision_at_10", "strong_recall_at_10",
              "hidden_fit_recovery", "verification_detection", "evidence_coverage",
              "parse_success", "manual_review_rate", "auto_rejections"):
        print(f"  {k:<26}{report[k]}")
    print("  ats: keyword-shortlist missed -> " + ", ".join(report["ats_comparison"]["missed_by_keyword"]))
    bias = anonymize.name_bias_test(pipe)
    print(f"\n  name bias test: randomized {bias['n']} names -> ranking delta {bias['delta']} (identity is not a feature)")
    return pipe, report


def main():
    jids = [("REQ-0417", "be"), ("REQ-0421", "ds"), ("REQ-0428", "de")]
    if "--jd" in sys.argv:
        want = sys.argv[sys.argv.index("--jd") + 1]
        jids = [x for x in jids if x[0] == want]
    for jid, prefix in jids:
        run(jid, prefix)
    print("\nDone. Every score above is traceable: python -c \"from talentos.demo import run; "
          "p,_=run('REQ-0417','be',verbose=False); import json; "
          "print(json.dumps(p.ranked()[0]['evidence'], indent=2))\"")


if __name__ == "__main__":
    main()
