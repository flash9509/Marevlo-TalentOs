import React, { useState, useMemo, useEffect } from "react";
import {
  Shield, Upload, Users, Eye, Layers, Kanban, ScrollText, Settings, LayoutDashboard,
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Lock, Server, GitBranch, Scale,
  XCircle, PauseCircle, MessageSquare, RotateCcw, Cpu, Database, Network, FlaskConical,
  Bug, GitCompare, Download, Shuffle, EyeOff, FileWarning, Target, Activity, Sparkles,
  ArrowRight, ArrowUp, ArrowDown, Play, X, Search, FileText, BarChart3, Columns, Info
} from "lucide-react";

/* ------------------------------ design tokens ------------------------------ */
const C = {
  bg: "#F4F5EC", surf: "#FFFFFF", soft: "#F9FAF1", tint: "#EDEFDF",
  ink: "#1B2414", text: "#42503A", mut: "#6E7860", faint: "#98A089",
  line: "#E2E5D2", lineSoft: "#ECEFDE",
  navy: "#1F2A16", navy2: "#2C3A1F",
  blue: "#4E732A", blueSoft: "#EDF4E1",
  gold: "#B98A2F", goldSoft: "#FBF4E4",
  green: "#1F9D6B", greenSoft: "#E7F6EF",
  amber: "#D97706", amberSoft: "#FCF1E0",
  red: "#D9494E", redSoft: "#FCEBEC",
  violet: "#7C5CD6", violetSoft: "#F1EDFB",
  teal: "#0E8E9C", tealSoft: "#E6F5F7",
};
const SH = "0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.08)";
const SH2 = "0 4px 12px rgba(16,24,40,.08), 0 2px 4px rgba(16,24,40,.05)";

const STRENGTH = { Strong: C.green, Medium: C.amber, Weak: C.red };
const MTYPE = { Direct: C.blue, Semantic: C.teal, Adjacent: C.gold, Inferred: C.mut, Missing: C.red };
const GT_META = {
  strong: { label: "Strong fit", c: C.green, s: C.greenSoft },
  medium: { label: "Medium fit", c: C.amber, s: C.amberSoft },
  hidden: { label: "Hidden fit", c: C.gold, s: C.goldSoft },
  low: { label: "Low fit", c: C.red, s: C.redSoft },
  mismatch: { label: "Mismatch", c: C.mut, s: C.tint },
  verify: { label: "Verification needed", c: C.violet, s: C.violetSoft },
};
const FN_LABELS = {
  none: { t: "No hidden-fit alert", c: C.faint, s: C.tint },
  second: { t: "Second-look recommended", c: C.gold, s: C.goldSoft },
  verify: { t: "Verification recommended", c: C.violet, s: C.violetSoft },
  manual: { t: "Needs manual review", c: C.amber, s: C.amberSoft },
  incomplete: { t: "Evidence incomplete", c: C.amber, s: C.amberSoft },
};
const STATUS_COLORS = {
  "New": C.faint, "Parsed": C.mut, "AI Ranked": C.blue, "Needs Manual Parse Review": C.amber,
  "Recruiter Review": C.amber, "Second-Look Review": C.gold, "Technical Panel": C.teal,
  "Shortlisted": C.green, "On Hold": C.faint, "Rejected by Human": C.red, "Final Selected": C.gold,
};
const STAGES = ["AI Ranked", "Needs Manual Parse Review", "Recruiter Review", "Second-Look Review", "Technical Panel", "Shortlisted", "On Hold", "Rejected by Human", "Final Selected"];

const DEFAULT_WEIGHTS = { sk: 25, se: 20, dp: 15, pr: 15, ev: 10, ex: 10, to: 5 };
const WEIGHT_META = [
  ["sk", "Mandatory skill match", "Keyword + taxonomy channel vs Role DNA mandatory list"],
  ["se", "Semantic role fit", "Dense-embedding similarity vs full Role DNA"],
  ["dp", "Project depth", "Project Intelligence Engine assessment"],
  ["pr", "Production maturity", "Deployment, operations and monitoring evidence"],
  ["ev", "Evidence confidence", "Parse quality and strength of supporting sentences"],
  ["ex", "Experience alignment", "Years and seniority vs JD band"],
  ["to", "Tooling ecosystem fit", "Overlap with the role's operational toolchain"],
];

/* --------------------------------- three JDs -------------------------------- */
const JDS = {
  be: {
    id: "be", title: "Senior Backend Software Developer", reqId: "REQ-0417",
    context: "Citizen- and customer-facing backend services on sovereign or private infrastructure. Strict data residency, 99.9% availability, change-control governance.",
    mandatory: ["Python backend (5y+)", "REST API design & ownership", "FastAPI / Django / Flask in production", "PostgreSQL at scale", "Docker & containerized deploys", "CI/CD pipeline ownership", "Production operations (on-call, rollback)"],
    preferred: ["Kubernetes", "Kafka / message queues", "Redis", "Terraform / IaC", "API security (OAuth2, JWT)"],
    expBand: [5, 10],
    projectExp: "Multi-service systems at 10k+ req/min with audit logging and zero-downtime releases.",
    domainExp: "Regulated / government / high-availability environments preferred.",
    deliveryExp: "Release trains with change-control sign-off and documented rollback.",
    redFlags: ["Framework lists without applied context", "No production ownership evidence", "Frontend-only history presented as backend"],
    interviewFocus: ["Failure handling & rollback", "API contract evolution", "DB scaling decisions"],
    rubric: "Mandatory gate on Python service ownership; semantic channel rewards equivalent stacks (Flask ≈ FastAPI); production maturity weighs operations evidence over framework names.",
  },
  ds: {
    id: "ds", title: "Data Scientist / Applied ML Engineer", reqId: "REQ-0421",
    context: "Forecasting and anomaly-detection models on sensitive operational data. Training and inference fully on-prem.",
    mandatory: ["Python ML stack (pandas, scikit-learn or PyTorch)", "Supervised model development end-to-end", "Model evaluation & validation rigor", "SQL on large tables", "Model deployment to production", "Statistics fundamentals"],
    preferred: ["Time-series forecasting", "MLOps (Docker, CI for models)", "Spark / Airflow", "NLP", "Drift monitoring"],
    expBand: [4, 9],
    projectExp: "Models surviving drift and quarterly audit on 10–100M row datasets.",
    domainExp: "Operational / infrastructure / financial data under privacy constraints.",
    deliveryExp: "Model cards, validation reports, reproducible training runs are mandatory artifacts.",
    redFlags: ["Tutorial-pattern portfolio presented as production", "Skill lists far exceeding project evidence", "Deployment claims with no operational detail"],
    interviewFocus: ["Validation methodology", "Drift handling", "Defending a model to a review board"],
    rubric: "Evidence confidence gates inflated claims; project depth separates shipped models from notebooks; semantic channel maps research vocabulary to JD requirements.",
  },
  de: {
    id: "de", title: "Data Engineer / MLOps Engineer", reqId: "REQ-0428",
    context: "Build and operate the data and model-serving backbone: ingestion, pipelines, feature stores, model deployment.",
    mandatory: ["Python + SQL pipelines", "Airflow or equivalent orchestration", "Spark or large-scale processing", "Docker / containerized services", "Kafka or streaming ingestion", "Pipeline operations (monitoring, alerting)"],
    preferred: ["Kubernetes", "Model serving (Triton/ONNX/TensorRT)", "Terraform", "Data quality frameworks", "Lakehouse / medallion architecture"],
    expBand: [4, 10],
    projectExp: "Petabyte-class or high-throughput pipelines with documented SLAs.",
    domainExp: "On-prem or hybrid infrastructure; cost and reliability ownership.",
    deliveryExp: "Runbooks, alerting, capacity planning as standard artifacts.",
    redFlags: ["Dashboard/BI-only history presented as data engineering", "No orchestration or operations evidence"],
    interviewFocus: ["Pipeline failure recovery", "Backfill strategy", "Serving latency vs cost tradeoffs"],
    rubric: "Production maturity dominates; semantic channel maps adjacent orchestrators (Nomad ≈ K8s) and serving stacks (TensorRT ≈ model serving) to requirements.",
  },
};

const REQ_KEYS = {
  be: [
    ["Python backend (5y+)", ["python"], ["go", "node", "java"]],
    ["REST API design & ownership", ["rest", "api", "graphql", "grpc"], []],
    ["FastAPI / Django / Flask in production", ["fastapi", "django", "flask"], ["express", "spring", "graphql"]],
    ["PostgreSQL at scale", ["postgres"], ["mysql", "dynamodb", "mongodb", "cosmosdb"]],
    ["Docker & containerized deploys", ["docker"], ["kubernetes", "eks", "ecs"]],
    ["CI/CD pipeline ownership", ["ci", "gitlab", "jenkins", "actions", "pipelines"], ["devops"]],
    ["Production operations (on-call, rollback)", ["on-call", "production", "rollback", "sre", "reliability"], []],
  ],
  ds: [
    ["Python ML stack", ["pandas", "scikit", "sklearn", "pytorch", "tensorflow"], ["matlab"]],
    ["Supervised model development", ["model", "ml", "classification", "regression", "forecasting", "segmentation"], []],
    ["Model evaluation & validation rigor", ["validation", "evaluation", "back-test", "a/b", "calibration", "metrics"], ["accuracy"]],
    ["SQL on large tables", ["sql", "bigquery", "postgres", "warehouse"], ["mongodb"]],
    ["Model deployment to production", ["deploy", "inference", "serving", "mlops", "docker"], ["notebook"]],
    ["Statistics fundamentals", ["statistic", "probability", "hypothesis", "a/b"], []],
  ],
  de: [
    ["Python + SQL pipelines", ["python", "sql"], []],
    ["Airflow or equivalent orchestration", ["airflow", "orchestr", "dagster"], ["cron", "ci"]],
    ["Spark or large-scale processing", ["spark", "databricks", "petabyte", "hadoop"], ["pandas"]],
    ["Docker / containerized services", ["docker"], ["kubernetes", "eks", "jetson"]],
    ["Kafka or streaming ingestion", ["kafka", "kinesis", "stream"], ["redis", "gstreamer", "mqtt", "nats"]],
    ["Pipeline operations (monitoring, alerting)", ["monitoring", "alert", "sla", "runbook", "grafana", "observ"], []],
  ],
};

const ADJ = [
  ["Flask + REST + PostgreSQL", "FastAPI backend readiness", "Same ecosystem and idioms; async patterns are the only delta"],
  ["Express / Node REST", "Python API readiness", "API design transfers; Python service idioms unproven"],
  ["ECS / Nomad orchestration", "Kubernetes readiness", "Container orchestration concepts transfer directly"],
  ["gRPC service contracts", "REST API design", "Contract-first discipline transfers"],
  ["Jenkins / GitHub Actions", "CI/CD readiness", "Pipeline mechanics identical across vendors"],
  ["PyTorch + Docker inference", "MLOps readiness", "The practice is present; only the label is absent"],
  ["TensorRT / ONNX / Triton", "Model-serving readiness", "Deeper than typical MLOps claims"],
  ["A/B testing + statistics", "ML validation readiness", "Experimental discipline transfers to validation protocols"],
  ["NATS streaming ops", "Kafka readiness", "Event-driven patterns present; broker specifics trainable"],
  ["Airflow + SQL pipelines", "Data-engineering readiness", "Equivalent DAG-based orchestration"],
];

/* -------------------------------- candidates -------------------------------- */
/* Fully synthetic identities. Skill patterns, score structure, and test categories
   modeled on a realistic 37-resume benchmark; no real names or employers appear. */
