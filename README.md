# Marevlo TalentOS — Reference Implementation

**AI-powered technical hiring intelligence, explainability, and workforce evaluation.**
On-prem by design. No external AI APIs anywhere in the path. No rejection authority anywhere in the code.

This repository contains the complete reference implementation: every algorithm
behind the product demo as real, runnable, inspectable code.

```
marevlo-talentos/
├── backend/
│   ├── app.py                  FastAPI service (rank, evidence, second-look, audit, exports)
│   ├── requirements.txt
│   ├── talentos/               The algorithms
│   │   ├── config.py           Weights, thresholds — everything governance exposes
│   │   ├── taxonomy.py         Skill canonicalization, semantic classes, adjacency engine
│   │   ├── parsing.py          PII stripping, sectioning, timeline extraction, parse confidence
│   │   ├── retrieval.py        BM25 (from scratch), embedding backends, Reciprocal Rank Fusion
│   │   ├── evidence.py         Requirement → evidence mapping (Direct/Semantic/Adjacent/Inferred/Missing)
│   │   ├── projects.py         Project Intelligence Engine (production/research/tutorial/inflated)
│   │   ├── verification.py     Timeline consistency, skill-stuffing, duplicates (shingle Jaccard)
│   │   ├── scoring.py          7-dimension scorer, naive-ATS keyword channel, Second-Look detector
│   │   ├── pipeline.py         End-to-end orchestration
│   │   ├── metrics.py          Precision@k, recovery rates, confusion matrix, ATS comparison
│   │   ├── audit.py            Append-only decision store (SQLite here; PostgreSQL schema-compatible)
│   │   ├── anonymize.py        Display names, name-bias test
│   │   └── demo.py             CLI evaluation harness
│   ├── data/                   Benchmark batch: 3 JDs, 15 synthetic resumes, ground-truth labels
│   └── tests/test_pipeline.py  24 behavioral quality gates
├── frontend/                   React demo UI (Vite + Tailwind)
└── docs/ARCHITECTURE.md
```

## Quickstart

**See every algorithm work in 30 seconds (zero dependencies — pure stdlib):**
```bash
cd backend
python3 -m talentos.demo                 # full benchmark: 3 roles, all flags, metrics
python3 -m talentos.demo --jd REQ-0417   # one role
python3 tests/test_pipeline.py           # 24 behavioral quality gates
```

**Run the API:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000     # interactive docs at /docs
```

**Run the demo UI:**
```bash
cd frontend
npm install
npm run dev                              # http://localhost:5173
```

The UI ships with an embedded 37-candidate dataset so it demos standalone; the
Vite proxy is preconfigured (`/api → :8000`) for wiring live backend data.

## The algorithms, mapped to the product story

| Product claim | Where the code is | How it works |
|---|---|---|
| Hybrid ranking | `retrieval.py` | BM25 implemented from scratch + dense channel, fused with Reciprocal Rank Fusion |
| Hidden-fit recovery | `scoring.py::second_look` | Two triggers: (A) semantic-vs-keyword divergence ≥ threshold with project depth; (B) "specialist shape" — ≥2 requirements satisfied *only* via semantic-class or adjacency mappings |
| Honest keyword baseline | `scoring.py::skill_match` | Deliberately replicates a naive ATS: literal token presence, no synonyms, no stemming. The intelligence lives in the semantic channel; the *divergence* between channels is the recall-risk signal |
| Evidence-linked explanations | `evidence.py` | Every JD requirement maps to its best resume sentence with match type and strength; no score exists without a traceable line |
| Project Depth Intelligence | `projects.py` | Bullet-level classification: production-grade / research-grade / tutorial-pattern / possible inflated claim. Advisory only |
| Verification flags | `verification.py` | Stated-vs-dated experience (education spans excluded), skill-stuffing ratios, scale claims without infrastructure or history. Every flag carries probing questions |
| Duplicate detection | `verification.py` | 5-token shingle Jaccard; both copies freeze for human disposition |
| Name-bias test | `anonymize.py` | Identity is never a scoring feature, so randomizing names yields ranking delta 0 — verified at runtime, not asserted |
| No auto-rejection | everywhere | No rejection state exists in the pipeline; `tests/` asserts it |
| Audit trail | `audit.py` | Append-only; freezes AI recommendation, model + weight versions, and evidence snapshot per decision |

## Embedding backends — read this before any buyer conversation

`config.EMBEDDING_BACKEND`:

- `"auto"` (default): uses **sentence-transformers** (`BAAI/bge-small-en-v1.5`,
  fully local) if installed; otherwise falls back to the deterministic
  **lexical-semantic vectorizer** (taxonomy-canonicalized TF-IDF + hashed
  character trigrams).
- The fallback is honest about what it is: *lexical-semantic*, not learned-dense.
  It exists so the entire system runs and demos on the Python standard library
  alone — including air-gapped environments. For production deployments,
  install sentence-transformers (one flag, no code changes) and optionally
  swap the in-memory store for Qdrant.

## Benchmark numbers are benchmark numbers

`talentos.demo` and `/metrics` report evaluation-harness results on a small
**labelled synthetic batch** designed to exercise every code path (hidden-fit,
verification, duplicates, parse failures). They demonstrate that the machinery
works as designed. They are **not** production performance claims, and the UI
labels them accordingly. Known limitations are documented in
`docs/ARCHITECTURE.md` — including ones we found while building (e.g., education
date-spans originally counted toward professional history and masked a
verification flag; fixed, and the test suite now pins the behavior).

## Privacy posture

- Direct identifiers (email, phone, URLs) are stripped at parse time, before
  any downstream component sees text (`parsing.strip_pii`).
- Names are display-only and never enter scoring.
- All candidate data in `backend/data/` and the frontend is fully synthetic.
- Everything runs inside your network boundary. There is no telemetry.

— Marevlo Research · reference implementation v0.9.0
