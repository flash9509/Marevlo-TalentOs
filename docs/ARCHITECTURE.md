# Architecture & Design Decisions

## Processing flow
JD + Resume Upload → Local Parser → Skill Extractor → Project Intelligence
Engine → Dense Retrieval ∥ BM25 Retrieval → Hybrid Rank Fusion (RRF) →
Evidence Mapper → Second-Look Detector → Scoring (weight-governed) →
Human Workflow → Audit Store → Reports.

Every stage runs in-process inside the customer network boundary.

## Why the keyword channel is deliberately naive
`scoring.skill_match` replicates a literal-token ATS on purpose. If the keyword
channel were taxonomy-aware, the semantic-vs-keyword divergence — the signal
that powers hidden-fit recovery — would collapse to zero and the product's
signature capability would have nothing to detect. The honest framing: the
keyword channel is the baseline being outperformed; the semantic channel
(taxonomy classes + adjacency + dense similarity) is the product.

## Second-Look triggers
- **A. Divergence**: `semantic − keyword ≥ 12` with project depth ≥ 55.
  Catches "strong meaning, weak vocabulary" (Flask engineer vs FastAPI JD).
- **B. Specialist shape**: ≥ 2 mandatory-or-preferred requirements satisfied
  *only* through semantic-class or adjacency mappings, with depth ≥ 55.
  Catches equivalent capability under different labels (Nomad/NATS operator
  vs K8s/Kafka JD; TensorRT serving specialist vs MLOps JD).
Both routes end identically: a flag for mandatory human review. Never an
auto-shortlist; never a rejection.

## Verification heuristics (all advisory)
- Stated years − dated years > 1.5 (education spans excluded from dated history)
- ≥ 24 listed technologies, or ≥ 14 with skills-to-evidence ratio > 3
- Scale/deployment claims with < 1 year dated history
- No strong evidence anywhere despite a broad skill list
- Executive titles alongside very short dated history
Each adds risk and a concrete probing question for the interview panel.

## Known limitations (current revision)
1. The lexical-semantic fallback embedder is deterministic and vocabulary-
   driven; nuanced paraphrase similarity requires the sentence-transformers
   backend (one config flag).
2. Section/timeline extraction is regex-heuristic; highly designed resume
   templates degrade to manual-parse review (by policy, never silent loss).
3. Depth/production scoring is signal-counting, not semantic understanding of
   project narratives; it is calibrated as an advisory ordering signal only.
4. Benchmark pools are small by design (every case is hand-labelled to
   exercise a specific code path); metrics on them are illustrative.
5. SQLite audit store is single-node; the schema is PostgreSQL-compatible and
   deployed instances should use PostgreSQL.

## Production upgrade path
sentence-transformers (BGE/E5/GTE) → Qdrant vector store → cross-encoder
reranker at `retrieval.rerank_with_evidence` (interface already in place) →
PostgreSQL audit → RBAC at the API gateway. No architectural changes required.
