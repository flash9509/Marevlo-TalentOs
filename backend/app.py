"""Marevlo TalentOS — FastAPI service.

Run:  uvicorn app:app --reload --port 8000
Docs: http://localhost:8000/docs

The service holds the three benchmark pipelines in memory at startup; uploads
create additional in-memory batches. All processing is local — no external
AI APIs anywhere.
"""
from __future__ import annotations
import io, json, csv as csvmod
from pathlib import Path
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from talentos import parsing, pipeline as pl, metrics, anonymize, audit, config
from talentos.demo import load_jd, load_resumes, DATA

app = FastAPI(title="Marevlo TalentOS", version="0.9.0",
              description="Explainable, privacy-first technical hiring intelligence. On-prem; no external AI APIs.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

STATE = {"weights": dict(config.DEFAULT_WEIGHTS), "weights_version": config.WEIGHTS_VERSION,
         "pipelines": {}, "labels": {}, "audit": None}

ROLES = [("REQ-0417", "be"), ("REQ-0421", "ds"), ("REQ-0428", "de")]


@app.on_event("startup")
def boot():
    STATE["labels"] = json.loads((DATA / "labels.json").read_text())
    for jid, prefix in ROLES:
        STATE["pipelines"][jid] = pl.Pipeline(load_jd(jid), load_resumes(prefix))
    STATE["audit"] = audit.connect()


def pipe(jid: str) -> pl.Pipeline:
    if jid not in STATE["pipelines"]:
        raise HTTPException(404, f"unknown requisition {jid}")
    return STATE["pipelines"][jid]


def public_record(r, full=False):
    out = {
        "cid": r["cid"], "name": r["name"], "overall": r.get("overall"),
        "rank": r.get("rank"), "scores": r["scores"], "parse": r["parse"],
        "status": r["status"], "recommendation": r.get("recommendation"),
        "second_look": r["second_look"], "verify_risk": r["verify_risk"],
        "verify_reasons": r["verify_reasons"], "duplicate_of": r["duplicate_of"],
    }
    if full:
        out.update({"evidence": r["evidence"], "projects": r["projects"],
                    "verify_probes": r["verify_probes"], "parse_flags": r["parse_flags"],
                    "timeline": r["resume"].timeline, "skills": sorted(r["resume"].skills)})
    return out


@app.get("/roles")
def roles():
    return [{"jid": jid, "title": pipe(jid).jd.title,
             "mandatory": pipe(jid).jd.mandatory, "preferred": pipe(jid).jd.preferred}
            for jid, _ in ROLES]


@app.get("/rank/{jid}")
def rank(jid: str):
    return [public_record(r) for r in pipe(jid).ranked(STATE["weights"])]


@app.get("/candidate/{jid}/{cid}")
def candidate(jid: str, cid: str):
    for r in pipe(jid).ranked(STATE["weights"]):
        if r["cid"] == cid:
            return public_record(r, full=True)
    raise HTTPException(404, "candidate not found")


@app.get("/second-look/{jid}")
def second_look(jid: str):
    p = pipe(jid)
    p.ranked(STATE["weights"])
    return [public_record(r, full=True) for r in p.second_look_lane()]


@app.get("/metrics/{jid}")
def metrics_route(jid: str):
    return metrics.evaluate(pipe(jid), STATE["labels"].get(jid, {}), STATE["weights"])


@app.get("/ablation/{jid}")
def ablation(jid: str):
    return pipe(jid).ablation(STATE["weights"])


@app.get("/bias-test/{jid}")
def bias_test(jid: str):
    return anonymize.name_bias_test(pipe(jid), STATE["weights"])


@app.get("/weights")
def get_weights():
    return {"weights": STATE["weights"], "version": STATE["weights_version"]}


class Weights(BaseModel):
    sk: int; se: int; dp: int; pr: int; ev: int; ex: int; to: int


@app.put("/weights")
def put_weights(w: Weights):
    STATE["weights"] = w.dict()
    STATE["weights_version"] = config.WEIGHTS_VERSION + "-modified"
    return get_weights()


class Decision(BaseModel):
    jid: str; cid: str; decision: str; reviewer: str; reason: str = ""


@app.post("/decision")
def decision(d: Decision):
    rec = next((r for r in pipe(d.jid).ranked(STATE["weights"]) if r["cid"] == d.cid), None)
    if not rec:
        raise HTTPException(404, "candidate not found")
    if "auto" in d.decision.lower():
        raise HTTPException(400, "No automated terminal decisions: the system has no rejection authority.")
    audit.log_decision(STATE["audit"], rec["name"], rec["recommendation"], d.decision,
                       d.reviewer, d.reason, evidence_snapshot=rec["evidence"],
                       weights_version=STATE["weights_version"],
                       model_version=pipe(d.jid).embedder_name)
    return {"ok": True}


@app.get("/audit")
def audit_list():
    return audit.list_decisions(STATE["audit"])


@app.post("/upload/{jid}")
async def upload(jid: str, files: list[UploadFile]):
    """Add resumes to a requisition (text files; PDF if pdfplumber installed)."""
    jd = pipe(jid).jd
    resumes = list(pipe(jid).resumes)
    for f in files:
        raw = (await f.read())
        if f.filename.lower().endswith(".pdf"):
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(raw)) as pdf:
                    text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            except ImportError:
                raise HTTPException(415, "PDF support requires `pip install pdfplumber`")
        else:
            text = raw.decode("utf-8", errors="replace")
        resumes.append(parsing.parse_resume(Path(f.filename).stem, text))
    STATE["pipelines"][jid] = pl.Pipeline(jd, resumes)
    return {"ok": True, "total": len(resumes)}


@app.get("/export/{jid}/ranking.csv")
def export_ranking(jid: str):
    buf = io.StringIO()
    w = csvmod.writer(buf)
    w.writerow(["rank", "cid", "name", "overall", "kw", "semantic", "depth",
                "production", "evidence", "verify_risk", "second_look", "status", "recommendation"])
    for r in pipe(jid).ranked(STATE["weights"]):
        s = r["scores"]
        w.writerow([r["rank"], r["cid"], r["name"], r["overall"], s["sk"], s["se"], s["dp"],
                    s["pr"], s["ev"], r["verify_risk"], r["second_look"]["flag"], r["status"],
                    r["recommendation"]])
    buf.seek(0)
    return StreamingResponse(iter([buf.read()]), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={jid}_ranking.csv"})


@app.get("/export/audit.csv")
def export_audit():
    buf = io.StringIO()
    w = csvmod.writer(buf)
    rows = audit.list_decisions(STATE["audit"])
    w.writerow(["id", "candidate", "ai_recommendation", "human_decision", "override",
                "reviewer", "reason", "weights_version", "model_version", "ts"])
    for r in rows:
        w.writerow([r[k] for k in ("id", "candidate", "ai_recommendation", "human_decision",
                                   "override", "reviewer", "reason", "weights_version",
                                   "model_version", "ts")])
    buf.seek(0)
    return StreamingResponse(iter([buf.read()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=audit.csv"})