const CANDS = [
  /* ===== BACKEND POOL (be) ===== */
  { id: "b01", name: "Kavya Rao", jd: "be", gt: "strong", exp: 8, current: "Senior SWE, Tier-1 cloud platform company",
    parse: 93, status: "AI Ranked", vRisk: 10, fn: "none",
    s: { sk: 84, pf: 88, se: 90, dp: 93, pr: 94, ex: 95, to: 86, ev: 90 },
    sum: "Eight years on Tier-1 distributed systems. Led a data platform handling 100M+ requests/min with multi-million-dollar annual savings; deep operations and mentoring evidence. Primary languages Java/C# with Python across the stack — framework-level Python detail is the one soft spot.",
    skills: ["Java", "Python", "C#", "AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "DynamoDB", "Microservices"],
    evid: [
      ["Production operations (on-call, rollback)", "“Operational excellence ownership on Tier-1 systems serving millions of customers per second.”", "Direct", "Strong"],
      ["REST API design & ownership", "“Led cross-functional sync-API architecture cutting latency to double-digit milliseconds.”", "Direct", "Strong"],
      ["Python backend (5y+)", "Python present across the platform stack; primary languages are Java/C#.", "Direct", "Medium"],
      ["PostgreSQL at scale", "MySQL/DynamoDB/CosmosDB at scale; Postgres not named.", "Adjacent", "Medium"],
    ],
    projects: [
      { n: "Medallion-architecture data platform", lab: "Enterprise-grade", sc: 92, fl: ["Scale: 100M+ RPM", "Cost ownership"], d: "Led design and implementation; latency and cost outcomes quantified." },
      { n: "Logistics video-verification system", lab: "Production-grade", sc: 84, fl: ["Quantified business impact"], d: "Tier-1 operations systems." },
    ],
    qs: ["Walk through a Tier-1 incident you owned end-to-end.", "Contrast Python vs Java service idioms for our stack."] },

  { id: "b02", name: "Neel Sharma", jd: "be", gt: "strong", exp: 4.5, current: "SWE, global product company",
    parse: 91, status: "AI Ranked", vRisk: 12, fn: "none",
    s: { sk: 72, pf: 70, se: 84, dp: 88, pr: 84, ex: 70, to: 78, ev: 88 },
    sum: "Designed and led a flagship media-conversion feature attributed with +60% product usage; owns his team's agentic AI framework. Polyglot (C++/Python/Go/Node); strong product-scale delivery, slightly under the 5y band.",
    skills: ["Python", "C++", "Go", "Node.js", "Kubernetes", "PostgreSQL", "Redis", "CI/CD", "Docker"],
    projects: [
      { n: "Media conversion feature (flagship)", lab: "Production-grade", sc: 89, fl: ["+60% usage attribution", "Feature ownership"], d: "Designed and led the product's most-used capability." },
      { n: "Agentic AI feature framework", lab: "Production-grade", sc: 85, fl: ["Architecture ownership"], d: "Main contributor; ships AI generation features." },
    ],
    qs: ["Which parts of your current stack map to FastAPI/Postgres on-prem?", "Describe a rollback you executed."] },

  { id: "b03", name: "Arjun Nair", jd: "be", gt: "strong", exp: 7.5, current: "Backend Engineer, e-governance vendor",
    parse: 92, status: "Recruiter Review", vRisk: 8, fn: "none",
    s: { sk: 94, pf: 74, se: 91, dp: 90, pr: 92, ex: 95, to: 88, ev: 92 },
    sum: "Seven years building Python services for state-government portals. Twelve FastAPI services at 40k req/min peak; wrote the department's rollback runbooks.",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes", "GitLab CI", "Redis", "OAuth2", "Prometheus"],
    evid: [
      ["FastAPI / Django / Flask in production", "“Designed and operate 12 FastAPI microservices serving 40k req/min at peak.”", "Direct", "Strong"],
      ["Production operations (on-call, rollback)", "“On-call owner; wrote rollback runbooks adopted department-wide.”", "Direct", "Strong"],
      ["PostgreSQL at scale", "“Partitioned Postgres for 30M-row reconciliation workloads.”", "Direct", "Strong"],
    ],
    projects: [{ n: "Citizen grievance API platform", lab: "Production-grade", sc: 92, fl: ["Ownership", "Gov domain"], d: "12 services, blue-green deploys, immutable audit logging." }],
    qs: ["Walk through your blue-green rollback during a failed release."] },

  { id: "b04", name: "Meera Kulkarni", jd: "be", gt: "strong", exp: 8, current: "Senior SWE, BFSI product company",
    parse: 90, status: "AI Ranked", vRisk: 10, fn: "none",
    s: { sk: 90, pf: 80, se: 88, dp: 87, pr: 90, ex: 92, to: 90, ev: 89 },
    sum: "Eight years in regulated fintech. Django REST and FastAPI in production, Kafka outbox patterns, central-bank audit-trail compliance, leads four engineers.",
    skills: ["Python", "Django REST", "FastAPI", "Kafka", "PostgreSQL", "Docker", "Terraform", "AWS", "JWT"],
    projects: [{ n: "Core banking API layer", lab: "Production-grade", sc: 89, fl: ["Regulated-domain evidence"], d: "99.95% uptime SLO; audit requirements designed in." }],
    qs: ["Describe the Kafka outbox pattern you used and its failure modes."] },

  { id: "b05", name: "Rohan Bhat", jd: "be", gt: "medium", exp: 5, current: "Full-Stack Developer, SaaS startup",
    parse: 88, status: "AI Ranked", vRisk: 30, fn: "manual",
    s: { sk: 62, pf: 40, se: 70, dp: 64, pr: 58, ex: 60, to: 64, ev: 66 },
    sum: "Five years full-stack, roughly half backend (Node primary, Python secondary). Docker and basic CI present; Python service ownership unclear from resume text.",
    skills: ["Node.js", "Python", "Express", "MongoDB", "PostgreSQL", "Docker", "GitHub Actions", "React"],
    qs: ["What fraction of your last role was Python vs Node?"] },

  { id: "b06", name: "Rhea Iyer", jd: "be", gt: "medium", exp: 5.5, current: "SWE L4, global product company",
    parse: 92, status: "AI Ranked", vRisk: 10, fn: "manual",
    s: { sk: 50, pf: 38, se: 68, dp: 80, pr: 72, ex: 72, to: 52, ev: 88 },
    sum: "Top-tier CS pedigree; L4 on a productivity-suite team. Excellent engineer whose evidence is client-side infrastructure (WebAssembly, cross-platform frameworks) and NLP features — server-side Python ownership not evidenced. Strong general talent, partial role match.",
    skills: ["C++", "Java", "JavaScript", "WebAssembly", "NLP infrastructure"],
    qs: ["Interest and runway for a backend-Python-first role?"] },

  { id: "b07", name: "Kabir Mehta", jd: "be", gt: "mismatch", exp: 4, current: "Frontend Engineer, consumer app",
    parse: 90, status: "AI Ranked", vRisk: 12, fn: "none",
    s: { sk: 28, pf: 15, se: 38, dp: 56, pr: 40, ex: 40, to: 30, ev: 78 },
    sum: "Four years React/TypeScript. Strong in his lane; mandatory backend requirements unevidenced. Mismatch for this role, not a weak professional.",
    skills: ["React", "TypeScript", "Next.js", "CSS", "Jest"] },

  { id: "b08", name: "Dev Malhotra", jd: "be", gt: "mismatch", exp: 9, current: "Senior Frontend Lead, enterprise software firm",
    parse: 91, status: "AI Ranked", vRisk: 10, fn: "none",
    s: { sk: 32, pf: 18, se: 40, dp: 70, pr: 55, ex: 80, to: 34, ev: 86 },
    sum: "Nine years of accomplished frontend leadership (React/Next.js, build-time cut 72%, team lead). A genuinely senior engineer whose entire evidence base is frontend — clear mismatch for a Python backend role.",
    skills: ["React.js", "Next.js", "TypeScript", "Vite", "Webpack", "Node.js", "Express"] },

  { id: "b09", name: "Tara Sen", jd: "be", gt: "hidden", exp: 6, current: "Software Engineer, logistics platform",
    parse: 89, status: "Second-Look Review", vRisk: 12, fn: "second",
    s: { sk: 56, pf: 36, se: 86, dp: 85, pr: 86, ex: 80, to: 78, ev: 85 },
    sum: "Six years of production Python REST services (Flask/Postgres/Celery, 8M events/day) deployed via GitLab pipelines she wrote — described without using a single JD keyword token.",
    skills: ["Python", "Flask", "PostgreSQL", "Docker", "GitLab pipelines", "Celery", "Nginx", "Linux"],
    sl: { missed: "Never uses tokens “FastAPI”, “CI/CD”, or “microservices”. Keyword-gate score: 56.",
      surfaced: "Six years of production Python REST + Postgres + Docker with self-built GitLab deploy pipelines — semantically equivalent to the mandatory stack at full depth.",
      verify: "Panel should probe the async/FastAPI delta (days, not months) and confirm service ownership.",
      before: "Missing “FastAPI” keyword → keyword gate scores 56 → silently filtered", after: "Flask + REST + PostgreSQL + Docker production evidence detected → routed to human review", conf: 88 },
    evid: [
      ["FastAPI / Django / Flask in production", "“Built and operate Flask REST services handling 8M events/day.”", "Semantic", "Strong"],
      ["CI/CD pipeline ownership", "“Wrote GitLab deploy pipelines with automated rollback for all team services.”", "Semantic", "Strong"],
      ["Production operations (on-call, rollback)", "“On-call rotation lead; reduced MTTR from 42 to 11 minutes.”", "Direct", "Strong"],
    ],
    projects: [{ n: "Shipment tracking API", lab: "Production-grade", sc: 85, fl: ["8M events/day", "Self-built deploy pipelines"], d: "Flask + Postgres + Celery with idempotent carrier webhook ingestion." }],
    qs: ["What changes moving a Flask service to async FastAPI?"] },

  { id: "b10", name: "Aditya Shah", jd: "be", gt: "hidden", exp: 10, current: "Principal Engineer, privacy-tech startup (ex-hyperscaler)",
    parse: 87, status: "AI Ranked", vRisk: 15, fn: "second",
    s: { sk: 48, pf: 42, se: 82, dp: 92, pr: 90, ex: 88, to: 70, ev: 86 },
    sum: "Principal-level backend depth: API p95 from 1.2s to 65ms, Postgres CPU efficiency ~100x, Tier-1 billing systems — expressed entirely in Node/Go/GraphQL vocabulary. Zero Python-framework keywords.",
    skills: ["Node.js", "Go", "GraphQL", "PostgreSQL", "Prisma", "AWS", "React"],
    sl: { missed: "No “Python”, “FastAPI”, “Django”, or “Flask” anywhere; a keyword gate scores him 48 and silently drops a principal engineer.",
      surfaced: "Deep verified backend-performance evidence (p95 65ms, 100x DB efficiency, Tier-1 billing) — exactly the systems maturity the role needs; language is the only gap.",
      verify: "The real question is language-transition appetite and Python idiom ramp, not capability.",
      before: "Zero Python-framework keywords → keyword gate scores 48 → principal engineer dropped", after: "p95 65ms, 100x Postgres efficiency, Tier-1 billing evidence detected → flagged for review", conf: 84 },
    evid: [
      ["PostgreSQL at scale", "“Improved Postgres instance CPU performance ~100x to handle 10x user growth.”", "Direct", "Strong"],
      ["REST API design & ownership", "“Improved API p95 from 1.2s to 65ms, eliminating timeout errors.”", "Adjacent", "Strong"],
      ["Python backend (5y+)", "No Python evidence in resume.", "Missing", "Weak"],
    ],
    projects: [{ n: "Backend reliability program", lab: "Production-grade", sc: 90, fl: ["Quantified perf outcomes", "Principal scope"], d: "Architecture decision records, schema simplification, 10x growth handling." }],
    qs: ["Would you accept a Python-primary role? Walk through your idiom-ramp plan."] },

  { id: "b11", name: "Ishaan Verma", jd: "be", gt: "hidden", exp: 6.5, current: "Platform Engineer, developer-tools company",
    parse: 90, status: "AI Ranked", vRisk: 14, fn: "second",
    s: { sk: 52, pf: 70, se: 80, dp: 88, pr: 90, ex: 78, to: 86, ev: 84 },
    sum: "Go-first platform engineer running gRPC microservices on three production K8s clusters; wrote the org's deployment golden path. Python secondary.",
    skills: ["Go", "gRPC", "Kubernetes", "Python", "Terraform", "Prometheus", "PostgreSQL", "ArgoCD"],
    sl: { missed: "Python appears twice; keyword filter on “Python, FastAPI” scores 52.",
      surfaced: "Systems-design and delivery maturity (3 prod K8s clusters, golden-path ownership) above most of the pool.",
      verify: "Language-transition appetite; gRPC→REST contract style.",
      before: "Low Python keyword density → scored 52 → filtered below review line", after: "3 production K8s clusters + golden-path ownership detected → flagged for review", conf: 81 } },

  { id: "b12", name: "(Unnamed) batch_file_12.pdf", jd: "be", gt: "medium", exp: 6, current: "Senior Software Engineer (employer inferred)",
    parse: 54, status: "Needs Manual Parse Review", vRisk: 45, fn: "incomplete", messy: "No candidate name in document; no employment dates; two-column layout broke section order; project ownership ambiguous.",
    s: { sk: 46, pf: 30, se: 60, dp: 55, pr: 50, ex: 55, to: 50, ev: 38 },
    sum: "Java/Spring Boot + React profile with PL/SQL automation work. The resume itself failed clean parsing: no name, no dates, unclear ownership — evaluation continues with reduced confidence and a mandatory manual-review flag.",
    skills: ["Java", "Spring Boot", "ReactJS", "PL/SQL", "Python", "REST", "JUnit"],
    qs: ["Obtain a complete resume with dates before evaluation proceeds."] },

  { id: "b13", name: "Tara S.", jd: "be", gt: "low", exp: 6, current: "Software Engineer",
    parse: 89, status: "Needs Manual Parse Review", vRisk: 72, fn: "verify", messy: "97% content overlap with candidate BE-09 under a different name — duplicate-submission detection fired.",
    dup: "b09",
    s: { sk: 56, pf: 36, se: 86, dp: 85, pr: 86, ex: 80, to: 78, ev: 85 },
    sum: "Near-identical text to BE-09's resume submitted under a variant name. Flagged as duplicate; routed to manual review rather than scored independently.",
    skills: ["Python", "Flask", "PostgreSQL", "Docker"] },

  /* ===== DATA SCIENCE POOL (ds) ===== */
  { id: "d01", name: "Aarav Menon", jd: "ds", gt: "strong", exp: 6.5, current: "Senior Applied ML Scientist, global investment bank",
    parse: 92, status: "Technical Panel", vRisk: 10, fn: "none",
    s: { sk: 90, pf: 84, se: 92, dp: 94, pr: 88, ex: 92, to: 84, ev: 92 },
    sum: "PhD with top-venue publications; six years shipping ML in banking and telecom-infrastructure — multi-agent document systems, signature authentication, an award-recognized CV product. Research depth plus production delivery.",
    skills: ["PyTorch", "Python", "FastAPI", "Docker", "ONNX", "AWS", "GNNs", "LLMs", "MLflow"],
    evid: [
      ["Supervised model development", "“Designed a signature-authentication product using a visual-lingual hybrid approach.”", "Direct", "Strong"],
      ["Model deployment to production", "“Designed and deployed a multi-agent document system… FastAPI, Docker, ONNX.”", "Direct", "Strong"],
      ["Model evaluation & validation rigor", "Peer-reviewed publication record implies methodology rigor; production validation protocol not explicitly described.", "Inferred", "Medium"],
      ["SQL on large tables", "Not evidenced in resume.", "Missing", "Weak"],
    ],
    projects: [
      { n: "Multi-agent document intelligence", lab: "Production-grade", sc: 91, fl: ["Stakeholder-aligned extraction", "Agentic architecture"], d: "Query management across 6+ systems with memory." },
      { n: "Drone-based infrastructure CV product", lab: "Production-grade", sc: 88, fl: ["Internal award", "Distributed-training best practices"], d: "CV product with MLOps discipline (MLflow, distributed training)." },
    ],
    qs: ["Walk through validation for the signature-authentication product.", "SQL/tabular exposure — detail it."] },

  { id: "d02", name: "Vivaan Reddy", jd: "ds", gt: "strong", exp: 6, current: "VP, Applied NLP/ML, global investment bank",
    parse: 90, status: "AI Ranked", vRisk: 12, fn: "none",
    s: { sk: 88, pf: 78, se: 90, dp: 90, pr: 84, ex: 90, to: 82, ev: 90 },
    sum: "5+ years fielding NLP/ML in financial production: record linking across 10M-record databases (sentence transformers + ANN search), LLM-bootstrapped training data, layout-aware document AI with publications.",
    skills: ["PyTorch", "sentence-transformers", "Huggingface", "FastAPI", "Kubernetes", "scikit-learn", "SQL", "Flask"],
    evid: [
      ["Supervised model development", "“Trained an ensemble of LLM-bootstrapped classifiers… improved linking accuracy >10% above baseline.”", "Direct", "Strong"],
      ["Model deployment to production", "“5+ years designing, developing and fielding NLP/ML solutions into production in the financial domain.”", "Direct", "Strong"],
      ["Statistics fundamentals", "Implied by methodology; not explicitly evidenced.", "Inferred", "Medium"],
    ],
    projects: [{ n: "Record linking across 10M-record databases", lab: "Production-grade", sc: 90, fl: ["Recall-first retrieval design", "Search space 10M→100"], d: "Embedding + ANN retrieval; high-precision discriminative reranking." }],
    qs: ["Defend the recall/precision split in your record-linking architecture."] },

  { id: "d03", name: "Ayaan Khanna", jd: "ds", gt: "strong", exp: 5.5, current: "Senior DS Consultant (Fortune-100 supply chain clients)",
    parse: 78, status: "AI Ranked", vRisk: 22, fn: "manual", messy: "PDF text extraction lost word spacing throughout (encoding issue); skills recovered via taxonomy matching; manual confirmation advised.",
    s: { sk: 84, pf: 72, se: 86, dp: 80, pr: 78, ex: 84, to: 76, ev: 72 },
    sum: "4.5+ years across SKU-level demand forecasting (+15% seasonal accuracy), banking ML at scale, cloud-certified. Resume text was mangled by extraction — evidence confidence reduced accordingly, score held competitive.",
    skills: ["Python", "Machine Learning", "Forecasting", "Azure ML", "Databricks", "BigQuery", "Docker"],
    qs: ["Detail the forecasting hierarchy and validation for the SKU demand model."] },

  { id: "d04", name: "Anika Bose", jd: "ds", gt: "strong", exp: 6, current: "Data Scientist, telecom analytics",
    parse: 92, status: "Recruiter Review", vRisk: 8, fn: "none",
    s: { sk: 92, pf: 86, se: 90, dp: 91, pr: 88, ex: 90, to: 85, ev: 93 },
    sum: "Six years shipping churn and demand-forecast models: hierarchical time-series on 80M daily records, Airflow retraining, drift alarms, quarterly back-tests defended to a review board.",
    skills: ["Python", "scikit-learn", "PyTorch", "SQL", "Airflow", "Docker", "MLflow", "Time-series", "Spark"],
    evid: [
      ["Model evaluation & validation rigor", "“Quarterly back-testing protocol with calibration curves presented to review board.”", "Direct", "Strong"],
      ["Model deployment to production", "“Dockerized inference with Airflow retraining and drift alarms.”", "Direct", "Strong"],
    ],
    projects: [{ n: "Network demand forecaster", lab: "Production-grade", sc: 93, fl: ["80M rows/day", "Drift monitoring"], d: "Hierarchical reconciliation across 22 regions." }],
    qs: ["How do your drift alarms separate data drift from concept drift?"] },

  { id: "d05", name: "Nikhil Joshi", jd: "ds", gt: "medium", exp: 4, current: "Senior Data Analyst, retail",
    parse: 90, status: "AI Ranked", vRisk: 25, fn: "manual",
    s: { sk: 64, pf: 40, se: 72, dp: 58, pr: 40, ex: 62, to: 56, ev: 74 },
    sum: "Strong SQL/pandas analyst transitioning to DS. Uplift models in notebooks; 20+ A/B tests designed — deployment evidence absent.",
    skills: ["Python", "pandas", "SQL", "scikit-learn", "Tableau", "Statistics", "A/B testing"] },

  { id: "d06", name: "Nisha Pillai", jd: "ds", gt: "medium", exp: 3, current: "ML Engineer, healthtech startup",
    parse: 91, status: "AI Ranked", vRisk: 18, fn: "manual",
    s: { sk: 70, pf: 64, se: 74, dp: 74, pr: 78, ex: 50, to: 76, ev: 70 },
    sum: "Three years deploying clinical-note classification with CI-gated canary releases. Engineering-strong; statistics depth and seniority below band.",
    skills: ["Python", "PyTorch", "scikit-learn", "Docker", "FastAPI", "GitHub Actions", "SQL"] },

  { id: "d07", name: "Karan Oberoi", jd: "ds", gt: "medium", exp: 4.5, current: "Senior Data Scientist, industrial automation firm",
    parse: 88, status: "AI Ranked", vRisk: 35, fn: "manual",
    s: { sk: 76, pf: 66, se: 78, dp: 66, pr: 64, ex: 70, to: 70, ev: 62 },
    sum: "4+ years spanning object-detection CV, multimodal RAG, time-series for an energy client, and LLM fine-tuning. Breadth is real; per-project depth and validation detail are thin relative to the surface area claimed — evidence confidence reduced.",
    skills: ["Python", "PyTorch", "TensorFlow", "scikit-learn", "RAG", "MLOps", "LangChain", "Cloud"],
    qs: ["Pick one project and defend its evaluation protocol end-to-end."] },

  { id: "d08", name: "Sahil Anand", jd: "ds", gt: "medium", exp: 3.5, current: "AI Applications Engineer, insurance group",
    parse: 90, status: "AI Ranked", vRisk: 22, fn: "manual",
    s: { sk: 60, pf: 50, se: 70, dp: 70, pr: 72, ex: 56, to: 62, ev: 76 },
    sum: "GenAI application engineering (agentic RAG, evaluation frameworks, document pipelines). Solid applied-LLM delivery; classical supervised-ML modeling and statistics evidence is light for this JD's core.",
    skills: ["Python", "RAG", "Azure AI Search", "LLMs", "Prompt engineering", "ETL", "Evaluation frameworks"] },

  { id: "d09", name: "Prakash Rao", jd: "ds", gt: "mismatch", exp: 9, current: "BI Lead, manufacturing",
    parse: 91, status: "AI Ranked", vRisk: 10, fn: "none",
    s: { sk: 32, pf: 20, se: 42, dp: 50, pr: 44, ex: 60, to: 36, ev: 80 },
    sum: "Nine years of genuine BI leadership (star-schema warehouse, 200+ dashboards). No ML modeling evidence — a mismatch, not a weak professional.",
    skills: ["SQL", "Power BI", "SSIS", "Data warehousing"] },

  { id: "d10", name: "Zoya Mirza", jd: "ds", gt: "low", exp: 0.5, current: "Recent CS graduate (international program)",
    parse: 86, status: "AI Ranked", vRisk: 20, fn: "none",
    s: { sk: 44, pf: 24, se: 50, dp: 34, pr: 18, ex: 12, to: 30, ev: 70 },
    sum: "Honest junior profile: dissertation on data-minimization for ConvNets, coursework CV projects. Evidence matches claims — simply far below the role's experience and production band.",
    skills: ["Python", "PyTorch", "OpenCV", "NumPy", "Azure"],
    projects: [{ n: "Dissertation: data minimization for deep learning", lab: "Research-grade", sc: 46, fl: ["Honest scoping", "No production claim"], d: "Regularization under dataset compression; experimental framework." }] },

  { id: "d11", name: "Diya Kapoor", jd: "ds", gt: "low", exp: 2, current: "Programmer Analyst Trainee, IT services major",
    parse: 49, status: "Needs Manual Parse Review", vRisk: 38, fn: "incomplete", messy: "Infographic/two-column template: contact details interleaved with skills; sections recovered out of order; marketing copy displaced project detail.",
    s: { sk: 40, pf: 22, se: 46, dp: 36, pr: 24, ex: 30, to: 34, ev: 42 },
    sum: "Analyst trainee with ETL tooling exposure and one deep-learning college project. The design-template resume parsed poorly — evaluation proceeded with reduced confidence and a manual-review flag rather than silent rejection.",
    skills: ["Informatica", "SQL", "Python", "Tableau", "Power BI"] },

  { id: "d12", name: "Mira Das", jd: "ds", gt: "verify", exp: 0.5, current: "Recent M.Tech graduate",
    parse: 84, status: "AI Ranked", vRisk: 78, fn: "verify",
    s: { sk: 50, pf: 30, se: 50, dp: 28, pr: 22, ex: 15, to: 30, ev: 40 },
    sum: "Skill list spans nine frameworks; projects mirror well-known tutorial datasets; one claim of “sentiment analysis serving millions of requests” carries no infrastructure, employer, or operational detail. Advisory verification flag — tested in conversation, never auto-rejected.",
    skills: ["Python", "TensorFlow", "PyTorch", "scikit-learn", "NLP", "CV", "SQL", "Spark", "AWS"],
    flagsX: ["Scale claim with no operational detail", "Tutorial-pattern portfolio presented as applied work"],
    projects: [
      { n: "Customer churn prediction", lab: "Tutorial-pattern", sc: 30, fl: ["Mirrors circulated tutorial"], d: "Public churn CSV, standard sklearn pipeline." },
      { n: "“Deployed sentiment analysis at scale”", lab: "Possible inflated claim", sc: 22, fl: ["Needs verification", "Scale claim unsupported"], d: "No infra/employer/ops detail anywhere in resume." },
    ],
    qs: ["Describe the infrastructure behind the sentiment deployment claim."] },

  { id: "d13", name: "Veer Saxena", jd: "ds", gt: "verify", exp: 1.2, current: "Applied AI student (final term)",
    parse: 80, status: "AI Ranked", vRisk: 68, fn: "verify",
    s: { sk: 58, pf: 36, se: 56, dp: 40, pr: 30, ex: 25, to: 48, ev: 44 },
    sum: "Summary claims “3+ years experienced in algorithm design” while the dated timeline shows a 7-month freelance ML role plus a 3-month app internship, with studies ongoing. Big-data skill list (Hadoop, Spark, Kafka…) far exceeds project evidence.",
    skills: ["Python", "PyTorch", "TensorFlow", "OpenCV", "Spark", "Kafka", "Hadoop", "AWS", "Docker"],
    evid: [
      ["Supervised model development", "“Experimented with transformer and multi-stage trajectory models” (freelance project).", "Direct", "Medium"],
      ["Model deployment to production", "No deployment evidence; cloud listed in skills only.", "Missing", "Weak"],
      ["Statistics fundamentals", "“Developing statistical models for complex data sets” — no specifics.", "Inferred", "Weak"],
    ],
    flagsX: ["Stated experience (3+ years) exceeds dated history (~10 months)", "Big-data toolchain listed without any supporting project"],
    qs: ["Reconcile the 3+ years claim with the dated employment history.", "Which of Hadoop/Spark/Kafka have you used beyond coursework — show artifacts."] },

  { id: "d14", name: "Aryan Joshi", jd: "ds", gt: "verify", exp: 1, current: "ML Engineer (freelance contracts)",
    parse: 85, status: "AI Ranked", vRisk: 72, fn: "verify",
    s: { sk: 62, pf: 44, se: 60, dp: 48, pr: 42, ex: 25, to: 56, ev: 46 },
    sum: "Claims “3+ years’ experience” while the degree completes this year and dated history shows one internship plus recent freelance work. Real, verifiable artifacts exist (a published CV paper, shipped projects) alongside the inflated experience claim and unverifiable outcome metrics — a classic verification-lane profile.",
    skills: ["Python", "FastAPI", "LangChain", "Vector DBs", "Docker", "AWS", "Object detection", "Flask"],
    evid: [
      ["Supervised model development", "“Built an NLP misinformation-detection system improving accuracy by 15%” (internship).", "Direct", "Medium"],
      ["Model deployment to production", "“Dockerized deployments on cloud infrastructure” (freelance, recent).", "Direct", "Medium"],
      ["Model evaluation & validation rigor", "Outcome metrics quoted (95% retrieval relevance, 60–80% reduction) without methodology.", "Inferred", "Weak"],
    ],
    flagsX: ["Experience claim (3+ years) vs graduation date inconsistency", "Outcome metrics quoted without measurement methodology"],
    projects: [
      { n: "Real-time retail surveillance detection", lab: "Research-grade", sc: 62, fl: ["Published paper — verifiable"], d: "Object detection + tracking; peer-reviewed publication." },
      { n: "Three concurrent solo SaaS products", lab: "Needs verification", sc: 44, fl: ["Concurrent solo claims", "Ownership clarity"], d: "Full-stack AI products claimed solo while completing degree." },
    ],
    qs: ["Walk through the dated timeline; reconcile with the 3+ years claim.", "How was the 60–80% review-time reduction measured?"] },

  { id: "d15", name: "Sana Qureshi", jd: "ds", gt: "verify", exp: 2, current: "AI/ML Engineer, global financial firm",
    parse: 87, status: "AI Ranked", vRisk: 70, fn: "verify",
    s: { sk: 85, pf: 70, se: 72, dp: 50, pr: 48, ex: 45, to: 64, ev: 40 },
    sum: "Keyword coverage is near-total — the skills section spans ~60 technologies across NLP, CV, big data, and MLOps. Claims “4+ years” while dated industry history shows ~2. High keyword score, low evidence confidence: the exact profile keyword-only screening over-ranks and this system gates.",
    skills: ["Python", "PyTorch", "TensorFlow", "LLMs", "XGBoost", "Spark", "Kubernetes", "Snowflake", "RAG", "GANs"],
    evid: [
      ["Python ML stack", "Comprehensive framework list; transformer fine-tuning for financial sentiment stated.", "Direct", "Medium"],
      ["Model deployment to production", "Docker/K8s/CI-CD listed in skills; no specific owned deployment described.", "Inferred", "Weak"],
      ["Model evaluation & validation rigor", "No validation methodology evidenced.", "Missing", "Weak"],
    ],
    flagsX: ["~60-technology skill list vs thin per-project evidence", "Experience claim (4+ years) vs dated history (~2 years)"],
    qs: ["Pick any three listed technologies and show owned work in each.", "Reconcile stated years with dated history."] },

  { id: "d16", name: "Ravi Teja", jd: "ds", gt: "verify", exp: 0.5, current: "Undergraduate (2nd year); 'Founder & CEO' of a parking-tech venture",
    parse: 82, status: "AI Ranked", vRisk: 75, fn: "verify",
    s: { sk: 46, pf: 28, se: 48, dp: 26, pr: 20, ex: 10, to: 32, ev: 36 },
    sum: "Second-year undergraduate presenting a Founder/CEO title with claims of an AI parking system using predictive analytics, CV, and IoT — alongside a prior year in business development. Capability may be genuine but every major claim lacks verifiable depth; verification lane, not rejection.",
    skills: ["Python", "TensorFlow", "PyTorch", "OpenCV", "Spark", "AWS", "FastAPI", "Docker"],
    flagsX: ["Founder/CEO title during second year of undergraduate study", "Production-system claims without architecture, scale, or user detail"] },

  { id: "d17", name: "Imran Shaikh", jd: "ds", gt: "hidden", exp: 5, current: "Research Engineer, computer-vision lab",
    parse: 89, status: "Second-Look Review", vRisk: 15, fn: "second",
    s: { sk: 54, pf: 50, se: 84, dp: 90, pr: 82, ex: 75, to: 72, ev: 86 },
    sum: "Five years building a CV lab's training-and-serving stack: CI-triggered retraining, ONNX-optimized Dockerized inference, GPU scheduling, 24/7 field serving — described in research vocabulary with zero JD tokens.",
    skills: ["Python", "PyTorch", "Docker", "CUDA", "ONNX", "CI pipelines", "PostgreSQL"],
    sl: { missed: "Research phrasing (“inference optimization”, “training infrastructure”) contains none of the JD tokens; keyword gate: 54.",
      surfaced: "MLOps in everything but name — CI-retraining + Dockerized ONNX serving at greater depth than most resumes that use the word.",
      verify: "Domain pivot (vision → tabular/time-series) is the panel question, not capability.",
      before: "No “MLOps”/“deployment” tokens → keyword gate 54 → filtered", after: "CI-triggered retraining + Dockerized ONNX serving detected → routed to review", conf: 86 },
    evid: [
      ["Model deployment to production", "“CI-triggered retraining with Dockerized ONNX inference services; 24/7 serving for two field deployments.”", "Semantic", "Strong"],
      ["Supervised model development", "“Trained detection and segmentation models for field deployment.”", "Semantic", "Strong"],
    ] },

  /* ===== DATA / MLOPS POOL (de) ===== */
  { id: "e01", name: "Aarush Gupta", jd: "de", gt: "strong", exp: 6.5, current: "Senior SWE, cyber-insurance scaleup (ex-enterprise storage major)",
    parse: 93, status: "Recruiter Review", vRisk: 8, fn: "none",
    s: { sk: 94, pf: 82, se: 92, dp: 94, pr: 95, ex: 92, to: 90, ev: 93 },
    sum: "Petabyte-scale pipeline ownership (100+ ETL pipelines via Kafka/Airflow, 500GB+/day, medallion architecture) and a 10,000-pod K8s scanning system scaling to 1M concurrent scans with quantified 5x cost reduction.",
    skills: ["Python", "Airflow", "Kafka", "PySpark", "Databricks", "Kubernetes", "PostgreSQL", "Redshift", "Snowflake"],
    evid: [
      ["Airflow or equivalent orchestration", "“Developed & managed 100+ ETL pipelines… Kafka and Airflow.”", "Direct", "Strong"],
      ["Spark or large-scale processing", "“Optimized data processing using PySpark… daily 200GB exports.”", "Direct", "Strong"],
      ["Pipeline operations (monitoring, alerting)", "“Real-time monitoring & alerting; validation engine reduced error rates 95%.”", "Direct", "Strong"],
      ["Kafka or streaming ingestion", "“Petabyte-scale ingestion via streaming pipelines.”", "Direct", "Strong"],
    ],
    projects: [
      { n: "Distributed risk-scanning platform v2", lab: "Production-grade", sc: 94, fl: ["10k pods, 1M concurrent", "5x cost reduction"], d: "Asynchronous parallelized scanning; 14x daily throughput gain." },
      { n: "Cross-cloud ETL export system", lab: "Enterprise-grade", sc: 90, fl: ["200GB/day", "Row/column-level security"], d: "Data-lake export with monitoring metrics." },
    ],
    qs: ["Walk through backfill strategy when a streaming source replays."] },

  { id: "e02", name: "Mohammed Rizwan", jd: "de", gt: "strong", exp: 7, current: "Lead Data Engineer, payments company",
    parse: 91, status: "AI Ranked", vRisk: 10, fn: "none",
    s: { sk: 90, pf: 76, se: 88, dp: 86, pr: 90, ex: 92, to: 86, ev: 90 },
    sum: "Seven years of streaming-first data platforms: Kafka exactly-once settlement pipelines, Airflow DAG factory patterns, Spark on K8s, on-call ownership with documented SLAs.",
    skills: ["Python", "Kafka", "Airflow", "Spark", "Kubernetes", "PostgreSQL", "Terraform", "Grafana"] },

  { id: "e03", name: "Jay Thakkar", jd: "de", gt: "medium", exp: 5, current: "Senior Data Engineer, digital consultancy",
    parse: 90, status: "AI Ranked", vRisk: 24, fn: "manual",
    s: { sk: 68, pf: 52, se: 74, dp: 64, pr: 60, ex: 70, to: 66, ev: 70 },
    sum: "Five years across data engineering and analytics: Databricks CI/CD framework, SQL-to-BI structures, multimodal metadata pipelines. Genuine DE skills with an analytics tilt — streaming, orchestration-at-scale, and ops-ownership evidence lighter than the role's core.",
    skills: ["Python", "SQL", "Databricks", "PySpark", "Azure", "GCP", "Power BI"],
    qs: ["Largest pipeline you operated end-to-end — SLA, failure modes, recovery?"] },

  { id: "e04", name: "Kriti Malhotra", jd: "de", gt: "medium", exp: 4, current: "Analytics Engineer, ecommerce",
    parse: 90, status: "AI Ranked", vRisk: 20, fn: "manual",
    s: { sk: 62, pf: 48, se: 70, dp: 58, pr: 52, ex: 60, to: 64, ev: 72 },
    sum: "dbt-centric analytics engineering with solid SQL modeling and Airflow exposure. Batch-analytics profile; streaming and large-scale processing unproven.",
    skills: ["SQL", "dbt", "Python", "Airflow", "BigQuery", "Looker"] },

  { id: "e05", name: "Venkatesh Rao", jd: "de", gt: "mismatch", exp: 11, current: "Senior DBA, insurance",
    parse: 92, status: "AI Ranked", vRisk: 10, fn: "none",
    s: { sk: 36, pf: 22, se: 44, dp: 60, pr: 64, ex: 70, to: 40, ev: 84 },
    sum: "Eleven years of deep Oracle/Postgres administration — backup strategy, tuning, HA. Genuine seniority in an adjacent discipline; pipeline construction and orchestration absent.",
    skills: ["Oracle", "PostgreSQL", "PL/SQL", "Backup/HA", "Linux"] },

  { id: "e06", name: "Omar Siddiqui", jd: "de", gt: "hidden", exp: 3.5, current: "AI Research Engineer, embedded-vision lab",
    parse: 91, status: "Second-Look Review", vRisk: 14, fn: "second",
    s: { sk: 52, pf: 74, se: 82, dp: 88, pr: 84, ex: 55, to: 76, ev: 87 },
    sum: "Edge-ML deployment specialist: TensorRT quantization, INT8-aware training, Dockerized real-time inference on edge accelerators, streaming video pipelines, peer-reviewed research. Never says “MLOps”, “Airflow”, or “Kafka” — but the serving-infrastructure half of this JD is demonstrated at unusual depth.",
    skills: ["PyTorch", "TensorRT", "Docker", "Quantization", "Edge accelerators", "GStreamer", "FastAPI", "Python"],
    sl: { missed: "Zero orchestration/streaming keywords; a keyword gate scores 52 and files him as irrelevant.",
      surfaced: "Model-serving engineering (TensorRT, INT8 QAT, real-time Dockerized inference) maps directly to the preferred serving stack — rarer and harder than the keywords it lacks.",
      verify: "Gap is the data-pipeline half (Airflow/Kafka/Spark). Panel should scope whether the serving-specialist shape fits the team's need.",
      before: "No “MLOps”/“Kafka”/“Airflow” keywords → keyword gate 52 → filed as irrelevant", after: "TensorRT + INT8 QAT + real-time Dockerized inference detected → flagged for review", conf: 83 },
    evid: [
      ["Model serving (Triton/ONNX/TensorRT)", "“Deployment of custom AI models on embedded devices… real-time inference (TensorRT, streaming pipelines).”", "Direct", "Strong"],
      ["Docker / containerized services", "“Deployed containerized inference application using Docker” (industrial anomaly detection).", "Direct", "Strong"],
      ["Airflow or equivalent orchestration", "Not evidenced.", "Missing", "Weak"],
      ["Kafka or streaming ingestion", "Real-time video streaming pipelines — different streaming domain, transferable concepts.", "Adjacent", "Medium"],
    ],
    projects: [
      { n: "Industrial anomaly-detection deployment", lab: "Production-grade", sc: 84, fl: ["Annotation→optimization ownership", "Containerized deployment"], d: "Real-time detection in an industrial setting." },
      { n: "Cross-modal distillation research", lab: "Research-grade", sc: 86, fl: ["High-impact journal — verifiable"], d: "Inference-cost reduction with clinical applicability." },
    ],
    qs: ["Design our batch feature pipeline — where does your serving expertise end and the gap begin?"] },

  { id: "e07", name: "Nilesh Kamble", jd: "de", gt: "hidden", exp: 6, current: "Site Reliability Engineer, adtech",
    parse: 90, status: "AI Ranked", vRisk: 16, fn: "second",
    s: { sk: 50, pf: 60, se: 78, dp: 82, pr: 90, ex: 78, to: 80, ev: 84 },
    sum: "Six years running high-throughput ingest on Nomad/Consul with NATS streaming — the operational half of this JD at depth, expressed in a non-K8s, non-Kafka vocabulary a keyword filter discards.",
    skills: ["Go", "Python", "Nomad", "Consul", "NATS", "Prometheus", "Terraform", "PostgreSQL"],
    sl: { missed: "Stack is Nomad/NATS instead of K8s/Kafka; keyword gate: 50.",
      surfaced: "Equivalent orchestration + streaming operations at 2M events/sec with SLA ownership; concepts transfer near-1:1.",
      verify: "Confirm appetite for K8s/Kafka conventions; concepts are equivalent.",
      before: "Nomad/NATS vocabulary → keyword gate 50 → discarded", after: "2M events/sec streaming ops + SLA ownership detected → flagged for review", conf: 80 } },
];

/* --------------------------- helpers + primitives --------------------------- */
const autoEvidence = (c) => {
  if (c.evid) return c.evid.map(([req, text, type, strength]) => ({ req, text, type, strength }));
  const reqs = REQ_KEYS[c.jd] || [];
  const hay = (c.skills.join(" ") + " " + c.sum).toLowerCase();
  return reqs.slice(0, 6).map(([req, keys, adjKeys]) => {
    if (keys.some((k) => hay.includes(k)))
      return { req, text: `Skill taxonomy match in resume: ${c.skills.filter((s) => keys.some((k) => s.toLowerCase().includes(k))).slice(0, 3).join(", ") || "contextual"}.`, type: "Direct", strength: c.s.ev >= 70 ? "Strong" : "Medium" };
    if (adjKeys.some((k) => hay.includes(k)))
      return { req, text: `Adjacent-stack evidence detected (${adjKeys.filter((k) => hay.includes(k)).join(", ")}); transferable per adjacency map.`, type: "Adjacent", strength: "Medium" };
    return { req, text: "No supporting evidence found in resume.", type: "Missing", strength: "Weak" };
  });
};

const POOL_NAMES = ["Aarav Menon","Kavya Rao","Neel Sharma","Rhea Iyer","Arjun Nair","Diya Kapoor","Vivaan Reddy","Anika Bose","Kabir Mehta","Tara Sen","Ishaan Verma","Mira Das","Ayaan Khanna","Nisha Pillai","Dev Malhotra","Sana Qureshi","Rohan Bhat","Meera Kulkarni","Zoya Mirza","Aditya Shah","Karan Oberoi","Sahil Anand","Veer Saxena","Aryan Joshi","Ravi Teja","Imran Shaikh","Omar Siddiqui","Jay Thakkar","Aarush Gupta","Prakash Rao","Nikhil Joshi","Kriti Malhotra","Venkatesh Rao","Nilesh Kamble","Mohammed Rizwan","Asha Naik","Tanay Ghosh"];
const anonId = (c, idx) => `Candidate ${c.jd.toUpperCase()}-${String(idx + 1).padStart(2, "0")}`;
const dispName = (c, mode, idx, seed) => mode === "anon" ? anonId(c, idx)
  : mode === "random" ? POOL_NAMES[(idx * 7 + seed * 13 + (c.jd === "ds" ? 11 : c.jd === "de" ? 23 : 0)) % POOL_NAMES.length]
  : c.name;

const overallOf = (c, w) => {
  const t = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return Math.round((c.s.sk * w.sk + c.s.se * w.se + c.s.dp * w.dp + c.s.pr * w.pr + c.s.ev * w.ev + c.s.ex * w.ex + c.s.to * w.to) / t);
};
const predBucket = (ov) => ov >= 75 ? "High" : ov >= 55 ? "Medium" : "Low";
const csv = (rows) => rows.map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
const download = (name, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

const SEED_AUDIT = [
  { id: 1, cand: "Candidate DS-01", ai: "Strong fit — recommend technical panel", human: "Moved to Technical Panel", override: false, reviewer: "R. Krishnan (Lead Recruiter)", reason: "Concur", ts: "2026-06-12 09:22:08", snap: "weights v1.0 · embeddings v1.5", notes: "" },
  { id: 2, cand: "Candidate BE-09", ai: "Second-look recommended", human: "Moved to Second-Look Review", override: false, reviewer: "R. Krishnan (Lead Recruiter)", reason: "Hybrid surfaced strong semantic evidence", ts: "2026-06-12 09:31:40", snap: "weights v1.0 · embeddings v1.5", notes: "" },
  { id: 3, cand: "Candidate BE-13", ai: "Duplicate-submission flag", human: "Routed to manual parse review", override: false, reviewer: "System policy", reason: "97% overlap with BE-09", ts: "2026-06-12 09:33:02", snap: "weights v1.0", notes: "Never auto-rejected; human disposition required." },
];

/* primitives — light theme */
const Pill = ({ children, color = C.mut, soft }) => (
  <span style={{ color, background: soft || `${color}14`, border: `1px solid ${color}2e` }}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">{children}</span>
);
const Mono = ({ children, color = C.ink, size = "text-sm" }) => <span className={`font-mono ${size}`} style={{ color }}>{children}</span>;
const Card = ({ children, className = "", pad = "p-5", style = {}, onClick, hover }) => (
  <div onClick={onClick} className={`rounded-xl ${pad} ${className} ${onClick || hover ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
    style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: SH, ...style }}>{children}</div>
);
const H = ({ kicker, title, sub, right }) => (
  <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
    <div className="max-w-2xl">
      {kicker && <div className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: C.blue }}>{kicker}</div>}
      <h2 className="text-2xl font-semibold tracking-tight" style={{ color: C.ink }}>{title}</h2>
      {sub && <p className="text-sm mt-1.5 leading-relaxed" style={{ color: C.mut }}>{sub}</p>}
    </div>
    <div className="text-right">{right}</div>
  </div>
);
const Bar = ({ v, color = C.blue, h = 6 }) => (
  <div className="rounded-full overflow-hidden" style={{ background: C.tint, height: h }}>
    <div style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: color, height: h }} className="rounded-full transition-all duration-500" />
  </div>
);
const scoreColor = (v) => (v >= 75 ? C.green : v >= 55 ? C.amber : C.red);
const Score = ({ v, lg }) => (
  <span className={`font-mono font-semibold ${lg ? "text-2xl" : "text-sm"} px-2 py-0.5 rounded-lg`} style={{ color: scoreColor(v), background: `${scoreColor(v)}14` }}>{v}</span>
);
const Ring = ({ v, size = 64, label }) => {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.tint} strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor(v)} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(v/100)*circ} ${circ}`} transform={`rotate(-90 ${size/2} ${size/2})`} className="transition-all duration-700" />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" className="font-mono font-semibold" fontSize={size/4} fill={C.ink}>{v}</text>
      </svg>
      {label && <span className="text-xs" style={{ color: C.mut }}>{label}</span>}
    </div>
  );
};

/* ------------------------------ shell: nav + demo ---------------------------- */
const SECTIONS = [
  { id: "command", label: "Command Center", icon: LayoutDashboard, tabs: ["Executive Overview", "Hiring Funnel", "Key Risks", "Demo Story"] },
  { id: "jd", label: "JD Intelligence", icon: GitBranch, tabs: ["Role DNA", "Skills Rubric", "Red Flags", "Interview Focus"] },
  { id: "lab", label: "Resume Lab", icon: Upload, tabs: ["Batch Upload", "Parse Quality", "Name Bias Test", "Stress Test"] },
  { id: "cand", label: "Candidate Intelligence", icon: Users, tabs: ["Ranking", "Candidate Detail", "Compare", "Skill Adjacency"] },
  { id: "second", label: "Second-Look", icon: Eye, tabs: ["Hidden-Fit Recovery", "ATS Missed", "Recovery Explanation"] },
  { id: "eval", label: "Evaluation Lab", icon: FlaskConical, tabs: ["Performance Testing", "ATS Baseline", "Model Ablation", "Error Analysis"] },
  { id: "flow", label: "Workflow", icon: Kanban, tabs: ["Kanban Board", "Human Decisions", "Review Queue"] },
  { id: "gov", label: "Governance", icon: Scale, tabs: ["Audit Trail", "Bias-Aware Controls", "Model Versioning", "Settings & Architecture"] },
  { id: "reports", label: "Reports", icon: Download, tabs: ["Export Center"] },
];

const DEMO_STEPS = [
  { label: "JD", section: "jd", tab: "Role DNA", hint: "Step 1 — The system reads the job description and extracts Role DNA: mandatory skills, rubric, red flags. Everything downstream traces back to this." },
  { label: "Resume Batch", section: "lab", tab: "Batch Upload", hint: "Step 2 — A 37-resume benchmark batch is loaded: strong, medium, low, hidden-fit, verification, messy, and duplicate cases. Parse failures route to manual review, never silent rejection." },
  { label: "Ranking", section: "cand", tab: "Ranking", hint: "Step 3 — Hybrid ranking (semantic + keyword + evidence). Select any candidate to preview their evidence. No one is auto-rejected." },
  { label: "Hidden Fit", section: "second", tab: "Hidden-Fit Recovery", hint: "Step 4 — The signature capability: candidates a keyword ATS silently drops, recovered with the reason and the verification question." },
  { label: "Evidence", section: "cand", tab: "Candidate Detail", demoCand: "b09", hint: "Step 5 — Every score decomposes into JD-requirement ↔ resume-evidence links with match type and strength. This is the audit-ready core." },
  { label: "Governance", section: "gov", tab: "Audit Trail", hint: "Step 6 — Every AI recommendation, human decision, and override is logged with model and weight versions. Procurement-ready." },
  { label: "Report", section: "reports", tab: "Export Center", hint: "Step 7 — Export the executive summary, rankings, second-look recovery, and audit trail. The demo ends with a deliverable." },
];

const TopNav = ({ section, setSection, demoOn, startDemo }) => (
  <div style={{ background: C.navy }} className="px-6 pt-4">
    <div className="flex items-center justify-between flex-wrap gap-3 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
          <Sparkles size={17} style={{ color: "#E2C26B" }} />
        </div>
        <div>
          <div className="font-semibold tracking-tight text-white">Marevlo <span style={{ color: "#E2C26B" }}>TalentOS</span></div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>AI-powered technical hiring intelligence, explainability, and workforce evaluation</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!demoOn && <button onClick={startDemo} className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-opacity hover:opacity-90"
          style={{ background: C.blue, color: "#fff" }}><Play size={12} />Guided demo</button>}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(31,157,107,0.15)", border: "1px solid rgba(31,157,107,0.35)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ADE9C" }} />
          <span className="font-mono text-xs" style={{ color: "#4ADE9C" }}>ON-PREM · LOCAL MODELS · NO EXTERNAL APIs</span>
        </div>
      </div>
    </div>
    <div className="flex gap-1 overflow-x-auto">
      {SECTIONS.map((s) => {
        const Icon = s.icon; const active = section === s.id;
        return (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2.5 rounded-t-lg whitespace-nowrap transition-colors"
            style={{ background: active ? C.bg : "transparent", color: active ? C.ink : "rgba(255,255,255,0.65)", fontWeight: active ? 600 : 400 }}>
            <Icon size={14} style={{ color: active ? C.blue : "rgba(255,255,255,0.45)" }} />{s.label}
          </button>);
      })}
    </div>
  </div>
);

