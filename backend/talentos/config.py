"""Marevlo TalentOS — central configuration.

All thresholds and weights live here so governance screens can expose and
version them. Weight changes are versioned in the audit trail.
"""

DEFAULT_WEIGHTS = {
    "sk": 25,  # mandatory skill match
    "se": 20,  # semantic role fit
    "dp": 15,  # project depth
    "pr": 15,  # production maturity
    "ev": 10,  # evidence confidence
    "ex": 10,  # experience alignment
    "to": 5,   # tooling ecosystem fit
}

WEIGHTS_VERSION = "v1.0"

# Second-look detector: semantic-minus-keyword divergence that signals
# "strong meaning, weak vocabulary" — the recall-risk profile.
SECOND_LOOK_DIVERGENCE = 12
SECOND_LOOK_MIN_DEPTH = 55

# Verification flags
VERIFY_TIMELINE_SLACK_YEARS = 1.5     # stated minus dated experience tolerance
VERIFY_SKILL_EVIDENCE_RATIO = 3.0     # skills listed per evidenced skill
VERIFY_RISK_THRESHOLD = 60

# Duplicate detection
SHINGLE_SIZE = 5
DUPLICATE_JACCARD = 0.80

# Parsing
MIN_PARSE_CONFIDENCE = 70             # below this → Needs Manual Parse Review

# Retrieval
RRF_K = 60
BM25_K1 = 1.5
BM25_B = 0.75

# Embedding backend: "auto" tries sentence-transformers, falls back to the
# deterministic lexical-semantic vectorizer. Set "st" to force transformers,
# "lexical" to force the dependency-free fallback (used in air-gapped CI).
EMBEDDING_BACKEND = "auto"
ST_MODEL = "BAAI/bge-small-en-v1.5"

PRED_HIGH = 75
PRED_MEDIUM = 55

AUDIT_DB = "talentos_audit.sqlite3"
