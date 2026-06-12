"""Hybrid retrieval: BM25 (implemented from scratch), a dense-embedding
backend with a deterministic lexical-semantic fallback, and Reciprocal Rank
Fusion. No external API is ever called.

Backend selection (config.EMBEDDING_BACKEND):
  "auto"    -> sentence-transformers if installed, else lexical fallback
  "st"      -> require sentence-transformers (BGE/E5/GTE class, local)
  "lexical" -> dependency-free fallback: taxonomy-canonicalized TF-IDF
               blended with character-trigram hashing. Deterministic,
               air-gap friendly, and honest about being lexical-semantic
               rather than learned-dense.
"""
from __future__ import annotations
import math, re, hashlib
from collections import Counter
from . import config, taxonomy


def tokenize(text: str):
    return re.findall(r"[a-z0-9+#.]+", text.lower())


def canonical_tokens(text: str):
    """Tokens plus canonical-skill and semantic-class expansions. This is what
    lets a Flask resume meet a FastAPI JD in the 'dense' channel."""
    toks = tokenize(text)
    skills = taxonomy.extract_skills(text)
    for s in skills:
        toks.append(f"skill::{s}")
        for c in taxonomy.classes_of(s):
            toks.append(f"class::{c}")
    return toks


class BM25:
    def __init__(self, docs_tokens, k1=config.BM25_K1, b=config.BM25_B):
        self.k1, self.b = k1, b
        self.docs = docs_tokens
        self.N = len(docs_tokens)
        self.avgdl = sum(len(d) for d in docs_tokens) / max(1, self.N)
        self.tf = [Counter(d) for d in docs_tokens]
        df = Counter()
        for d in docs_tokens:
            for t in set(d):
                df[t] += 1
        self.idf = {t: math.log(1 + (self.N - n + 0.5) / (n + 0.5)) for t, n in df.items()}

    def score(self, query_tokens, i):
        s, dl = 0.0, len(self.docs[i])
        for q in query_tokens:
            f = self.tf[i].get(q, 0)
            if not f:
                continue
            idf = self.idf.get(q, 0.0)
            s += idf * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / self.avgdl))
        return s

    def rank(self, query_tokens):
        scores = [(self.score(query_tokens, i), i) for i in range(self.N)]
        return sorted(scores, key=lambda x: -x[0])


# ---------------------------- embedding backends ----------------------------

class LexicalSemanticEmbedder:
    """Deterministic fallback: TF-IDF over canonical tokens (taxonomy expanded)
    blended with hashed character trigrams. Cosine similarity."""
    DIM = 512

    def __init__(self, corpus_texts):
        toks = [canonical_tokens(t) for t in corpus_texts]
        df = Counter()
        for d in toks:
            for t in set(d):
                df[t] += 1
        self.N = len(corpus_texts)
        self.idf = {t: math.log((self.N + 1) / (n + 0.5)) for t, n in df.items()}

    def _hash(self, s):
        return int(hashlib.md5(s.encode()).hexdigest()[:8], 16) % self.DIM

    def embed(self, text: str):
        v = [0.0] * self.DIM
        tf = Counter(canonical_tokens(text))
        for t, f in tf.items():
            w = (1 + math.log(f)) * self.idf.get(t, math.log(self.N + 1))
            if t.startswith(("skill::", "class::")):
                w *= 2.2  # canonical semantics dominate raw surface forms
            v[self._hash(t)] += w
        low = re.sub(r"\s+", " ", text.lower())
        for i in range(len(low) - 2):
            v[self._hash("tri::" + low[i:i + 3])] += 0.18
        n = math.sqrt(sum(x * x for x in v)) or 1.0
        return [x / n for x in v]

    @staticmethod
    def cos(a, b):
        return sum(x * y for x, y in zip(a, b))


class STEmbedder:
    def __init__(self, corpus_texts):
        from sentence_transformers import SentenceTransformer  # local model
        self.model = SentenceTransformer(config.ST_MODEL)

    def embed(self, text: str):
        return self.model.encode([text], normalize_embeddings=True)[0].tolist()

    @staticmethod
    def cos(a, b):
        return sum(x * y for x, y in zip(a, b))


def make_embedder(corpus_texts):
    mode = config.EMBEDDING_BACKEND
    if mode in ("auto", "st"):
        try:
            return STEmbedder(corpus_texts), "sentence-transformers:" + config.ST_MODEL
        except Exception:
            if mode == "st":
                raise
    return LexicalSemanticEmbedder(corpus_texts), "lexical-semantic-fallback"


def rrf(rankings, k=config.RRF_K):
    """Reciprocal Rank Fusion across ranked lists of doc indices."""
    fused = Counter()
    for ranking in rankings:
        for rank, idx in enumerate(ranking):
            fused[idx] += 1.0 / (k + rank + 1)
    return [i for i, _ in fused.most_common()]


def rerank_with_evidence(order, evidence_scores):
    """Local 'reranker': stable re-sort of the fused order by evidence
    confidence within score bands. A cross-encoder slots in here in
    production deployments — the interface is the same."""
    return sorted(order, key=lambda i: (-evidence_scores.get(i, 0)))