const Tabs = ({ tabs, tab, setTab }) => (
  <div className="flex gap-1 mb-6 flex-wrap rounded-lg p-1" style={{ background: C.tint, width: "fit-content" }}>
    {tabs.map((t) => (
      <button key={t} onClick={() => setTab(t)} className="text-sm px-3.5 py-1.5 rounded-md transition-all"
        style={{ background: tab === t ? C.surf : "transparent", color: tab === t ? C.ink : C.mut, fontWeight: tab === t ? 600 : 400, boxShadow: tab === t ? SH : "none" }}>{t}</button>))}
  </div>
);

const DemoBar = ({ step, setStep, exitDemo, goTo }) => (
  <div className="px-6 py-3 flex items-center gap-4 flex-wrap" style={{ background: C.surf, borderBottom: `1px solid ${C.line}`, boxShadow: SH }}>
    <div className="flex items-center gap-1 flex-1 min-w-64 flex-wrap">
      {DEMO_STEPS.map((s, i) => (
        <React.Fragment key={s.label}>
          <button onClick={() => { setStep(i); goTo(s); }} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-colors"
            style={{ background: i === step ? C.blue : i < step ? C.greenSoft : C.tint, color: i === step ? "#fff" : i < step ? C.green : C.mut, fontWeight: i === step ? 600 : 400 }}>
            {i < step ? <CheckCircle2 size={11} /> : <span className="font-mono">{i + 1}</span>}{s.label}
          </button>
          {i < DEMO_STEPS.length - 1 && <ChevronRight size={12} style={{ color: C.faint }} />}
        </React.Fragment>))}
    </div>
    <div className="flex items-center gap-2">
      <button disabled={step === 0} onClick={() => { const n = step - 1; setStep(n); goTo(DEMO_STEPS[n]); }}
        className="text-xs px-3 py-1.5 rounded-lg" style={{ background: C.tint, color: step === 0 ? C.faint : C.text }}>Back</button>
      {step < DEMO_STEPS.length - 1
        ? <button onClick={() => { const n = step + 1; setStep(n); goTo(DEMO_STEPS[n]); }}
            className="flex items-center gap-1 text-xs font-medium px-3.5 py-1.5 rounded-lg text-white" style={{ background: C.blue }}>Next <ArrowRight size={12} /></button>
        : <button onClick={exitDemo} className="text-xs font-medium px-3.5 py-1.5 rounded-lg text-white" style={{ background: C.green }}>Finish demo</button>}
      <button onClick={exitDemo} className="p-1.5 rounded-lg" style={{ background: C.tint, color: C.mut }}><X size={13} /></button>
    </div>
  </div>
);

