"""Skill taxonomy, aliases, and the adjacency engine.

The taxonomy canonicalizes vocabulary (Flask and FastAPI both map to the
`python-web` class) so semantic scoring rewards equivalent stacks. The
adjacency map encodes transferable-skill judgments used by the Second-Look
detector and the evidence mapper.
"""
from __future__ import annotations

# canonical skill -> aliases (lowercase, matched on token boundaries)
SKILLS = {
    "python": ["python", "python3"],
    "java": ["java"], "go": ["go", "golang"], "node": ["node", "node.js", "nodejs"],
    "c++": ["c++", "cpp"], "typescript": ["typescript"], "javascript": ["javascript", "es6"],
    "fastapi": ["fastapi"], "django": ["django", "django rest"], "flask": ["flask"],
    "express": ["express", "express.js"], "spring": ["spring", "spring boot", "springboot"],
    "rest": ["rest", "restful", "rest api", "rest apis"], "graphql": ["graphql"], "grpc": ["grpc"],
    "postgresql": ["postgres", "postgresql"], "mysql": ["mysql"], "mongodb": ["mongodb", "mongo"],
    "redis": ["redis"], "elasticsearch": ["elasticsearch"], "dynamodb": ["dynamodb"],
    "snowflake": ["snowflake"], "redshift": ["redshift"], "bigquery": ["bigquery"],
    "docker": ["docker", "dockerized", "containerized", "containerised"],
    "kubernetes": ["kubernetes", "k8s", "eks", "gke", "aks"],
    "nomad": ["nomad"], "consul": ["consul"], "ecs": ["ecs"],
    "terraform": ["terraform"], "ansible": ["ansible"],
    "ci/cd": ["ci/cd", "cicd", "ci", "gitlab ci", "github actions", "jenkins", "pipelines",
               "deploy pipelines", "deployment pipelines"],
    "kafka": ["kafka"], "nats": ["nats"], "kinesis": ["kinesis"], "rabbitmq": ["rabbitmq"],
    "airflow": ["airflow"], "dagster": ["dagster"], "streamsets": ["streamsets"],
    "spark": ["spark", "pyspark"], "databricks": ["databricks"], "hadoop": ["hadoop"],
    "dbt": ["dbt"], "celery": ["celery"], "nginx": ["nginx"], "linux": ["linux"],
    "prometheus": ["prometheus"], "grafana": ["grafana"], "oauth2": ["oauth2", "oauth"],
    "jwt": ["jwt"], "sql": ["sql", "pl/sql"],
    "pandas": ["pandas"], "numpy": ["numpy"], "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "pytorch": ["pytorch", "torch"], "tensorflow": ["tensorflow", "keras"],
    "xgboost": ["xgboost", "lightgbm"], "statistics": ["statistics", "statistical", "hypothesis testing",
                "a/b testing", "ab testing", "probability", "calibration"],
    "forecasting": ["forecasting", "time-series", "time series", "arima", "demand planning"],
    "nlp": ["nlp", "transformers", "bert", "llm", "llms", "sentence-transformers", "huggingface"],
    "computer-vision": ["computer vision", "opencv", "yolo", "segmentation", "object detection", "cv"],
    "mlops": ["mlops", "mlflow", "model registry", "model monitoring", "drift", "model deployment"],
    "onnx": ["onnx"], "tensorrt": ["tensorrt", "tensor-rt", "int8", "quantization", "quantization-aware"],
    "triton": ["triton"], "cuda": ["cuda", "gpu"], "gstreamer": ["gstreamer", "deepstream"],
    "etl": ["etl", "elt", "data pipelines", "data pipeline", "ingestion"],
    "aws": ["aws", "s3", "lambda", "sqs", "sns"], "azure": ["azure"], "gcp": ["gcp", "google cloud"],
    "react": ["react", "react.js", "next.js", "nextjs"], "webpack": ["webpack", "vite"],
    "monitoring": ["monitoring", "alerting", "observability", "on-call", "oncall", "sla", "slo",
                    "runbook", "runbooks", "mttr", "rollback", "blue-green"],
}

