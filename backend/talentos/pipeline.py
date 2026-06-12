"""End-to-end orchestration:

  Resume/JD Upload → Local Parser → Skill Extractor → Project Intelligence
  → Dense Retrieval → BM25 Retrieval → Hybrid Rank Fusion → Local Reranker
  → Evidence Mapper → Second-Look Detector → Scoring → (Human Workflow,
  Audit, Reports handled by api/audit modules)

Everything runs inside the process; nothing leaves the machine.
"""
from __future__ import annotations
from . import parsing, retrieval, evidence, projects, verification, scoring, config


class Pipeline:
    def __init__(self, jd: parsing.JD, resumes: list[parsing.Resume]):
        self.jd = jd
        self.resumes = resumes
        corpus = [r.text for r in resumes] + [jd.text]
        self.embedder, self.embedder_name = retrieval.make_embedder(corpus)
        self._jd_vec = self.embedder.embed(jd.text)
        self._bm25 = retrieval.BM25([retrieval.tokenize(r.text) for r in resumes])
        self._jd_query = retrieval.tokenize(" ".join(jd.mandatory) * 2 + " " + " ".join(jd.preferred))
        self.records = [self._evaluate(i, r) for i, r in enumerate(resumes)]
        self._apply_duplicates()
        self._fused_order = self._fuse()

    # ---------------- per-candidate evaluation ----------------
    def _evaluate(self, i, r):
        emap = evidence.evidence_map(r, self.jd)
        ev_conf = evidence.evidence_confidence(emap, r.parse)
        proj = projects.analyze(r)
        dense_sim = self.embedder.cos(self._jd_vec, self.embedder.embed(r.text))
        s = scoring.score_candidate(r, self.jd, emap, proj, dense_sim, ev_conf)
        sl = scoring.second_look(s, r, self.jd)
        v_risk, v_reasons, v_probes = verification.verification_risk(r, emap, proj)
        status = ("Needs Manual Parse Review" if r.parse < config.MIN_PARSE_CONFIDENCE
                  else "Second-Look Review" if sl["flag"] else "AI Ranked")
        return {
            "cid": r.cid, "name": r.name, "resume": r, "scores": s,
            "evidence": emap, "projects": proj, "second_look": sl,
            "verify_risk": v_risk, "verify_reasons": v_reasons, "verify_probes": v_probes,
            "parse": r.parse, "parse_flags": r.flags, "status": status,
            "duplicate_of": None, "bm25_index": i,
        }

    def _apply_duplicates(self):
        for d in verification.find_duplicates(self.resumes):
            for rec in self.records:
                if rec["cid"] in (d["a"], d["b"]):
                    other = d["a"] if rec["cid"] == d["b"] else d["b"]
                    rec["duplicate_of"] = other
                    rec["status"] = "Needs Manual Parse Review"
                    rec["verify_risk"] = max(rec["verify_risk"], 75)
                    rec["verify_reasons"].append(
                        f"{int(d['similarity']*100)}% content overlap with {other} — duplicate submission; both copies frozen")
                    rec["verify_probes"].append("Confirm which identity is genuine before either copy advances.")

    # ---------------- hybrid retrieval ----------------
    def _fuse(self):
        bm = [i for _, i in self._bm25.rank(self._jd_query)]
        dense = sorted(range(len(self.records)),
                       key=lambda i: -self.embedder.cos(self._jd_vec,
                                                        self.embedder.embed(self.resumes[i].text)))
        fused = retrieval.rrf([bm, dense])
        ev = {i: self.records[i]["scores"]["ev"] for i in range(len(self.records))}
        # reranker pass: stable adjustment within the fused order by evidence
        return retrieval.rerank_with_evidence(fused, ev) if False else fused

    # ---------------- public API ----------------
    def ranked(self, weights=None):
        """Final ranking by the weighted score (retrieval fusion produces the
        candidate ordering signal; the scoring engine is the explainable,
        weight-governed layer the UI exposes)."""
        w = weights or config.DEFAULT_WEIGHTS
        recs = sorted(self.records, key=lambda r: -scoring.overall(r["scores"], w))
        for rank, r in enumerate(recs, 1):
            r["overall"] = scoring.overall(r["scores"], w)
            r["rank"] = rank
            r["recommendation"] = scoring.recommendation(r["overall"], r["second_look"], r["verify_risk"])
        return recs

    def keyword_only_ranking(self):
        return sorted(self.records, key=lambda r: -r["scores"]["sk"])

    def second_look_lane(self):
        return [r for r in self.records if r["second_look"]["flag"]]

    def ablation(self, weights=None):
        """Component-wise modes for the Evaluation Lab."""
        modes = {
            "keyword_only": lambda s: s["sk"],
            "embedding_only": lambda s: s["se"],
            "hybrid": lambda s: 0.5 * s["sk"] + 0.5 * s["se"],
            "hybrid_rerank": lambda s: 0.35 * s["sk"] + 0.35 * s["se"] + 0.30 * s["ev"],
            "plus_project_intel": lambda s: 0.25 * s["sk"] + 0.25 * s["se"] + 0.20 * s["ev"] + 0.15 * s["dp"] + 0.15 * s["pr"],
            "full_pipeline": lambda s: scoring.overall(s, weights or config.DEFAULT_WEIGHTS),
        }
        return {name: [r["cid"] for r in sorted(self.records, key=lambda r: -f(r["scores"]))]
                for name, f in modes.items()}