const DemoHint = ({ step }) => (
  <div className="mb-6 rounded-xl p-4 flex gap-3 items-start" style={{ background: C.blueSoft, border: `1px solid ${C.blue}33` }}>
    <Info size={16} style={{ color: C.blue }} className="mt-0.5 shrink-0" />
    <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{DEMO_STEPS[step].hint}</p>
  </div>
);

const Toast = ({ toast }) => toast ? (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
    style={{ background: C.navy, color: "#fff", boxShadow: SH2 }}>
    <CheckCircle2 size={15} style={{ color: "#4ADE9C" }} />{toast}
  </div>) : null;

/* ------------------------------- command center ------------------------------ */
const PIPELINE_STEPS = ["JD Upload", "Resume Parsing", "Evidence Mapping", "Candidate Ranking", "Second-Look Recovery", "Human Review", "Audit Report"];
const CommandCenter = ({ tab, all, pool, overall, names, go }) => {
  const [pulse, setPulse] = useState(0);
  useEffect(() => { const t = setInterval(() => setPulse((p) => (p + 1) % PIPELINE_STEPS.length), 1400); return () => clearInterval(t); }, []);
  const hidden = all.filter((c) => c.gt === "hidden");
  const verify = all.filter((c) => c.gt === "verify");
  const parseOk = Math.round((all.filter((c) => c.parse >= 70).length / all.length) * 100);
  const evCov = Math.round(all.reduce((a, c) => a + c.s.ev, 0) / all.length);

  if (tab === "Executive Overview") return (
    <div className="space-y-6">
      <div className="rounded-2xl p-10 relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${C.navy} 0%, ${C.navy2} 55%, #3C5222 100%)`, boxShadow: SH2 }}>
        <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#E2C26B" }}>Benchmark evaluation instance · {all.length} resumes · 3 roles</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-3 max-w-2xl">AI workforce intelligence for technical hiring.</h1>
        <p className="text-sm leading-relaxed max-w-2xl mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
          Evaluate resumes against job descriptions, recover hidden-fit candidates, explain every recommendation with evidence,
          and govern every hiring decision through a human-in-the-loop workflow.</p>
        <div className="flex items-center gap-1 flex-wrap">
          {PIPELINE_STEPS.map((p, i) => (
            <React.Fragment key={p}>
              <span className="text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-500"
                style={{ background: i === pulse ? "rgba(226,194,107,0.25)" : "rgba(255,255,255,0.06)", color: i === pulse ? "#fff" : "rgba(255,255,255,0.6)", border: `1px solid ${i === pulse ? "#E2C26B66" : "rgba(255,255,255,0.10)"}` }}>{p}</span>
              {i < PIPELINE_STEPS.length - 1 && <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.3)" }} />}
            </React.Fragment>))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[[Target, "Evidence-Based Ranking", "Every score decomposes into JD-requirement ↔ resume-evidence links a reviewer can audit."],
          [Eye, "Hidden-Fit Candidate Recovery", "Surfaces strong candidates whose vocabulary doesn't match the JD — the ones keyword filters drop silently."],
          [Layers, "Project Depth Intelligence", "Separates production-grade work from tutorial-pattern portfolios, advisory-only."],
          [Scale, "Audit-Ready Human Decisions", "No auto-rejection state exists. Every decision is human, logged, and versioned."]].map(([Icon, t, d]) => (
          <Card key={t} pad="p-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: C.blueSoft }}><Icon size={16} style={{ color: C.blue }} /></div>
            <div className="text-sm font-semibold mb-1.5" style={{ color: C.ink }}>{t}</div>
            <div className="text-xs leading-relaxed" style={{ color: C.mut }}>{d}</div>
          </Card>))}
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {[[`${all.length}`, "resumes evaluated"], ["3", "roles benchmarked"], [`${hidden.length}`, "hidden-fit surfaced"], ["0", "auto-rejections"], [`${parseOk}%`, "parse success"], [`${evCov}%`, "evidence coverage"]].map(([v, k]) => (
          <Card key={k} pad="p-4" className="text-center">
            <Mono size="text-2xl" color={k === "auto-rejections" ? C.green : C.ink}>{v}</Mono>
            <div className="text-xs mt-1" style={{ color: C.mut }}>{k}</div>
          </Card>))}
      </div>
      <Card pad="p-5" className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold mb-0.5" style={{ color: C.ink }}>First time seeing Marevlo TalentOS?</div>
          <div className="text-xs" style={{ color: C.mut }}>The seven-step guided demo walks a buyer from JD to exported report in about four minutes.</div>
        </div>
        <button onClick={() => go("demo")} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg text-white" style={{ background: C.blue }}>
          <Play size={13} />Start guided demo</button>
      </Card>
    </div>
  );

  if (tab === "Hiring Funnel") {
    const stages = [["Ingested", all.length], ["Parsed cleanly", all.filter((c) => c.parse >= 70).length], ["AI ranked", all.filter((c) => c.parse >= 70).length], ["Human review queue", all.filter((c) => ["Recruiter Review", "Second-Look Review", "Needs Manual Parse Review"].includes(c.status)).length], ["Technical panel", all.filter((c) => c.status === "Technical Panel").length], ["Shortlisted+", all.filter((c) => ["Shortlisted", "Final Selected"].includes(c.status)).length]];
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-sm font-semibold mb-5" style={{ color: C.ink }}>Hiring funnel — all requisitions</div>
          {stages.map(([k, v], i) => (
            <div key={k} className="flex items-center gap-4 mb-3">
              <div className="w-44 text-sm" style={{ color: C.text }}>{k}</div>
              <div className="flex-1"><Bar v={(v / all.length) * 100} color={i < 3 ? C.blue : i < 5 ? C.amber : C.green} h={20} /></div>
              <Mono size="text-sm" color={C.ink}>{v}</Mono>
            </div>))}
          <div className="text-xs mt-3" style={{ color: C.faint }}>Every narrowing of the funnel below "AI ranked" is a logged human action — the system has no rejection authority.</div>
        </Card>
        <div className="grid grid-cols-3 gap-4">
          {["be", "ds", "de"].map((j) => {
            const p = all.filter((c) => c.jd === j);
            return (
              <Card key={j} pad="p-5">
                <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: C.blue }}>{JDS[j].reqId}</div>
                <div className="text-sm font-semibold mb-3" style={{ color: C.ink }}>{JDS[j].title}</div>
                <div className="flex gap-1.5 flex-wrap">{Object.entries(GT_META).map(([k, m]) => {
                  const n = p.filter((c) => c.gt === k).length;
                  return n > 0 && <Pill key={k} color={m.c} soft={m.s}>{n} {m.label.toLowerCase()}</Pill>;
                })}</div>
              </Card>);
          })}
        </div>
      </div>);
  }

  if (tab === "Key Risks") return (
    <div className="space-y-4">
      {[
        [C.violet, C.violetSoft, AlertTriangle, `${verify.length} profiles need verification before progression`, "Stated-experience vs dated-history inconsistencies and skill lists exceeding evidence. Advisory flags — each carries suggested probing questions for the interview, never automatic consequences."],
        [C.gold, C.goldSoft, Eye, `${hidden.length} hidden-fit candidates would be lost to a keyword gate`, "High semantic and project evidence with low keyword overlap. All are flagged to the Second-Look lane for mandatory human review."],
        [C.amber, C.amberSoft, FileWarning, `${all.filter((c) => c.messy).length} resumes parsed below confidence threshold`, "Format failures, a missing identity, and one duplicate submission. All routed to manual parse review; none silently dropped."],
        [C.green, C.greenSoft, CheckCircle2, "0 auto-rejections across the entire batch", "The workflow contains no machine-rejection state. Every terminal decision is a logged human action with reason and evidence snapshot."],
      ].map(([c, s, Icon, t, d]) => (
        <Card key={t} pad="p-5" className="flex gap-4 items-start">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s }}><Icon size={16} style={{ color: c }} /></div>
          <div><div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>{t}</div>
            <div className="text-xs leading-relaxed" style={{ color: C.mut }}>{d}</div></div>
        </Card>))}
    </div>);

  /* Demo Story */
  return (
    <div className="space-y-5">
      <Card pad="p-6">
        <div className="text-sm font-semibold mb-2" style={{ color: C.ink }}>The four-minute buyer story</div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: C.mut }}>
          Run the guided demo for the cleanest narrative arc: start at the JD, load the benchmark batch, show the ranking,
          then land the emotional high point — hidden-fit recovery — before proving rigor with evidence, governance, and an exported report.</p>
        <div className="space-y-2.5">
          {DEMO_STEPS.map((s, i) => (
            <div key={s.label} className="flex items-start gap-3">
              <span className="font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.blueSoft, color: C.blue }}>{i + 1}</span>
              <div><span className="text-sm font-medium" style={{ color: C.ink }}>{s.label}</span>
                <span className="text-xs ml-2" style={{ color: C.mut }}>{s.hint.replace(/^Step \d+ — /, "")}</span></div>
            </div>))}
        </div>
        <button onClick={() => go("demo")} className="mt-5 flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg text-white" style={{ background: C.blue }}>
          <Play size={13} />Start guided demo</button>
      </Card>
    </div>);
};