# semantic classes: skills in the same class satisfy a requirement *semantically*
CLASSES = {
    "python-web": ["fastapi", "django", "flask"],
    "web-framework": ["express", "spring"],
    "orchestrator": ["kubernetes", "nomad", "ecs"],
    "stream-broker": ["kafka", "nats", "kinesis", "rabbitmq"],
    "dag-orchestration": ["airflow", "dagster", "streamsets"],
    "big-data": ["spark", "databricks", "hadoop"],
    "relational-db": ["postgresql", "mysql"],
    "model-serving": ["onnx", "tensorrt", "triton", "mlops"],
    "ml-framework": ["pytorch", "tensorflow", "scikit-learn", "xgboost"],
    "python-ds": ["pandas", "numpy", "scikit-learn"],
    "data-sql": ["sql", "postgresql", "mysql"],
    "cloud": ["aws", "azure", "gcp"],
    "api-style": ["rest", "graphql", "grpc"],
}

# adjacency: (have, satisfies, note) — transferable, not equivalent
ADJACENCY = [
    ("flask", "fastapi", "Same ecosystem and idioms; async patterns are the only delta"),
    ("django", "fastapi", "Python web service ownership transfers; async is the delta"),
    ("express", "fastapi", "API design transfers; Python idioms unproven"),
    ("nomad", "kubernetes", "Container orchestration concepts transfer directly"),
    ("ecs", "kubernetes", "Managed-orchestrator concepts transfer directly"),
    ("nats", "kafka", "Event-driven patterns present; broker specifics trainable"),
    ("kinesis", "kafka", "Equivalent managed streaming semantics"),
    ("streamsets", "airflow", "Equivalent DAG-based orchestration"),
    ("grpc", "rest", "Contract-first discipline transfers"),
    ("graphql", "rest", "API contract ownership transfers"),
    ("tensorrt", "mlops", "Model-serving engineering deeper than typical MLOps claims"),
    ("onnx", "mlops", "Inference-optimization practice is MLOps in substance"),
    ("statistics", "mlops", "Experimental discipline transfers to validation protocols"),
    ("mysql", "postgresql", "Relational scaling judgment transfers"),
    ("gstreamer", "kafka", "Real-time streaming pipelines in the video domain; ingestion concepts transfer"),
    ("dynamodb", "postgresql", "Schema and scaling judgment partially transfers"),
]

_ALIAS_INDEX = None

def alias_index():
    """alias -> canonical skill, longest aliases first for greedy matching."""
    global _ALIAS_INDEX
    if _ALIAS_INDEX is None:
        idx = []
        for canon, aliases in SKILLS.items():
            for a in aliases:
                idx.append((a, canon))
        idx.sort(key=lambda p: -len(p[0]))
        _ALIAS_INDEX = idx
    return _ALIAS_INDEX

def extract_skills(text: str) -> set[str]:
    """Greedy alias matching on token boundaries. Returns canonical skills."""
    import re
    low = " " + re.sub(r"[^a-z0-9+./#-]+", " ", text.lower()) + " "
    found = set()
    for alias, canon in alias_index():
        if f" {alias} " in low or f" {alias}," in low:
            found.add(canon)
        else:
            pat = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
            if re.search(pat, low):
                found.add(canon)
    return found

def classes_of(skill: str) -> set[str]:
    return {c for c, members in CLASSES.items() if skill in members}

def semantic_satisfies(have: set[str], want: str) -> bool:
    """True if any held skill shares a semantic class with the wanted skill."""
    want_classes = classes_of(want)
    return any(classes_of(h) & want_classes for h in have)

def adjacent_satisfies(have: set[str], want: str):
    """Return (have_skill, note) if an adjacency mapping covers the want."""
    for h, sat, note in ADJACENCY:
        if h in have and sat == want:
            return h, note
    return None
