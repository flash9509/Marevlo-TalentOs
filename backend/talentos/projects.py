"""Project Intelligence Engine: extract project/experience bullets and
classify their reality — production-grade vs research-grade vs
tutorial-pattern vs possible inflated claim. Advisory only: depth signals
support human judgment and never gate a candidate.
"""
from __future__ import annotations
import re
from . import parsing
from .evidence import PRODUCTION_SIGNALS, NUMBERS

TUTORIAL_MARKERS = re.compile(r"(titanic|mnist|imdb|iris dataset|kaggle|telco churn|tutorial|udemy|coursera capstone)", re.I)
RESEARCH_MARKERS = re.compile(r"(thesis|dissertation|published|paper|journal|conference|peer.review|preprint)", re.I)
SCALE_CLAIMS = re.compile(r"(millions? of (requests|users)|at scale|large.scale|enterprise.grade)", re.I)
INFRA_NOUNS = re.compile(r"(docker|kubernetes|k8s|aws|gcp|azure|nginx|load balanc|postgres|kafka|airflow|nomad|consul|nats|spark|databricks|redis|warehouse|inference|tensorrt|onnx|gstreamer|ci/cd|pipeline|cluster|server|celery)", re.I)
OWNERSHIP = re.compile(r"\b(led|owned|designed|architected|built|implemented|developed|wrote|operate[sd]?|maintained|redesigned)\b", re.I)


def classify_bullet(text: str):
    prod = bool(PRODUCTION_SIGNALS.search(text))
    infra = bool(INFRA_NOUNS.search(text))
    num = bool(NUMBERS.search(text))
    if TUTORIAL_MARKERS.search(text):
        label = "Tutorial-pattern"
    elif SCALE_CLAIMS.search(text) and not infra:
        label = "Possible inflated claim"
    elif RESEARCH_MARKERS.search(text):
        label = "Research-grade"
    elif prod and infra and num:
        label = "Production-grade"
    elif prod or infra:
        label = "Applied"
    else:
        label = "Needs verification"
    depth = 25
    depth += 22 if infra else 0
    depth += 22 if num else 0
    depth += 18 if prod else 0
    depth += 13 if OWNERSHIP.search(text) else 0
    if label == "Tutorial-pattern":
        depth = min(depth, 35)
    if label == "Possible inflated claim":
        depth = min(depth, 30)
    return label, min(95, depth)


def analyze(resume: parsing.Resume):
    src = "\n".join(resume.sections.get(k, "") for k in
                    ("experience", "work experience", "employment", "projects",
                     "summary", "profile", "objective", "header"))
    bullets = [s for s in parsing.sentences(src) if len(s) > 30][:24]
    items = []
    for b in bullets:
        label, depth = classify_bullet(b)
        items.append({"text": b[:240], "label": label, "depth": depth})
    if not items:
        return {"items": [], "depth": 25, "production": 20, "inflated": 0, "tutorial": 0}
    top = sorted(items, key=lambda x: -x["depth"])[:4]
    depth = int(sum(i["depth"] for i in top) / len(top))
    prod_hits = sum(1 for i in items if i["label"] == "Production-grade")
    production = min(95, 25 + prod_hits * 16 +
                     (12 if any("monitor" in i["text"].lower() or "on-call" in i["text"].lower()
                                or "sla" in i["text"].lower() or "rollback" in i["text"].lower() for i in items) else 0))
    return {"items": items, "depth": depth, "production": production,
            "inflated": sum(1 for i in items if i["label"] == "Possible inflated claim"),
            "tutorial": sum(1 for i in items if i["label"] == "Tutorial-pattern")}