/* ------------------------------ JD intelligence ------------------------------ */
const JDIntel = ({ tab, jd }) => {
  const d = JDS[jd];
  if (tab === "Role DNA") return (
    <div className="space-y-5">
      <Card pad="p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: C.blue }}>{d.reqId}</div>
            <div className="text-lg font-semibold" style={{ color: C.ink }}>{d.title}</div>
          </div>
          <Pill color={C.green} soft={C.greenSoft}><CheckCircle2 size={11} />JD parsed · Role DNA extracted</Pill>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: C.mut }}>{d.context}</p>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card pad="p-5">
          <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.red }}>Mandatory skills</div>
          <div className="flex flex-wrap gap-2">{d.mandatory.map((x) => <Pill key={x} color={C.red} soft={C.redSoft}>{x}</Pill>)}</div>
        </Card>
        <Card pad="p-5">
          <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.blue }}>Preferred skills</div>
          <div className="flex flex-wrap gap-2">{d.preferred.map((x) => <Pill key={x} color={C.blue} soft={C.blueSoft}>{x}</Pill>)}</div>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[["Experience band", `${d.expBand[0]}–${d.expBand[1]} years`], ["Project expectations", d.projectExp], ["Domain expectations", d.domainExp]].map(([k, v]) => (
          <Card key={k} pad="p-5"><div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>{k}</div>
            <p className="text-sm leading-relaxed" style={{ color: C.text }}>{v}</p></Card>))}
      </div>
    </div>);
  if (tab === "Skills Rubric") return (
    <div className="space-y-5">
      <Card pad="p-6">
        <div className="text-sm font-semibold mb-2" style={{ color: C.ink }}>How this role is scored</div>
        <p className="text-sm leading-relaxed mb-5" style={{ color: C.mut }}>{d.rubric}</p>
        {WEIGHT_META.map(([k, label, desc]) => (
          <div key={k} className="flex items-center gap-4 mb-3">
            <div className="w-52"><div className="text-sm" style={{ color: C.ink }}>{label}</div><div className="text-xs" style={{ color: C.faint }}>{desc}</div></div>
            <div className="flex-1"><Bar v={DEFAULT_WEIGHTS[k] * 2} color={C.blue} h={8} /></div>
            <Mono color={C.blue}>{DEFAULT_WEIGHTS[k]}%</Mono>
          </div>))}
        <div className="text-xs mt-3" style={{ color: C.faint }}>Weights are configurable in Governance → Settings &amp; Architecture; every ranking recomputes live.</div>
      </Card>
      <Card pad="p-5"><div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>Delivery expectations</div>
        <p className="text-sm leading-relaxed" style={{ color: C.text }}>{d.deliveryExp}</p></Card>
    </div>);
  if (tab === "Red Flags") return (
    <div className="space-y-4">
      {d.redFlags.map((r) => (
        <Card key={r} pad="p-5" className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.redSoft }}><AlertTriangle size={14} style={{ color: C.red }} /></div>
          <div><div className="text-sm font-medium" style={{ color: C.ink }}>{r}</div>
            <div className="text-xs mt-1" style={{ color: C.mut }}>Detected patterns raise advisory flags for human review — they never gate or reject a candidate automatically.</div></div>
        </Card>))}
    </div>);
  return (
    <div className="grid grid-cols-3 gap-4">
      {d.interviewFocus.map((f) => (
        <Card key={f} pad="p-5">
          <MessageSquare size={15} style={{ color: C.teal }} className="mb-2.5" />
          <div className="text-sm font-medium" style={{ color: C.ink }}>{f}</div>
          <div className="text-xs mt-1.5" style={{ color: C.mut }}>Per-candidate probing questions are generated from individual evidence gaps on the Candidate Detail screen.</div>
        </Card>))}
    </div>);
};

/* -------------------------------- resume lab --------------------------------- */
const ResumeLab = ({ tab, pool, overall, names, openCand, nameMode, setNameMode, runBiasTest, toastMsg }) => {
  const [catF, setCatF] = useState("All");
  const cats = [["All", null], ...Object.entries(GT_META).map(([k, m]) => [m.label, k]), ["Messy resume", "_messy"], ["Duplicate detected", "_dup"]];
  const rows = pool.filter((c) => {
    const sel = cats.find(([l]) => l === catF)?.[1];
    if (!sel) return true;
    if (sel === "_messy") return !!c.messy;
    if (sel === "_dup") return !!c.dup;
    return c.gt === sel;
  });
  if (tab === "Batch Upload") return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card pad="p-6" className="text-center" style={{ border: `2px dashed ${C.blue}55`, background: C.blueSoft }}>
          <Upload size={20} style={{ color: C.blue }} className="mx-auto mb-2" />
          <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Load demo batch</div>
          <div className="text-xs mb-3" style={{ color: C.mut }}>37 benchmark resumes with labelled ground truth — loaded</div>
          <Pill color={C.green} soft={C.greenSoft}><CheckCircle2 size={11} />Batch B-0612 active</Pill>
        </Card>
        <Card pad="p-6" className="text-center" style={{ border: `2px dashed ${C.line}` }}>
          <FileText size={20} style={{ color: C.mut }} className="mx-auto mb-2" />
          <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Upload your own resumes</div>
          <div className="text-xs mb-3" style={{ color: C.mut }}>Test with your batch — files are parsed locally and never leave your infrastructure</div>
          <button onClick={() => toastMsg("Upload available in deployed instances — demo uses the benchmark batch")} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: C.tint, color: C.text }}>Browse files</button>
        </Card>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[["Parsed successfully", pool.filter((c) => c.parse >= 70 && !c.dup).length, C.green, C.greenSoft],
          ["Needs manual parse review", pool.filter((c) => c.parse < 70).length, C.amber, C.amberSoft],
          ["Duplicate detected", pool.filter((c) => c.dup).length, C.red, C.redSoft],
          ["Evidence incomplete", pool.filter((c) => c.fn === "incomplete").length, C.amber, C.amberSoft],
          ["Verification recommended", pool.filter((c) => c.vRisk >= 60).length, C.violet, C.violetSoft]].map(([k, v, col, s]) => (
          <Card key={k} pad="p-4"><Mono size="text-xl" color={col}>{v}</Mono><div className="text-xs mt-1" style={{ color: C.mut }}>{k}</div></Card>))}
      </div>
      <div>
        <div className="flex gap-2 flex-wrap mb-4">
          {cats.map(([l, k]) => {
            const m = k && GT_META[k];
            return (
              <button key={l} onClick={() => setCatF(l)} className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{ background: catF === l ? (m ? m.s : C.blueSoft) : C.surf, color: catF === l ? (m ? m.c : C.blue) : C.mut, border: `1px solid ${catF === l ? (m ? m.c : C.blue) + "55" : C.line}`, fontWeight: catF === l ? 600 : 400 }}>{l}</button>);
          })}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {rows.map((c) => (
            <Card key={c.id} pad="p-4" onClick={() => openCand(c.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold truncate pr-2" style={{ color: C.ink }}>{names(c)}</div>
                <Score v={overall(c)} />
              </div>
              <div className="text-xs mb-2.5 truncate" style={{ color: C.mut }}>{c.current} · {c.exp}y</div>
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                <Pill color={GT_META[c.gt].c} soft={GT_META[c.gt].s}>{GT_META[c.gt].label}</Pill>
                {c.messy && <Pill color={C.amber} soft={C.amberSoft}>messy</Pill>}
                {c.dup && <Pill color={C.red} soft={C.redSoft}>duplicate</Pill>}
              </div>
              <div className="flex items-center gap-2"><div className="flex-1"><Bar v={c.parse} color={c.parse >= 70 ? C.green : C.amber} h={4} /></div>
                <span className="text-xs font-mono" style={{ color: C.faint }}>parse {c.parse}%</span></div>
            </Card>))}
        </div>
      </div>
    </div>);
  if (tab === "Parse Quality") {
    const buckets = [["90–100%", pool.filter((c) => c.parse >= 90).length, C.green], ["70–89%", pool.filter((c) => c.parse >= 70 && c.parse < 90).length, C.green], ["55–69%", pool.filter((c) => c.parse >= 55 && c.parse < 70).length, C.amber], ["< 55%", pool.filter((c) => c.parse < 55).length, C.red]];
    const mx = Math.max(...buckets.map((b) => b[1]), 1);
    return (
      <div className="space-y-5">
        <Card pad="p-6">
          <div className="text-sm font-semibold mb-5" style={{ color: C.ink }}>Parse confidence distribution</div>
          <div className="flex items-end gap-6 h-44 px-2">
            {buckets.map(([k, v, col]) => (
              <div key={k} className="flex-1 flex flex-col items-center gap-2">
                <Mono size="text-sm" color={col}>{v}</Mono>
                <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${(v / mx) * 100}%`, background: col, opacity: 0.85, minHeight: v ? 8 : 2 }} />
                <span className="text-xs" style={{ color: C.mut }}>{k}</span>
              </div>))}
          </div>
        </Card>
        <div className="space-y-3">
          {pool.filter((c) => c.messy || c.dup).map((c) => (
            <Card key={c.id} pad="p-4" onClick={() => openCand(c.id)} className="flex items-start gap-3">
              <FileWarning size={15} style={{ color: c.dup ? C.red : C.amber }} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold" style={{ color: C.ink }}>{names(c)}</span>
                  <span className="text-xs font-mono" style={{ color: C.faint }}>parse {c.parse}%</span></div>
                <div className="text-xs leading-relaxed" style={{ color: C.mut }}>{c.messy}</div>
              </div>
              <Pill color={C.amber} soft={C.amberSoft}>still evaluated · routed to manual review</Pill>
            </Card>))}
        </div>
        <div className="text-xs" style={{ color: C.faint }}>Policy: a parse failure must never silently become a rejection. Low-confidence parses stay in the pool with reduced evidence confidence and a mandatory human check.</div>
      </div>);
  }
  if (tab === "Name Bias Test") return (
    <div className="space-y-5">
      <Card pad="p-6">
        <div className="text-sm font-semibold mb-2" style={{ color: C.ink }}>Name bias test</div>
        <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: C.mut }}>
          Candidate identity is excluded from scoring at parse time. Prove it: switch display modes or randomize every name —
          the ranking will not move. The delta readout is computed live from the actual ranking, not asserted.</p>
        <div className="flex gap-2 flex-wrap">
          {[["anon", "Show anonymized IDs", EyeOff], ["synthetic", "Show synthetic names", Eye]].map(([m, l, Icon]) => (
            <button key={m} onClick={() => setNameMode(m)} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-all"
              style={{ background: nameMode === m ? C.blueSoft : C.surf, color: nameMode === m ? C.blue : C.mut, border: `1px solid ${nameMode === m ? C.blue + "55" : C.line}`, fontWeight: nameMode === m ? 600 : 400 }}>
              <Icon size={13} />{l}</button>))}
          <button onClick={runBiasTest} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ background: C.blue }}>
            <Shuffle size={13} />Randomize names &amp; rerun ranking</button>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card pad="p-5"><div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.mut }}>What identity-adjacent fields are excluded</div>
          {["Name (display only — never a feature)", "Gender, age, date of birth", "Religion, caste, nationality markers", "Photographs", "Address (unless role-mandated)"].map((g) => (
            <div key={g} className="flex items-center gap-2 mb-2"><CheckCircle2 size={13} style={{ color: C.green }} /><span className="text-sm" style={{ color: C.text }}>{g}</span></div>))}
        </Card>
        <Card pad="p-5"><div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.mut }}>Why default to anonymized IDs</div>
          <p className="text-sm leading-relaxed" style={{ color: C.text }}>Serious demo mode shows Candidate BE-01, DS-04, DE-07. Reviewer attention goes to evidence, not identity — and the bias-test result (delta 0) becomes self-evidently credible.</p>
        </Card>
      </div>
    </div>);
  /* Stress Test */
  const stressCases = [
    ["Hide exact skill keywords", "Keyword channel drops ~30 points on affected profiles; semantic channel holds — candidates fall toward the second-look band instead of disappearing.", C.gold],
    ["Add noisy formatting", "Parse confidence drops below threshold; affected resumes route to Needs Manual Parse Review with reduced evidence confidence. Rank is dampened, never zeroed.", C.amber],
    ["Remove dates", "Experience-alignment channel marks the band unverifiable; verification flag raised; cross-field consistency checks disabled with a warning.", C.amber],
    ["Add inflated claim", "Claim-vs-evidence divergence raises verification risk; evidence-confidence weighting prevents rank inflation (see DS-15 in the live batch).", C.violet],
    ["Duplicate a resume", "Shingled-text overlap above 0.9 fires duplicate detection; both copies freeze pending human disposition (see BE-13).", C.red],
    ["Change candidate name", "Zero ranking movement — identity is not a feature. Verified live in the Name Bias Test.", C.green],
  ];
  return (
    <div className="space-y-4">
      <Card pad="p-5"><p className="text-sm leading-relaxed" style={{ color: C.mut }}>
        Stress behaviors are engineered into the benchmark batch itself — each case below is live in the data and inspectable, not hypothetical. The right column states the designed system response.</p></Card>
      {stressCases.map(([t, d, col]) => (
        <Card key={t} pad="p-4" className="flex items-start gap-4">
          <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: col }} />
          <div className="w-56 shrink-0 text-sm font-medium" style={{ color: C.ink }}>{t}</div>
          <div className="text-sm leading-relaxed" style={{ color: C.mut }}>{d}</div>
        </Card>))}
    </div>);
};

/* --------------------------- candidate intelligence -------------------------- */
const DECISIONS = [
  { k: "Shortlisted", label: "Shortlist", icon: CheckCircle2, color: C.green },
  { k: "Technical Panel", label: "Technical panel", icon: Users, color: C.teal },
  { k: "Second-Look Review", label: "Second-look", icon: Eye, color: C.gold },
  { k: "On Hold", label: "Hold", icon: PauseCircle, color: C.mut },
  { k: "Rejected by Human", label: "Reject with reason", icon: XCircle, color: C.red },
];

const RankingView = ({ pool, overall, names, selected, setSelected, openDetail, showGT, setShowGT }) => {
  const [q, setQ] = useState("");
  const rows = [...pool].sort((a, b) => overall(b) - overall(a))
    .filter((c) => !q || names(c).toLowerCase().includes(q.toLowerCase()) || c.skills.join(" ").toLowerCase().includes(q.toLowerCase()));
  const sel = pool.find((c) => c.id === selected) || rows[0];
  const ev = sel ? autoEvidence(sel) : [];
  return (
    <div className="grid grid-cols-5 gap-5">
      <div className="col-span-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: C.surf, border: `1px solid ${C.line}` }}>
            <Search size={14} style={{ color: C.faint }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search candidates or skills…" className="flex-1 text-sm outline-none bg-transparent" style={{ color: C.ink }} />
          </div>
          <button onClick={() => setShowGT(!showGT)} className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            style={{ background: showGT ? C.violetSoft : C.surf, color: showGT ? C.violet : C.mut, border: `1px solid ${showGT ? C.violet + "55" : C.line}` }}>
            <FlaskConical size={12} />{showGT ? "Ground truth on" : "Ground truth"}</button>
        </div>
        <Card pad="p-0" className="overflow-hidden">
          {rows.map((c, i) => {
            const active = sel && c.id === sel.id;
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} onDoubleClick={() => openDetail(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: active ? C.blueSoft : "transparent", borderBottom: `1px solid ${C.lineSoft}`, borderLeft: `3px solid ${active ? C.blue : "transparent"}` }}>
                <Mono size="text-xs" color={C.faint}>{i + 1}</Mono>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: C.ink }}>{names(c)}</span>
                    {c.fn === "second" && <Eye size={12} style={{ color: C.gold }} />}
                    {c.vRisk >= 60 && <AlertTriangle size={12} style={{ color: C.violet }} />}
                  </div>
                  <div className="text-xs truncate" style={{ color: C.mut }}>{c.current}</div>
                </div>
                {showGT && <Pill color={GT_META[c.gt].c} soft={GT_META[c.gt].s}>{GT_META[c.gt].label}</Pill>}
                <div className="w-16 hidden lg:block"><Bar v={c.s.ev} color={scoreColor(c.s.ev)} h={4} /></div>
                <Score v={overall(c)} />
              </button>);
          })}
        </Card>
      </div>
      <div className="col-span-2">
        {sel ? (
          <Card pad="p-5" className="space-y-4 sticky top-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-base font-semibold" style={{ color: C.ink }}>{names(sel)}</div>
                <div className="text-xs" style={{ color: C.mut }}>{sel.current} · {sel.exp}y</div>
              </div>
              <Ring v={overall(sel)} size={56} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Pill color={FN_LABELS[sel.fn].c} soft={FN_LABELS[sel.fn].s}>{FN_LABELS[sel.fn].t}</Pill>
              {sel.vRisk >= 60 && <Pill color={C.violet} soft={C.violetSoft}>verify risk {sel.vRisk}</Pill>}
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>Top matched evidence</div>
              {ev.filter((e) => e.strength === "Strong").slice(0, 2).map((e, i) => (
                <div key={i} className="rounded-lg p-2.5 mb-2" style={{ background: C.greenSoft }}>
                  <div className="text-xs font-medium mb-0.5" style={{ color: C.ink }}>{e.req}</div>
                  <div className="text-xs leading-relaxed" style={{ color: C.mut }}>{e.text}</div>
                </div>))}
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>Gaps</div>
              <div className="flex gap-1.5 flex-wrap">{ev.filter((e) => e.type === "Missing").map((e, i) => <Pill key={i} color={C.red} soft={C.redSoft}>{e.req}</Pill>)}
                {ev.filter((e) => e.type === "Missing").length === 0 && <span className="text-xs" style={{ color: C.faint }}>No missing mandatory evidence detected.</span>}</div>
            </div>
            {sel.sl && <div className="rounded-lg p-3" style={{ background: C.goldSoft }}>
              <div className="text-xs font-semibold mb-1" style={{ color: C.gold }}>Second-look reason</div>
              <div className="text-xs leading-relaxed" style={{ color: C.text }}>{sel.sl.surfaced}</div></div>}
            <button onClick={() => openDetail(sel.id)} className="w-full flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg text-white" style={{ background: C.blue }}>
              Open full evidence view <ArrowRight size={13} /></button>
          </Card>
        ) : <Card pad="p-10" className="text-center text-sm" style={{ color: C.mut }}>Select a candidate to preview evidence.</Card>}
      </div>
    </div>
  );
};

const CandidateDetail = ({ c, overall, names, decide, weights, back }) => {
  const [note, setNote] = useState("");
  if (!c) return <Card pad="p-12" className="text-center"><div className="text-sm" style={{ color: C.mut }}>Pick a candidate from Ranking to open the full evidence view.</div></Card>;
  const ov = overall(c); const ev = autoEvidence(c);
  const aiRec = c.vRisk >= 60 ? "Verification recommended before progressing" : c.fn === "second" ? "Second-look review recommended" : ov >= 75 ? "Recommend shortlist / technical panel" : ov >= 55 ? "Recommend recruiter review" : "Low evidence of fit — human disposition required";
  return (
    <div className="space-y-5">
      <button onClick={back} className="text-xs font-medium flex items-center gap-1" style={{ color: C.blue }}><ChevronRight size={12} className="rotate-180" />Back to ranking</button>
      {(c.sl || c.vRisk >= 60 || c.messy) && (
        <div className="space-y-2">
          {c.sl && <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: C.goldSoft, border: `1px solid ${C.gold}44` }}>
            <Eye size={15} style={{ color: C.gold }} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}><span className="font-semibold">Hidden-fit signal. </span>{c.sl.surfaced}</p></div>}
          {c.vRisk >= 60 && <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: C.violetSoft, border: `1px solid ${C.violet}44` }}>
            <AlertTriangle size={15} style={{ color: C.violet }} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}><span className="font-semibold">Verification recommended. </span>{(c.flagsX || ["Evidence does not yet support the breadth of claims."]).join(" · ")} Advisory only — tested in conversation, never auto-rejected.</p></div>}
          {c.messy && <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: C.amberSoft, border: `1px solid ${C.amber}44` }}>
            <FileWarning size={15} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}><span className="font-semibold">Parse robustness note. </span>{c.messy}</p></div>}
        </div>)}
      <div className="grid grid-cols-7 gap-5">
        {/* left: profile */}
        <div className="col-span-2 space-y-4">
          <Card pad="p-5">
            <div className="text-base font-semibold mb-0.5" style={{ color: C.ink }}>{names(c)}</div>
            <div className="text-xs mb-4" style={{ color: C.mut }}>{c.current}</div>
            {[["Target role", JDS[c.jd].title], ["Requisition", JDS[c.jd].reqId], ["Experience", `${c.exp} years`], ["Parse confidence", `${c.parse}%`]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <span className="text-xs" style={{ color: C.mut }}>{k}</span><span className="text-xs font-medium" style={{ color: C.ink }}>{v}</span></div>))}
            <div className="text-xs font-semibold tracking-wider uppercase mt-4 mb-2" style={{ color: C.mut }}>Key skills</div>
            <div className="flex gap-1.5 flex-wrap">{c.skills.map((s) => <Pill key={s} color={C.blue} soft={C.blueSoft}>{s}</Pill>)}</div>
          </Card>
          <Card pad="p-5">
            <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>Summary digest</div>
            <p className="text-sm leading-relaxed" style={{ color: C.text }}>{c.sum}</p>
          </Card>
          {c.projects && <Card pad="p-5">
            <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.mut }}>Projects · reality assessment</div>
            {c.projects.map((p) => (
              <div key={p.n} className="rounded-lg p-3 mb-2.5" style={{ background: C.soft, border: `1px solid ${C.lineSoft}` }}>
                <div className="flex items-center justify-between mb-1.5"><span className="text-sm font-medium pr-2" style={{ color: C.ink }}>{p.n}</span><Score v={p.sc} /></div>
                <div className="flex gap-1.5 flex-wrap mb-1.5">
                  <Pill color={p.lab.includes("Production") || p.lab.includes("Enterprise") ? C.green : p.lab.includes("inflated") ? C.red : p.lab.includes("Tutorial") || p.lab.includes("verification") ? C.amber : C.teal}
                    soft={p.lab.includes("Production") || p.lab.includes("Enterprise") ? C.greenSoft : p.lab.includes("inflated") ? C.redSoft : p.lab.includes("Tutorial") || p.lab.includes("verification") ? C.amberSoft : C.tealSoft}>{p.lab}</Pill>
                  {p.fl.map((f) => <Pill key={f} color={C.mut}>{f}</Pill>)}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.mut }}>{p.d}</p>
              </div>))}
            <div className="text-xs" style={{ color: C.faint }}>Advisory only — never used to auto-reject.</div>
          </Card>}
        </div>
        {/* center: evidence map */}
        <div className="col-span-3 space-y-4">
          <Card pad="p-5">
            <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: C.blue }}>Evidence map</div>
            <div className="text-xs mb-4" style={{ color: C.faint }}>JD requirement → resume evidence → confidence → reviewer action</div>
            {ev.map((e, i) => (
              <div key={i} className="rounded-xl p-4 mb-3" style={{ background: e.type === "Missing" ? C.redSoft : C.soft, border: `1px solid ${e.type === "Missing" ? C.red + "33" : C.lineSoft}` }}>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: C.ink }}>{e.req}</span>
                  <div className="flex gap-1.5">
                    <Pill color={MTYPE[e.type]}>{e.type}</Pill>
                    <Pill color={STRENGTH[e.strength]}>{e.strength}</Pill>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: e.type === "Missing" ? C.red : C.text }}>{e.text}</p>
              </div>))}
          </Card>
          {c.qs && <Card pad="p-5">
            <div className="text-xs font-semibold tracking-wider uppercase mb-2.5" style={{ color: C.teal }}>Suggested interview probes — generated from gaps</div>
            <ul className="space-y-2">{c.qs.map((q) => <li key={q} className="text-sm flex gap-2.5 leading-relaxed" style={{ color: C.text }}><span style={{ color: C.teal }}>?</span>{q}</li>)}</ul>
          </Card>}
        </div>
        {/* right: decision intelligence */}
        <div className="col-span-2 space-y-4">
          <Card pad="p-5" className="text-center">
            <Ring v={ov} size={88} label="overall fit" />
            <div className="text-xs mt-3 leading-relaxed px-2" style={{ color: C.mut }}>{aiRec}</div>
          </Card>
          <Card pad="p-5">
            <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.mut }}>Score decomposition</div>
            {WEIGHT_META.map(([k, label]) => (
              <div key={k} className="flex items-center gap-2.5 mb-2.5">
                <div className="w-28 text-xs truncate" style={{ color: C.mut }}>{label}</div>
                <div className="flex-1"><Bar v={c.s[k]} color={scoreColor(c.s[k])} h={5} /></div>
                <Mono size="text-xs" color={C.ink}>{c.s[k]}</Mono>
                <span className="text-xs font-mono w-8 text-right" style={{ color: C.faint }}>×{weights[k]}</span>
              </div>))}
          </Card>
          <Card pad="p-5">
            <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: C.mut }}>Human decision · final call is always human</div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Audit note / override reason"
              className="w-full text-sm rounded-lg px-3 py-2 mb-3 outline-none" style={{ background: C.soft, color: C.ink, border: `1px solid ${C.line}` }} />
            <div className="grid grid-cols-1 gap-1.5">
              {DECISIONS.map((d) => { const Icon = d.icon; return (
                <button key={d.k} onClick={() => decide(c, d.k, d.label, note, false)}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all hover:shadow-sm"
                  style={{ background: `${d.color}10`, color: d.color, border: `1px solid ${d.color}33` }}><Icon size={14} />{d.label}</button>); })}
              <button onClick={() => decide(c, "Recruiter Review", "Override AI recommendation", note || "Override without note", true)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}44` }}>
                <RotateCcw size={14} />Override AI recommendation</button>
            </div>
            <div className="text-xs mt-3 leading-relaxed" style={{ color: C.faint }}>Logged with reviewer, timestamp, AI recommendation, model + weight versions, and evidence snapshot.</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CompareView = ({ pool, overall, names }) => {
  const sorted = [...pool].sort((a, b) => overall(b) - overall(a));
  const [ids, setIds] = useState([sorted[0]?.id, sorted.find((c) => c.gt === "hidden")?.id].filter(Boolean));
  const toggle = (id) => setIds((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? [...p.slice(1), id] : [...p, id]);
  const chosen = ids.map((id) => pool.find((c) => c.id === id)).filter(Boolean);
  return (
    <div className="space-y-5">
      <Card pad="p-4">
        <div className="text-xs font-semibold tracking-wider uppercase mb-2.5" style={{ color: C.mut }}>Pick up to 3 candidates</div>
        <div className="flex gap-2 flex-wrap">
          {sorted.map((c) => (
            <button key={c.id} onClick={() => toggle(c.id)} className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ background: ids.includes(c.id) ? C.blueSoft : C.surf, color: ids.includes(c.id) ? C.blue : C.mut, border: `1px solid ${ids.includes(c.id) ? C.blue + "66" : C.line}`, fontWeight: ids.includes(c.id) ? 600 : 400 }}>{names(c)}</button>))}
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        {chosen.map((c) => (
          <Card key={c.id} pad="p-5">
            <div className="text-center mb-4">
              <Ring v={overall(c)} size={72} />
              <div className="text-sm font-semibold mt-2" style={{ color: C.ink }}>{names(c)}</div>
              <div className="text-xs" style={{ color: C.mut }}>{c.exp}y · {c.current}</div>
              <div className="mt-2 flex justify-center gap-1.5 flex-wrap">
                <Pill color={FN_LABELS[c.fn].c} soft={FN_LABELS[c.fn].s}>{FN_LABELS[c.fn].t}</Pill>
              </div>
            </div>
            {WEIGHT_META.map(([k, label]) => (
              <div key={k} className="flex items-center gap-2 mb-2">
                <div className="w-24 text-xs truncate" style={{ color: C.mut }}>{label}</div>
                <div className="flex-1"><Bar v={c.s[k]} color={scoreColor(c.s[k])} h={5} /></div>
                <Mono size="text-xs" color={C.ink}>{c.s[k]}</Mono>
              </div>))}
            <div className="text-xs leading-relaxed mt-3 pt-3" style={{ color: C.mut, borderTop: `1px solid ${C.lineSoft}` }}>{c.sum.slice(0, 140)}…</div>
          </Card>))}
      </div>
      {chosen.length >= 2 && (
        <Card pad="p-5">
          <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>Comparison read</div>
          <p className="text-sm leading-relaxed" style={{ color: C.text }}>
            {chosen.map((c) => `${names(c)} — strongest on ${WEIGHT_META.reduce((best, [k, label]) => c.s[k] > c.s[best[0]] ? [k, label] : best, ["sk", "Mandatory skill match"])[1].toLowerCase()} (${Math.max(...WEIGHT_META.map(([k]) => c.s[k]))})`).join(". ")}.
            {" "}Where overall scores converge, the evidence maps and verification flags — not the single number — should drive the human decision.</p>
        </Card>)}
    </div>
  );
};

const AdjacencyView = () => (
  <div className="space-y-4">
    <Card pad="p-5"><p className="text-sm leading-relaxed" style={{ color: C.mut }}>
      The adjacency engine maps equivalent and transferable stacks so vocabulary differences don't read as capability gaps.
      These mappings power both semantic scoring and the Second-Look detector.</p></Card>
    <div className="grid grid-cols-2 gap-4">
      {ADJ.map(([from, to, note]) => (
        <Card key={from} pad="p-4" className="flex items-center gap-3">
          <div className="flex-1 text-sm font-medium text-right" style={{ color: C.text }}>{from}</div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.blueSoft }}><ArrowRight size={14} style={{ color: C.blue }} /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>{to}</div>
            <div className="text-xs mt-0.5" style={{ color: C.mut }}>{note}</div>
          </div>
        </Card>))}
    </div>
  </div>
);

/* --------------------------------- second look -------------------------------- */
const SecondLookSection = ({ tab, pool, overall, names, openDetail }) => {
  const hidden = pool.filter((c) => c.gt === "hidden");
  const N = 8;
  const kwTop = new Set([...pool].sort((a, b) => b.s.sk - a.s.sk).slice(0, N).map((c) => c.id));
  const missed = pool.filter((c) => ["strong", "hidden"].includes(c.gt) && !kwTop.has(c.id));
  if (tab === "Hidden-Fit Recovery") return (
    <div className="space-y-5">
      <div className="rounded-2xl p-8" style={{ background: `linear-gradient(120deg, ${C.navy} 0%, #2A2410 100%)`, boxShadow: SH2 }}>
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#E2C26B" }}>Signature capability</div>
        <h2 className="text-2xl font-semibold text-white mb-2">Hidden-Fit Recovery</h2>
        <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          Candidates a keyword ATS may miss, but Marevlo TalentOS recommends for human review. Each recovery shows the miss reason,
          the evidence that surfaced them, and the exact question a human should ask.</p>
      </div>
      {hidden.map((c) => (
        <Card key={c.id} pad="p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3">
              <Ring v={overall(c)} size={56} />
              <div>
                <div className="text-base font-semibold" style={{ color: C.ink }}>{names(c)}</div>
                <div className="text-xs" style={{ color: C.mut }}>{c.current} · {c.exp}y · {JDS[c.jd].reqId}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs mb-1" style={{ color: C.mut }}>recovery confidence</div>
              <Mono size="text-xl" color={C.gold}>{c.sl.conf}%</Mono>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-4" style={{ background: C.redSoft, border: `1px solid ${C.red}26` }}>
              <div className="flex items-center gap-1.5 mb-2"><XCircle size={13} style={{ color: C.red }} /><span className="text-xs font-semibold tracking-wider uppercase" style={{ color: C.red }}>Keyword ATS · Missed</span></div>
              <p className="text-sm leading-relaxed" style={{ color: C.text }}>{c.sl.before}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: C.greenSoft, border: `1px solid ${C.green}26` }}>
              <div className="flex items-center gap-1.5 mb-2"><CheckCircle2 size={13} style={{ color: C.green }} /><span className="text-xs font-semibold tracking-wider uppercase" style={{ color: C.green }}>Marevlo TalentOS · Recovered</span></div>
              <p className="text-sm leading-relaxed" style={{ color: C.text }}>{c.sl.after}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase mb-1.5" style={{ color: C.mut }}>Keyword vs semantic divergence</div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-16" style={{ color: C.red }}>keyword</span><div className="flex-1"><Bar v={c.s.sk} color={C.red} /></div><Mono size="text-xs" color={C.red}>{c.s.sk}</Mono>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs w-16" style={{ color: C.green }}>semantic</span><div className="flex-1"><Bar v={c.s.se} color={C.green} /></div><Mono size="text-xs" color={C.green}>{c.s.se}</Mono>
              </div>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: C.tealSoft }}>
              <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: C.teal }}>Human verification question</div>
              <p className="text-sm leading-relaxed" style={{ color: C.text }}>{c.sl.verify}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Pill color={C.gold} soft={C.goldSoft}><Eye size={11} />Second-look recommended — never auto-shortlisted, never auto-rejected</Pill>
            <button onClick={() => openDetail(c.id)} className="text-xs font-medium flex items-center gap-1" style={{ color: C.blue }}>Open evidence view <ChevronRight size={12} /></button>
          </div>
        </Card>))}
    </div>);
  if (tab === "ATS Missed") return (
    <div className="space-y-4">
      <Card pad="p-5"><p className="text-sm leading-relaxed" style={{ color: C.mut }}>
        Holding everything else equal, a top-{N} keyword shortlist on this batch silently drops the candidates below. Each is a false negative the organisation would never know about.</p></Card>
      {missed.map((c) => (
        <Card key={c.id} pad="p-4" onClick={() => openDetail(c.id)} className="flex items-center gap-4">
          <EyeOff size={16} style={{ color: C.red }} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>{names(c)}</div>
            <div className="text-xs truncate" style={{ color: C.mut }}>{c.current}</div>
          </div>
          <Pill color={GT_META[c.gt].c} soft={GT_META[c.gt].s}>{GT_META[c.gt].label}</Pill>
          <div className="text-xs font-mono whitespace-nowrap" style={{ color: C.mut }}>kw <span style={{ color: C.red }}>{c.s.sk}</span> · sem <span style={{ color: C.green }}>{c.s.se}</span></div>
          <Score v={overall(c)} />
        </Card>))}
    </div>);
  return (
    <div className="space-y-4">
      <Card pad="p-6">
        <div className="text-sm font-semibold mb-3" style={{ color: C.ink }}>How recovery works</div>
        {[["1 · Divergence detection", "The keyword and semantic channels score independently. A gap above ~25 points is the recall-risk signal — strong meaning, weak vocabulary."],
          ["2 · Adjacency mapping", "Transferable-stack evidence (Flask→FastAPI, Nomad→K8s, TensorRT→model serving) upgrades 'missing keyword' to 'equivalent capability, different label'."],
          ["3 · Mandatory human routing", "Recovered candidates are flagged to the Second-Look lane for human review. The system never converts a recovery into an automatic shortlist — and never converts a low keyword score into a rejection."]].map(([t, d]) => (
          <div key={t} className="mb-4">
            <div className="text-sm font-semibold mb-1" style={{ color: C.blue }}>{t}</div>
            <p className="text-sm leading-relaxed" style={{ color: C.mut }}>{d}</p>
          </div>))}
      </Card>
    </div>);
};

