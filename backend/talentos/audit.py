"""Append-only audit store (SQLite for portability; the schema is
PostgreSQL-compatible for deployed instances).

Every decision freezes: the AI recommendation at decision time, the human
decision, override status, reviewer, reason, model + weight versions, and an
evidence snapshot. No rows are ever updated or deleted.
"""
from __future__ import annotations
import sqlite3, json, datetime
from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate TEXT NOT NULL,
  ai_recommendation TEXT NOT NULL,
  human_decision TEXT NOT NULL,
  override INTEGER NOT NULL,
  reviewer TEXT NOT NULL,
  reason TEXT,
  weights_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  evidence_snapshot TEXT NOT NULL,
  ts TEXT NOT NULL
);
"""

def connect(path=None):
    con = sqlite3.connect(path or config.AUDIT_DB, check_same_thread=False)  # reference impl; deployed: PostgreSQL
    con.execute(SCHEMA)
    return con

def log_decision(con, candidate, ai_rec, human, reviewer, reason,
                 evidence_snapshot, weights_version=config.WEIGHTS_VERSION,
                 model_version="local-embed", override=None):
    if override is None:
        # auto-detect contradiction between AI band and human action
        override = (("Strong fit" in ai_rec and "Reject" in human)
                    or ("Low ranking" in ai_rec and "Shortlist" in human))
    con.execute(
        "INSERT INTO decisions (candidate, ai_recommendation, human_decision, override,"
        " reviewer, reason, weights_version, model_version, evidence_snapshot, ts)"
        " VALUES (?,?,?,?,?,?,?,?,?,?)",
        (candidate, ai_rec, human, int(bool(override)), reviewer, reason or "—",
         weights_version, model_version, json.dumps(evidence_snapshot)[:4000],
         datetime.datetime.utcnow().isoformat(timespec="seconds")))
    con.commit()

def list_decisions(con):
    cur = con.execute("SELECT id, candidate, ai_recommendation, human_decision,"
                      " override, reviewer, reason, weights_version, model_version, ts"
                      " FROM decisions ORDER BY id DESC")
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]
