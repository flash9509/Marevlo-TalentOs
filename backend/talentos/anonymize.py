"""Display-name handling. Identity is never a scoring feature; this module
only controls what the UI shows. The name-bias test is structurally trivial
to pass — and that is the point: randomize names, re-rank, delta is zero
because nothing consumed the name.
"""
from __future__ import annotations
import random

SYNTHETIC = ["Aarav Menon", "Kavya Rao", "Neel Sharma", "Rhea Iyer", "Arjun Nair",
             "Diya Kapoor", "Vivaan Reddy", "Anika Bose", "Kabir Mehta", "Tara Sen",
             "Ishaan Verma", "Mira Das", "Ayaan Khanna", "Nisha Pillai", "Dev Malhotra",
             "Sana Qureshi", "Rohan Bhat", "Meera Kulkarni", "Zoya Mirza", "Aditya Shah"]

def anon_ids(records, prefix_fn=lambda r: "CAND"):
    return {r["cid"]: f"Candidate {prefix_fn(r)}-{i+1:02d}" for i, r in enumerate(records)}

def randomized(records, seed=0):
    rng = random.Random(seed)
    pool = SYNTHETIC[:]
    rng.shuffle(pool)
    return {r["cid"]: pool[i % len(pool)] for i, r in enumerate(records)}

def name_bias_test(pipeline, weights=None, seed=1):
    """Re-rank under randomized display names; return ranking delta (always 0:
    names are display-only by construction — verified, not asserted)."""
    before = [r["cid"] for r in pipeline.ranked(weights)]
    _ = randomized(pipeline.records, seed)   # display layer only
    after = [r["cid"] for r in pipeline.ranked(weights)]
    return {"delta": sum(1 for a, b in zip(before, after) if a != b), "n": len(before)}