/* -------------------------------- evaluation lab ------------------------------- */
const BenchBanner = () => (
  <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-2.5" style={{ background: C.violetSoft, border: `1px solid ${C.violet}33` }}>
    <FlaskConical size={14} style={{ color: C.violet }} />
    <span className="text-xs font-medium" style={{ color: C.ink }}>Benchmark mode using labelled demo data — these are evaluation-harness numbers, not production performance claims.</span>
  </div>
);

const EvalLab = ({ tab, pool, overall, names, openDetail, weights, jd }) => {
  const ranked = [...pool].sort((a, b) => overall(b) - overall(a));
  const goodSet = new Set(["strong", "hidden"]);
  if (tab === "Performance Testing") {
    const pAt = (n) => Math.round((ranked.slice(0, n).filter((c) => goodSet.has(c.gt)).length / Math.min(n, ranked.length)) * 100);
    const strongAll = pool.filter((c) => c.gt === "strong");
    const recall = Math.round((ranked.slice(0, 10).filter((c) => c.gt === "strong").length / Math.max(1, strongAll.length)) * 100);
    const hiddenAll = pool.filter((c) => c.gt === "hidden");
    const hidRec = hiddenAll.length ? Math.round(hiddenAll.filter((c) => c.fn === "second").length / hiddenAll.length * 100) : 100;
    const verAll = pool.filter((c) => c.gt === "verify");
    const verDet = verAll.length ? Math.round(verAll.filter((c) => c.vRisk >= 60).length / verAll.length * 100) : 100;
    const evCov = Math.round(pool.reduce((a, c) => a + c.s.ev, 0) / pool.length);
    const parseOk = Math.round((pool.filter((c) => c.parse >= 70).length / pool.length) * 100);
    const manual = Math.round((pool.filter((c) => ["manual", "incomplete"].includes(c.fn) || c.parse < 70).length / pool.length) * 100);
    const gtRows = ["strong", "medium", "hidden", "low", "mismatch", "verify"];
    const expected = { strong: "High", hidden: "Medium", medium: "Medium", low: "Low", mismatch: "Low", verify: "Medium" };
    return (
      <div>
        <BenchBanner />
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[["Precision@5", `${pAt(5)}%`, C.green], ["Precision@10", `${pAt(10)}%`, C.green], ["Strong-fit recall@10", `${recall}%`, C.green], ["Hidden-fit recovery", `${hidRec}%`, C.gold],
            ["Verification detection", `${verDet}%`, C.violet], ["Evidence coverage", `${evCov}%`, C.blue], ["Parse success", `${parseOk}%`, C.teal], ["Manual review rate", `${manual}%`, C.mut]].map(([k, v, col]) => (
            <Card key={k} pad="p-4"><Mono size="text-2xl" color={col}>{v}</Mono><div className="text-xs mt-1" style={{ color: C.mut }}>{k}</div></Card>))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Card pad="p-5">
            <div className="text-sm font-semibold mb-4" style={{ color: C.ink }}>Confusion matrix — ground truth vs predicted band</div>
            <table className="w-full text-sm">
              <thead><tr>{["Ground truth ↓ / Predicted →", "High", "Medium", "Low"].map((h) => <th key={h} className="text-left px-2 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.faint }}>{h}</th>)}</tr></thead>
              <tbody>{gtRows.map((g) => {
                const subset = pool.filter((c) => c.gt === g);
                if (!subset.length) return null;
                return (
                  <tr key={g} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    <td className="px-2 py-2.5"><Pill color={GT_META[g].c} soft={GT_META[g].s}>{GT_META[g].label}</Pill></td>
                    {["High", "Medium", "Low"].map((b) => {
                      const v = subset.filter((c) => predBucket(overall(c)) === b).length;
                      const isExp = expected[g] === b;
                      return <td key={b} className="px-2 py-2.5"><span className="font-mono text-sm px-2.5 py-1 rounded-lg inline-block min-w-9 text-center"
                        style={{ background: v === 0 ? "transparent" : isExp ? C.greenSoft : C.amberSoft, color: v === 0 ? C.faint : isExp ? C.green : C.amber }}>{v}</span></td>;
                    })}
                  </tr>);
              })}</tbody>
            </table>
            <div className="text-xs mt-3 leading-relaxed" style={{ color: C.faint }}>Green = expected band. Amber deviations each appear in Error Analysis with a cause. Hidden fits sit mid-band by design — recovery happens via the flag, not the raw rank.</div>
          </Card>
          <Card pad="p-5">
            <div className="text-sm font-semibold mb-4" style={{ color: C.ink }}>Ranking position by ground-truth category</div>
            {gtRows.map((g) => {
              const subset = ranked.map((c, i) => ({ c, r: i + 1 })).filter(({ c }) => c.gt === g);
              if (!subset.length) return null;
              return (
                <div key={g} className="flex items-center gap-3 mb-3">
                  <div className="w-36 shrink-0"><Pill color={GT_META[g].c} soft={GT_META[g].s}>{GT_META[g].label}</Pill></div>
                  <div className="flex-1 flex gap-1 flex-wrap">{subset.map(({ c, r }) => (
                    <button key={c.id} onClick={() => openDetail(c.id)} title={names(c)} className="font-mono text-xs px-1.5 py-0.5 rounded-md transition-shadow hover:shadow-sm"
                      style={{ background: GT_META[g].s, color: GT_META[g].c }}>#{r}</button>))}</div>
                </div>);
            })}
            <div className="text-xs mt-2" style={{ color: C.faint }}>Live-computed from current weights. Change weights in Governance → Settings and watch positions move.</div>
          </Card>
        </div>
      </div>);
  }
  if (tab === "ATS Baseline") {
    const N = 8;
    const kwTop = [...pool].sort((a, b) => b.s.sk - a.s.sk).slice(0, N);
    const hyTop = ranked.slice(0, N);
    const kwIds = new Set(kwTop.map((c) => c.id));
    const missed = pool.filter((c) => goodSet.has(c.gt) && !kwIds.has(c.id));
    const recovered = pool.filter((c) => c.gt === "hidden" && c.fn === "second");
    const verSent = pool.filter((c) => c.gt === "verify" && c.vRisk >= 60);
    return (
      <div>
        <BenchBanner />
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[[`${missed.length}`, "candidates missed by keyword ATS", C.red, C.redSoft], [`${recovered.length}`, "recovered by Marevlo TalentOS", C.gold, C.goldSoft], [`${verSent.length}`, "sent to human verification", C.violet, C.violetSoft]].map(([v, k, col, s]) => (
            <Card key={k} pad="p-5"><Mono size="text-3xl" color={col}>{v}</Mono><div className="text-sm mt-1.5" style={{ color: C.mut }}>{k}</div></Card>))}
        </div>
        <div className="grid grid-cols-2 gap-5 mb-5">
          <Card pad="p-5">
            <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Traditional keyword ATS</div>
            <ul className="text-xs space-y-1.5 mb-4 mt-2" style={{ color: C.mut }}>
              {["Exact keyword matching", "Misses adjacent skills", "Over-ranks keyword stuffing", "No project-depth analysis", "Weak explainability"].map((x) => <li key={x} className="flex gap-2"><XCircle size={12} style={{ color: C.red }} className="mt-0.5 shrink-0" />{x}</li>)}
            </ul>
            {kwTop.map((c, i) => (
              <button key={c.id} onClick={() => openDetail(c.id)} className="w-full flex items-center gap-2.5 py-2 text-left" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <Mono size="text-xs" color={C.faint}>{i + 1}</Mono>
                <span className="text-sm flex-1 truncate" style={{ color: C.ink }}>{names(c)}</span>
                <Pill color={GT_META[c.gt].c} soft={GT_META[c.gt].s}>{GT_META[c.gt].label}</Pill>
                <Mono size="text-xs" color={C.mut}>{c.s.sk}</Mono>
              </button>))}
          </Card>
          <Card pad="p-5" style={{ border: `1px solid ${C.blue}44` }}>
            <div className="text-sm font-semibold mb-1" style={{ color: C.blue }}>Marevlo TalentOS hybrid</div>
            <ul className="text-xs space-y-1.5 mb-4 mt-2" style={{ color: C.mut }}>
              {["Hybrid semantic + keyword ranking", "Recovers hidden-fit candidates", "Penalizes weak evidence", "Evaluates project maturity", "Evidence-linked explanations", "Human-in-the-loop decisions"].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 size={12} style={{ color: C.green }} className="mt-0.5 shrink-0" />{x}</li>)}
            </ul>
            {hyTop.map((c, i) => (
              <button key={c.id} onClick={() => openDetail(c.id)} className="w-full flex items-center gap-2.5 py-2 text-left" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <Mono size="text-xs" color={C.faint}>{i + 1}</Mono>
                <span className="text-sm flex-1 truncate" style={{ color: C.ink }}>{names(c)}</span>
                <Pill color={GT_META[c.gt].c} soft={GT_META[c.gt].s}>{GT_META[c.gt].label}</Pill>
                <Mono size="text-xs" color={C.mut}>{overall(c)}</Mono>
              </button>))}
          </Card>
        </div>
        <Card pad="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: C.ink }}>What the keyword gate silently drops</div>
          <div className="flex gap-2 flex-wrap">
            {missed.map((c) => (
              <button key={c.id} onClick={() => openDetail(c.id)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-shadow hover:shadow-sm"
                style={{ background: GT_META[c.gt].s, color: GT_META[c.gt].c, border: `1px solid ${GT_META[c.gt].c}33` }}>
                <EyeOff size={12} />{names(c)} · kw {c.s.sk} / sem {c.s.se}</button>))}
          </div>
        </Card>
      </div>);
  }
  if (tab === "Model Ablation") {
    const MODES = [
      { n: "Keyword-only", d: "BM25 mandatory-skill overlap", f: (c) => c.s.sk },
      { n: "Embedding-only", d: "Dense semantic similarity", f: (c) => c.s.se },
      { n: "Hybrid (dense+BM25+RRF)", d: "Fused retrieval, equal channels", f: (c) => Math.round(0.5 * c.s.sk + 0.5 * c.s.se) },
      { n: "Hybrid + reranker", d: "Cross-encoder adds evidence weighting", f: (c) => Math.round(0.35 * c.s.sk + 0.35 * c.s.se + 0.3 * c.s.ev) },
      { n: "+ Project Intelligence", d: "Depth & production maturity join", f: (c) => Math.round(0.25 * c.s.sk + 0.25 * c.s.se + 0.2 * c.s.ev + 0.15 * c.s.dp + 0.15 * c.s.pr) },
      { n: "+ Second-Look recovery", d: "Full pipeline; hidden fits flagged", f: (c) => overallOf(c, weights), full: true },
    ];
    return (
      <div>
        <BenchBanner />
        <div className="grid grid-cols-3 gap-4">
          {MODES.map((m) => {
            const top = [...pool].sort((a, b) => m.f(b) - m.f(a)).slice(0, 10);
            const topIds = new Set(top.map((c) => c.id));
            const fn = pool.filter((c) => goodSet.has(c.gt) && !topIds.has(c.id) && !(m.full && c.fn === "second")).length;
            const verifyIn = top.filter((c) => c.gt === "verify").length;
            return (
              <Card key={m.n} pad="p-5" style={m.full ? { border: `1.5px solid ${C.blue}` } : {}}>
                <div className="text-sm font-semibold" style={{ color: m.full ? C.blue : C.ink }}>{m.n}</div>
                <div className="text-xs mb-3" style={{ color: C.faint }}>{m.d}</div>
                <div className="flex gap-4 mb-3">
                  {[["false negatives", fn, fn === 0 ? C.green : C.red], ["verify-risk in top 10", verifyIn, verifyIn === 0 ? C.green : C.violet]].map(([k, v, col]) => (
                    <div key={k}><Mono size="text-xl" color={col}>{v}</Mono><div className="text-xs" style={{ color: C.faint }}>{k}</div></div>))}
                </div>
                <div className="space-y-1">
                  {top.slice(0, 6).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Mono size="text-xs" color={C.faint}>{i + 1}</Mono>
                      <span className="text-xs flex-1 truncate" style={{ color: C.text }}>{names(c)}</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: GT_META[c.gt].c }} />
                    </div>))}
                </div>
              </Card>);
          })}
        </div>
        <div className="text-xs flex items-center gap-4 flex-wrap mt-4" style={{ color: C.faint }}>
          {Object.entries(GT_META).map(([k, m]) => <span key={k} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: m.c }} />{m.label}</span>)}
        </div>
      </div>);
  }
  /* Error Analysis */
  const ERRORS = {
    be: [
      ["Under-ranked principal engineer", "b10", "A 10-year principal-level backend engineer ranks mid-table.", "Zero Python-framework tokens; keyword channel scores 48.", "Medium", "Second-look lane carries him to review — verify language-transition appetite.", "Working as designed; consider language-family adjacency weighting."],
      ["Parse failure absorbed safely", "b12", "A no-name, no-dates resume parsed at 54% confidence.", "Two-column layout broke the extractor's section model.", "Low", "Obtain a complete document before competitive scoring.", "Parser improvement queued; policy held: low parse ≠ rejection."],
      ["Duplicate submission detected", "b13", "Near-identical resume under a second name.", "97% shingled-text overlap with BE-09.", "High", "Human confirms which identity is genuine before either advances.", "None — control worked."],
    ],
    ds: [
      ["High-keyword profile correctly gated", "d15", "A ~60-technology skill list scores keyword 85 but lands outside the top 5.", "Evidence confidence 40 pulls the weighted score down — the system resisting keyword stuffing.", "Medium", "Ask for owned work in any three listed technologies.", "Working as designed (test case: high keyword, weak evidence, not over-ranked)."],
      ["Timeline inconsistency flagged", "d14", "“3+ years' experience” claimed; degree completes this year.", "Stated-experience and dated-history extractors disagree by >2 years.", "High", "Walk the dated timeline; the published paper is verifiable — capability may be genuine.", "None — advisory flag is correct behavior."],
      ["Strong candidate with degraded parse", "d03", "A genuinely strong forecasting profile parsed at 78% with mangled spacing.", "PDF encoding collapsed whitespace; taxonomy matching recovered skills.", "Medium", "Confirm recovered skills against the original document.", "OCR fallback queued; score held competitive — robustness goal met."],
      ["Research vocabulary nearly missed", "d17", "MLOps-grade serving work described as “training infrastructure”.", "No synonym path from research phrasing to JD tokens in the keyword channel.", "Medium", "Panel scopes the vision→tabular pivot.", "Synonym expansion added to taxonomy backlog."],
    ],
    de: [
      ["Serving specialist vs bundled JD", "e06", "Deep model-serving engineer flagged hidden-fit despite missing the data-pipeline half.", "The JD bundles two roles; his evidence covers one at depth.", "Medium", "Hiring manager decides if the serving-specialist shape fits the team.", "Recommend splitting the JD; the system can only reveal the tension."],
      ["Equivalent-stack blindspot avoided", "e07", "Nomad/NATS operations profile would score 50 on keywords.", "Non-K8s/Kafka vocabulary for equivalent concepts.", "Low", "Confirm appetite for K8s/Kafka conventions.", "Working as designed via the adjacency map."],
    ],
  };
  const rankOf = (id) => ranked.findIndex((c) => c.id === id) + 1;
  return (
    <div>
      <BenchBanner />
      <div className="space-y-4">
        {(ERRORS[jd] || []).map(([t, id, what, why, risk, check, fix]) => {
          const c = pool.find((x) => x.id === id);
          if (!c) return null;
          const riskCol = risk === "High" ? C.red : risk === "Medium" ? C.amber : C.green;
          return (
            <Card key={t} pad="p-5">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.amberSoft }}><Bug size={14} style={{ color: C.amber }} /></div>
                  <span className="text-base font-semibold" style={{ color: C.ink }}>{t}</span>
                  <Pill color={riskCol} soft={`${riskCol}14`}>{risk} risk</Pill>
                </div>
                <button onClick={() => openDetail(c.id)} className="text-xs font-medium flex items-center gap-1" style={{ color: C.blue }}>{names(c)} · rank #{rankOf(c.id)} <ChevronRight size={12} /></button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[["What happened", what], ["Why it happened", why], ["Human action needed", check], ["Model / rubric improvement", fix]].map(([k, v]) => (
                  <div key={k} className="rounded-lg p-3" style={{ background: C.soft }}>
                    <div className="text-xs font-semibold tracking-wider uppercase mb-1.5" style={{ color: C.mut }}>{k}</div>
                    <p className="text-xs leading-relaxed" style={{ color: C.text }}>{v}</p></div>))}
              </div>
            </Card>);
        })}
      </div>
    </div>);
};

/* ---------------------------------- workflow ---------------------------------- */
const FlowSection = ({ tab, pool, overall, names, openDetail, log }) => {
  if (tab === "Kanban Board") return (
    <div className="space-y-5">
      <div className="flex gap-3 overflow-x-auto pb-3">
        {STAGES.map((s) => {
          const col = pool.filter((c) => c.status === s);
          return (
            <div key={s} className="w-52 shrink-0 rounded-xl" style={{ background: C.tint }}>
              <div className="px-3.5 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: STATUS_COLORS[s] }}>{s}</span>
                <span className="font-mono text-xs px-1.5 rounded-md" style={{ background: C.surf, color: C.mut }}>{col.length}</span>
              </div>
              <div className="px-2 pb-2 space-y-2 min-h-12">
                {col.map((c) => (
                  <Card key={c.id} pad="p-3" onClick={() => openDetail(c.id)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold truncate pr-1" style={{ color: C.ink }}>{names(c)}</span>
                      <Score v={overall(c)} />
                    </div>
                    <div className="text-xs truncate mb-1.5" style={{ color: C.faint }}>{c.current}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono" style={{ color: C.faint }}>ev {c.s.ev}</span>
                      {c.fn !== "none" && <span className="w-2 h-2 rounded-full" title={FN_LABELS[c.fn].t} style={{ background: FN_LABELS[c.fn].c }} />}
                    </div>
                  </Card>))}
              </div>
            </div>);
        })}
      </div>
      <div className="text-xs" style={{ color: C.faint }}>Cards move only on logged human action. "Rejected by Human" is the only rejection state in the system — there is no machine equivalent.</div>
    </div>);
  if (tab === "Human Decisions") return (
    <div className="space-y-3">
      {[...log].reverse().map((e) => (
        <Card key={e.id} pad="p-4" className="flex items-center gap-4 flex-wrap">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: e.override ? C.goldSoft : C.greenSoft }}>
            {e.override ? <RotateCcw size={14} style={{ color: C.gold }} /> : <CheckCircle2 size={14} style={{ color: C.green }} />}
          </div>
          <div className="flex-1 min-w-48">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>{e.cand} — {e.human}</div>
            <div className="text-xs" style={{ color: C.mut }}>AI at decision time: {e.ai}</div>
          </div>
          {e.override && <Pill color={C.gold} soft={C.goldSoft}>Override</Pill>}
          <div className="text-xs text-right" style={{ color: C.faint }}>
            <div>{e.reviewer}</div><div className="font-mono">{e.ts}</div>
          </div>
        </Card>))}
    </div>);
  /* Review Queue */
  const queues = [
    ["Pending recruiter review", pool.filter((c) => c.status === "Recruiter Review"), C.amber, C.amberSoft],
    ["Pending technical panel", pool.filter((c) => c.status === "Technical Panel"), C.teal, C.tealSoft],
    ["Manual parse review", pool.filter((c) => c.status === "Needs Manual Parse Review"), C.amber, C.amberSoft],
    ["Second-look review", pool.filter((c) => c.status === "Second-Look Review"), C.gold, C.goldSoft],
    ["Verification needed", pool.filter((c) => c.vRisk >= 60), C.violet, C.violetSoft],
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {queues.map(([t, list, col, soft]) => (
        <Card key={t} pad="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: C.ink }}>{t}</span>
            <Mono size="text-lg" color={col}>{list.length}</Mono>
          </div>
          {list.length === 0 ? <div className="text-xs py-3 text-center rounded-lg" style={{ color: C.faint, background: C.soft }}>Queue clear</div> :
            list.map((c) => (
              <button key={c.id} onClick={() => openDetail(c.id)} className="w-full flex items-center gap-2.5 py-2 text-left" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col }} />
                <span className="text-sm flex-1 truncate" style={{ color: C.text }}>{names(c)}</span>
                <Score v={overall(c)} />
              </button>))}
        </Card>))}
    </div>);
};

/* --------------------------------- governance ---------------------------------- */
const PIPE2 = ["JD + Resume Upload", "Local Parser", "Skill Extractor", "Project Intelligence Engine", "Dense Retrieval", "BM25 Retrieval", "Hybrid Rank Fusion", "Local Reranker", "Evidence Mapper", "Second-Look Detector", "Human Workflow", "Audit Store", "Reports"];
const GovSection = ({ tab, log, weights, setWeights, pool, names }) => {
  const baseRank = useMemo(() => [...pool].sort((a, b) => overallOf(b, DEFAULT_WEIGHTS) - overallOf(a, DEFAULT_WEIGHTS)).map((c) => c.id), [pool]);
  const curRank = [...pool].sort((a, b) => overallOf(b, weights) - overallOf(a, weights)).map((c) => c.id);
  const moved = curRank.reduce((acc, id, i) => {
    const prev = baseRank.indexOf(id);
    if (i < prev) acc.up += 1; else if (i > prev) acc.down += 1;
    return acc;
  }, { up: 0, down: 0 });
  const changed = JSON.stringify(weights) !== JSON.stringify(DEFAULT_WEIGHTS);

  if (tab === "Audit Trail") return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[["Entries", log.length, C.ink], ["Overrides", log.filter((e) => e.override).length, C.gold], ["Auto-rejections", 0, C.green], ["Export status", "Ready", C.blue]].map(([k, v, col]) => (
          <Card key={k} pad="p-4"><Mono size="text-xl" color={col}>{v}</Mono><div className="text-xs mt-1" style={{ color: C.mut }}>{k}</div></Card>))}
      </div>
      <Card pad="p-0" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.soft }}>
            {["Candidate", "AI recommendation at decision", "Human decision", "Override", "Reviewer", "Reason", "Snapshot", "Timestamp"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: C.faint }}>{h}</th>))}
          </tr></thead>
          <tbody>
            {[...log].reverse().map((e) => (
              <tr key={e.id} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: C.ink }}>{e.cand}</td>
                <td className="px-4 py-3 text-xs" style={{ color: C.mut }}>{e.ai}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap font-medium" style={{ color: C.ink }}>{e.human}</td>
                <td className="px-4 py-3">{e.override ? <Pill color={C.gold} soft={C.goldSoft}>Override</Pill> : <Pill color={C.mut}>Concur</Pill>}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.mut }}>{e.reviewer}</td>
                <td className="px-4 py-3 text-xs" style={{ color: C.mut }}>{e.reason}{e.notes ? ` — ${e.notes}` : ""}</td>
                <td className="px-4 py-3"><Mono size="text-xs" color={C.faint}>{e.snap}</Mono></td>
                <td className="px-4 py-3"><Mono size="text-xs" color={C.faint}>{e.ts}</Mono></td>
              </tr>))}
          </tbody>
        </table>
      </Card>
      <div className="text-xs" style={{ color: C.faint }}>Every entry freezes the AI recommendation, model version, weight version, and evidence snapshot at decision time — defensible in procurement and review-board contexts.</div>
    </div>);

  if (tab === "Bias-Aware Controls") return (
    <div className="grid grid-cols-2 gap-4">
      <Card pad="p-6">
        <div className="flex items-center gap-2 mb-4"><Scale size={16} style={{ color: C.green }} /><span className="text-sm font-semibold" style={{ color: C.ink }}>Bias-aware controls</span></div>
        {["Protected attribute exclusion at parse time", "Gender, age, religion, caste — not extracted", "Photographs ignored by the parser", "Address ignored unless role-mandated", "Job-relevant evidence only reaches scoring", "Name randomization test available (live delta: 0)"].map((g) => (
          <div key={g} className="flex items-center gap-2.5 mb-2.5"><CheckCircle2 size={14} style={{ color: C.green }} className="shrink-0" /><span className="text-sm" style={{ color: C.text }}>{g}</span></div>))}
        <div className="text-xs mt-4 pt-3 leading-relaxed" style={{ color: C.faint, borderTop: `1px solid ${C.lineSoft}` }}>
          These are controls, not guarantees. They reduce exposure to identity signals; human oversight remains the final safeguard, and every decision stays reviewable in the audit trail.</div>
      </Card>
      <Card pad="p-6">
        <div className="flex items-center gap-2 mb-4"><Shield size={16} style={{ color: C.blue }} /><span className="text-sm font-semibold" style={{ color: C.ink }}>Oversight posture</span></div>
        {[["Auto-rejection", "No such state exists in the workflow"], ["Human final decision", "Enforced on every candidate"], ["Override logging", "Mandatory, with reason"], ["AI recommendation", "Frozen at decision time"], ["Evidence snapshot", "Stored with every decision"], ["Audit trail", "Enabled, append-only"]].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between mb-3 gap-2"><span className="text-sm" style={{ color: C.mut }}>{k}</span><Pill color={C.green} soft={C.greenSoft}>{v}</Pill></div>))}
      </Card>
    </div>);

  if (tab === "Model Versioning") return (
    <div className="grid grid-cols-2 gap-4">
      <Card pad="p-6">
        <div className="text-sm font-semibold mb-4" style={{ color: C.ink }}>Active versions</div>
        {[["Embedding model", "local-embed v1.5 (BGE/E5/GTE class)"], ["Sparse retrieval", "BM25"], ["Fusion", "Reciprocal rank fusion"], ["Reranker", "local cross-encoder v2"], ["Digest model", "local 7B-class summarizer"], ["Scoring weights", changed ? "v1.0-modified (unsaved)" : "v1.0"], ["Vector store", "Qdrant / FAISS · on-prem"], ["Audit store", "PostgreSQL · append-only"]].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <span className="text-sm" style={{ color: C.mut }}>{k}</span><Mono size="text-xs" color={C.ink}>{v}</Mono></div>))}
      </Card>
      <Card pad="p-6">
        <div className="text-sm font-semibold mb-4" style={{ color: C.ink }}>Version discipline</div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: C.mut }}>Every audit entry pins the model and weight versions active at decision time. Re-running a batch under new versions creates new entries — historical decisions remain reproducible against the versions that produced them.</p>
        <p className="text-sm leading-relaxed" style={{ color: C.mut }}>All components are swappable per deployment; no proprietary external API exists anywhere in the path.</p>
      </Card>
    </div>);

  /* Settings & Architecture */
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Card pad="p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold" style={{ color: C.ink }}>Scoring weights</div>
            <button onClick={() => setWeights({ ...DEFAULT_WEIGHTS })} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: C.tint, color: C.mut }}>Reset to v1.0</button>
          </div>
          <div className="text-xs mb-5" style={{ color: C.faint }}>Every score in the product recomputes live from this weighted sum.</div>
          {WEIGHT_META.map(([k, label, desc]) => (
            <div key={k} className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div><span className="text-sm" style={{ color: C.ink }}>{label}</span><div className="text-xs" style={{ color: C.faint }}>{desc}</div></div>
                <Mono color={C.blue}>{weights[k]}%</Mono>
              </div>
              <input type="range" min="0" max="50" value={weights[k]} className="w-full accent-green-700"
                onChange={(e) => setWeights({ ...weights, [k]: +e.target.value })} />
            </div>))}
          <div className="rounded-lg px-3.5 py-2.5 flex items-center gap-2" style={{ background: changed ? C.blueSoft : C.soft }}>
            {changed ? <>
              <ArrowUp size={13} style={{ color: C.green }} /><span className="text-xs font-medium" style={{ color: C.ink }}>{moved.up} moved up</span>
              <ArrowDown size={13} style={{ color: C.red }} /><span className="text-xs font-medium" style={{ color: C.ink }}>{moved.down} moved down</span>
              <span className="text-xs" style={{ color: C.mut }}>vs weights v1.0 — inspect in Ranking</span>
            </> : <span className="text-xs" style={{ color: C.mut }}>Weight change preview appears here — move a slider.</span>}
          </div>
        </Card>
        <div className="space-y-5">
          <Card pad="p-6">
            <div className="text-sm font-semibold mb-4" style={{ color: C.ink }}>Deployment trust</div>
            <div className="grid grid-cols-2 gap-3">
              {[[Server, "On-prem ready"], [Lock, "Air-gapped capable"], [XCircle, "No external AI APIs"], [Cpu, "Local model support"], [Database, "Audit database"], [Users, "Role-based access"]].map(([Icon, t]) => (
                <div key={t} className="flex items-center gap-2.5 rounded-lg p-3" style={{ background: C.soft }}>
                  <Icon size={15} style={{ color: C.green }} /><span className="text-sm font-medium" style={{ color: C.ink }}>{t}</span>
                </div>))}
            </div>
          </Card>
          <Card pad="p-6">
            <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Processing architecture</div>
            <div className="text-xs mb-4" style={{ color: C.faint }}>Every stage runs inside the customer network boundary — nothing crosses it.</div>
            <div className="rounded-xl p-4" style={{ border: `1.5px dashed ${C.green}77`, background: C.greenSoft }}>
              <div className="flex items-center gap-2 mb-3"><Lock size={12} style={{ color: C.green }} /><span className="font-mono text-xs font-semibold" style={{ color: C.green }}>CUSTOMER NETWORK BOUNDARY</span></div>
              <div className="flex flex-wrap items-center gap-y-2">
                {PIPE2.map((p, i) => (
                  <React.Fragment key={p}>
                    <span className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium" style={{ background: C.surf, color: i === 9 ? C.gold : C.ink, border: `1px solid ${i === 9 ? C.gold + "66" : C.line}`, boxShadow: SH }}>{p}</span>
                    {i < PIPE2.length - 1 && <ChevronRight size={12} style={{ color: C.faint }} className="mx-0.5 shrink-0" />}
                  </React.Fragment>))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};

/* ----------------------------------- reports ------------------------------------ */
const ReportsSection = ({ pool, overall, names, log, jd, toastMsg }) => {
  const ts = new Date().toISOString().slice(0, 10);
  const ranked = [...pool].sort((a, b) => overall(b) - overall(a));
  const hidden = pool.filter((c) => c.gt === "hidden");
  const verify = pool.filter((c) => c.vRisk >= 60);
  const pending = pool.filter((c) => ["AI Ranked", "Recruiter Review", "Second-Look Review", "Needs Manual Parse Review"].includes(c.status));
  const doCsv = (name, rows) => { download(name, csv(rows)); toastMsg("Export ready — file downloaded"); };
  const exports = [
    [FileText, "Executive summary", "Role, batch, top candidates, recovery, risks, next actions — board-ready narrative.", () => toastMsg("Executive summary rendered in deployed instances — preview shown on the right")],
    [Users, "Candidate ranking CSV", "Full ranked table with sub-scores, flags, and benchmark labels.", () => doCsv(`marevlo_ranking_${jd}_${ts}.csv`, [["ID", "Candidate", "Exp", "Overall", "Skill", "Semantic", "Depth", "Production", "Evidence", "Flag", "Verify risk", "Benchmark label", "Status"], ...ranked.map((c) => [c.id.toUpperCase(), names(c), c.exp, overall(c), c.s.sk, c.s.se, c.s.dp, c.s.pr, c.s.ev, FN_LABELS[c.fn].t, c.vRisk, GT_META[c.gt].label, c.status])])],
    [CheckCircle2, "Shortlist report", "Candidates in Shortlisted / Technical Panel / Final Selected with evidence summaries.", () => doCsv(`marevlo_shortlist_${jd}_${ts}.csv`, [["Candidate", "Stage", "Overall", "Summary"], ...pool.filter((c) => ["Shortlisted", "Technical Panel", "Final Selected"].includes(c.status)).map((c) => [names(c), c.status, overall(c), c.sum])])],
    [Eye, "Second-look recovery report", "Every hidden-fit recovery with miss reason, surface reason, and verification guidance.", () => doCsv(`marevlo_secondlook_${jd}_${ts}.csv`, [["Candidate", "Overall", "Keyword", "Semantic", "Missed because", "Surfaced because", "Verify"], ...pool.filter((c) => c.sl).map((c) => [names(c), overall(c), c.s.sk, c.s.se, c.sl.missed, c.sl.surfaced, c.sl.verify])])],
    [ScrollText, "Audit log CSV", "AI recommendations, human decisions, overrides, snapshots — procurement-grade.", () => doCsv(`marevlo_audit_${ts}.csv`, [["Candidate", "AI recommendation", "Human decision", "Override", "Reviewer", "Reason", "Snapshot", "Timestamp"], ...log.map((e) => [e.cand, e.ai, e.human, e.override ? "YES" : "no", e.reviewer, e.reason, e.snap, e.ts])])],
    [Bug, "Error analysis report", "Known deviations with causes and rubric actions — the honesty artifact.", () => toastMsg("Error analysis report bundled with the executive summary in deployed instances")],
  ];
  return (
    <div className="grid grid-cols-5 gap-5">
      <div className="col-span-3 grid grid-cols-2 gap-4 content-start">
        {exports.map(([Icon, t, d, fn]) => (
          <Card key={t} pad="p-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: C.blueSoft }}><Icon size={15} style={{ color: C.blue }} /></div>
            <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>{t}</div>
            <div className="text-xs leading-relaxed mb-3.5" style={{ color: C.mut }}>{d}</div>
            <button onClick={fn} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-white" style={{ background: C.blue }}>
              <Download size={12} />Export</button>
          </Card>))}
      </div>
      <div className="col-span-2">
        <Card pad="p-6" className="sticky top-4">
          <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: C.blue }}>Executive summary preview</div>
          <div className="text-base font-semibold mb-4" style={{ color: C.ink }}>{JDS[jd].title}</div>
          {[["Role evaluated", `${JDS[jd].reqId} · ${JDS[jd].title}`],
            ["Resume batch", `${pool.length} candidates (benchmark batch)`],
            ["Top candidates", ranked.slice(0, 3).map((c) => names(c)).join(", ")],
            ["Hidden-fit recovered", `${hidden.length} — all routed to human review`],
            ["Verification flags", `${verify.length} advisory flags with probing questions`],
            ["Human decisions pending", `${pending.length}`]].map(([k, v]) => (
            <div key={k} className="py-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <div className="text-xs mb-0.5" style={{ color: C.faint }}>{k}</div>
              <div className="text-sm font-medium leading-relaxed" style={{ color: C.ink }}>{v}</div>
            </div>))}
          <div className="mt-4">
            <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: C.mut }}>Recommended next actions</div>
            <ul className="space-y-1.5">
              {["Panel the top 3 ranked candidates", `Run second-look interviews for ${hidden.length} recovered candidates`, "Resolve verification flags before offers", "Export audit trail for the procurement file"].map((x) => (
                <li key={x} className="text-sm flex gap-2 leading-relaxed" style={{ color: C.text }}><ChevronRight size={13} style={{ color: C.blue }} className="mt-0.5 shrink-0" />{x}</li>))}
            </ul>
          </div>
          <div className="text-xs mt-4 pt-3" style={{ color: C.faint, borderTop: `1px solid ${C.lineSoft}` }}>Preview reflects live session state — weights, decisions, and name mode included.</div>
        </Card>
      </div>
    </div>);
};

/* ------------------------------------- app -------------------------------------- */
export default function MarevloTalentOS() {
  const [section, setSection] = useState("command");
  const [tabs, setTabs] = useState(Object.fromEntries(SECTIONS.map((s) => [s.id, s.tabs[0]])));
  const [jd, setJd] = useState("be");
  const [selected, setSelected] = useState(null);
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [nameMode, setNameMode] = useState("anon");
  const [seed, setSeed] = useState(0);
  const [statuses, setStatuses] = useState(Object.fromEntries(CANDS.map((c) => [c.id, c.status])));
  const [log, setLog] = useState(SEED_AUDIT);
  const [showGT, setShowGT] = useState(false);
  const [demoOn, setDemoOn] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [toast, setToast] = useState(null);

  const toastMsg = (m) => { setToast(m); setTimeout(() => setToast(null), 3200); };
  const overall = useMemo(() => (c) => overallOf(c, weights), [weights]);
  const all = useMemo(() => CANDS.map((c) => ({ ...c, status: statuses[c.id] })), [statuses]);
  const pool = useMemo(() => all.filter((c) => c.jd === jd), [all, jd]);
  const idxMap = useMemo(() => { const m = {}; const counters = {}; CANDS.forEach((c) => { counters[c.jd] = (counters[c.jd] ?? -1) + 1; m[c.id] = counters[c.jd]; }); return m; }, []);
  const names = useMemo(() => (c) => dispName(c, nameMode, idxMap[c.id], seed), [nameMode, idxMap, seed]);

  const tab = tabs[section];
  const setTab = (t) => setTabs((p) => ({ ...p, [section]: t }));
  const openDetail = (id) => { setSelected(id); setSection("cand"); setTabs((p) => ({ ...p, cand: "Candidate Detail" })); };
  const runBiasTest = () => { setSeed((s) => s + 1); setNameMode("random"); toastMsg("Name randomization completed. Ranking delta: 0 — identity is not a feature."); };

  const decide = (c, newStatus, action, reason, isOverride) => {
    const ov = overall(c);
    const aiRec = c.fn === "second" ? "Second-look recommended" : c.vRisk >= 60 ? "Verification recommended before progression" : ov >= 75 ? "Strong fit — recommend shortlist / panel" : ov >= 55 ? "Medium fit — recommend recruiter review" : "Low ranking — human review optional";
    const autoOverride = (ov < 55 && newStatus === "Shortlisted") || (ov >= 75 && newStatus === "Rejected by Human");
    setStatuses((s) => ({ ...s, [c.id]: newStatus }));
    setLog((l) => [...l, { id: l.length + 1, cand: names(c), ai: aiRec, human: action, override: !!isOverride || autoOverride,
      reviewer: "Demo Reviewer (you)", reason: reason || "—",
      snap: `weights ${JSON.stringify(weights) !== JSON.stringify(DEFAULT_WEIGHTS) ? "v1.0-mod" : "v1.0"} · embed v1.5 · evidence frozen`,
      ts: new Date().toISOString().slice(0, 19).replace("T", " "), notes: "" }]);
    toastMsg(`${action} — logged to audit trail${(isOverride || autoOverride) ? " as override" : ""}`);
  };

  const goToDemo = (s) => {
    setSection(s.section);
    setTabs((p) => ({ ...p, [s.section]: s.tab }));
    if (s.demoCand) setSelected(s.demoCand);
  };
  const startDemo = () => { setDemoOn(true); setDemoStep(0); goToDemo(DEMO_STEPS[0]); };
  const go = (where) => { if (where === "demo") startDemo(); };

  const sel = all.find((c) => c.id === selected);
  const section_ = SECTIONS.find((s) => s.id === section);

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg }}>
      <TopNav section={section} setSection={setSection} demoOn={demoOn} startDemo={startDemo} />
      {demoOn && <DemoBar step={demoStep} setStep={setDemoStep} exitDemo={() => setDemoOn(false)} goTo={goToDemo} />}
      <div className="max-w-7xl mx-auto px-6 py-7">
        {demoOn && <DemoHint step={demoStep} />}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <Tabs tabs={section_.tabs} tab={tab} setTab={setTab} />
          <div className="flex items-center gap-2 mb-6">
            <select value={jd} onChange={(e) => { setJd(e.target.value); setSelected(null); }} className="text-sm rounded-lg px-3 py-2 outline-none cursor-pointer font-medium"
              style={{ background: C.surf, color: C.ink, border: `1px solid ${C.line}`, boxShadow: SH }}>
              <option value="be">REQ-0417 · Senior Backend Developer</option>
              <option value="ds">REQ-0421 · Data Scientist / Applied ML</option>
              <option value="de">REQ-0428 · Data / MLOps Engineer</option>
            </select>
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}`, boxShadow: SH }}>
              {[["anon", "IDs"], ["synthetic", "Names"]].map(([m, l]) => (
                <button key={m} onClick={() => setNameMode(m)} className="text-xs px-3 py-2 font-medium transition-colors"
                  style={{ background: nameMode === m ? C.blueSoft : C.surf, color: nameMode === m ? C.blue : C.mut }}>{l}</button>))}
            </div>
          </div>
        </div>
        {section === "command" && <CommandCenter tab={tab} all={all} pool={pool} overall={overall} names={names} go={go} />}
        {section === "jd" && <JDIntel tab={tab} jd={jd} />}
        {section === "lab" && <ResumeLab tab={tab} pool={pool} overall={overall} names={names} openCand={openDetail} nameMode={nameMode} setNameMode={setNameMode} runBiasTest={runBiasTest} toastMsg={toastMsg} />}
        {section === "cand" && tab === "Ranking" && <RankingView pool={pool} overall={overall} names={names} selected={selected} setSelected={setSelected} openDetail={openDetail} showGT={showGT} setShowGT={setShowGT} />}
        {section === "cand" && tab === "Candidate Detail" && <CandidateDetail c={sel || [...pool].sort((a, b) => overall(b) - overall(a))[0]} overall={overall} names={names} decide={decide} weights={weights} back={() => setTab("Ranking")} />}
        {section === "cand" && tab === "Compare" && <CompareView pool={pool} overall={overall} names={names} />}
        {section === "cand" && tab === "Skill Adjacency" && <AdjacencyView />}
        {section === "second" && <SecondLookSection tab={tab} pool={pool} overall={overall} names={names} openDetail={openDetail} />}
        {section === "eval" && <EvalLab tab={tab} pool={pool} overall={overall} names={names} openDetail={openDetail} weights={weights} jd={jd} />}
        {section === "flow" && <FlowSection tab={tab} pool={pool} overall={overall} names={names} openDetail={openDetail} log={log} />}
        {section === "gov" && <GovSection tab={tab} log={log} weights={weights} setWeights={setWeights} pool={pool} names={names} />}
        {section === "reports" && <ReportsSection pool={pool} overall={overall} names={names} log={log} jd={jd} toastMsg={toastMsg} />}
        <div className="mt-10 pt-4 flex items-center justify-between flex-wrap gap-2 text-xs" style={{ borderTop: `1px solid ${C.line}`, color: C.faint }}>
          <span>Marevlo TalentOS · evaluation build · simulated model outputs · fully synthetic candidate identities</span>
          <span className="font-mono">on-prem · no external AI APIs · 0 auto-rejections · human decision final</span>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
