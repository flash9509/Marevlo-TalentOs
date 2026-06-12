"""Resume and JD parsing: PII stripping, sectioning, timeline extraction,
parse-confidence estimation.

Policy encoded here: a parse failure must never become a rejection. Low
confidence lowers evidence weight and routes to manual review — the
candidate stays in the pool.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
URL = re.compile(r"(https?://\S+|www\.\S+|linkedin\.com\S*|github\.com\S*)", re.I)

MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec"
DATE_RANGE = re.compile(
    rf"((?:{MONTHS})[a-z]*\.?\s*\d{{4}}|\d{{4}})\s*[–—\-to]+\s*"
    rf"((?:{MONTHS})[a-z]*\.?\s*\d{{4}}|\d{{4}}|present|current|now)", re.I)
STATED_YEARS = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b", re.I)

SECTION_HEADS = ["experience", "work experience", "employment", "projects",
                 "education", "skills", "publications", "summary", "profile",
                 "certifications", "achievements", "objective"]


def strip_pii(text: str) -> str:
    """Remove direct contact identifiers before anything downstream sees text.
    Names are retained for display only and are never a scoring feature."""
    text = EMAIL.sub("[email removed]", text)
    text = URL.sub("[link removed]", text)
    text = PHONE.sub("[phone removed]", text)
    return text


def _month_index(tok: str) -> int:
    tok = tok.lower()[:3]
    order = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    return order.index(tok) if tok in order else 0


def _to_month(stamp: str, now=(2026, 6)) -> int:
    s = stamp.strip().lower()
    if s in ("present", "current", "now"):
        return now[0] * 12 + now[1]
    m = re.match(rf"({MONTHS})[a-z]*\.?\s*(\d{{4}})", s, re.I)
    if m:
        return int(m.group(2)) * 12 + _month_index(m.group(1))
    m = re.match(r"(\d{4})", s)
    if m:
        return int(m.group(1)) * 12
    return 0


def extract_timeline(text: str):
    """All dated ranges as (start_month, end_month); merged dated experience
    in years; and the maximum stated '<N>+ years' claim."""
    spans = []
    for a, b in DATE_RANGE.findall(text):
        s, e = _to_month(a), _to_month(b)
        if 1990 * 12 < s <= e:
            spans.append((s, e))
    spans.sort()
    merged, dated = [], 0
    for s, e in spans:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    dated = sum(e - s for s, e in merged) / 12.0
    stated = max((float(x) for x in STATED_YEARS.findall(text)), default=0.0)
    return {"spans": spans, "dated_years": round(dated, 1), "stated_years": stated}


def split_sections(text: str) -> dict:
    """Heuristic sectioning by common resume headings."""
    lines = text.splitlines()
    sections, current, buf = {}, "header", []
    for ln in lines:
        bare = re.sub(r"[^a-z ]", "", ln.lower()).strip()
        if bare in SECTION_HEADS and len(ln.strip()) < 40:
            sections[current] = "\n".join(buf).strip()
            current, buf = bare, []
        else:
            buf.append(ln)
    sections[current] = "\n".join(buf).strip()
    return sections


def sentences(text: str):
    parts = re.split(r"(?<=[.!?])\s+|\n+|•|\u2022|\u27a2|\u25cf", text)
    return [p.strip(" -–\t") for p in parts if len(p.strip()) > 12]


def parse_confidence(raw: str, name_found: bool, timeline) -> int:
    """Estimate extraction quality. Penalize missing identity, missing dates,
    collapsed whitespace (encoding damage), and section disorder."""
    score = 95
    if not name_found:
        score -= 25
    if not timeline["spans"]:
        score -= 20
    words = raw.split()
    if words:
        long_tokens = sum(1 for w in words if len(w) > 22)
        if long_tokens / len(words) > 0.04:   # ligature/encoding damage signature
            score -= 18
    if len(split_sections(raw)) <= 2:
        score -= 8
    return max(20, min(98, score))


@dataclass
class Resume:
    cid: str
    name: str
    raw: str
    text: str
    skills: set = field(default_factory=set)
    sections: dict = field(default_factory=dict)
    timeline: dict = field(default_factory=dict)
    parse: int = 0
    flags: list = field(default_factory=list)


def parse_resume(cid: str, raw: str, declared_name: str | None = None) -> Resume:
    from . import taxonomy
    text = strip_pii(raw)
    first = next((l.strip() for l in raw.splitlines() if l.strip()), "")
    name_found = bool(declared_name) or bool(re.match(r"^[A-Z][a-zA-Z.'-]+(\s+[A-Z][a-zA-Z.'-]+){1,3}$", first))
    name = declared_name or (first if name_found else f"(Unnamed) {cid}")
    sections = split_sections(text)
    professional = "\n".join(v for k, v in sections.items() if k != "education")
    timeline = extract_timeline(professional)
    r = Resume(cid=cid, name=name, raw=raw, text=text,
               skills=taxonomy.extract_skills(text),
               sections=sections, timeline=timeline,
               parse=parse_confidence(raw, name_found, timeline))
    if not name_found:
        r.flags.append("No candidate name found in document")
    if not timeline["spans"]:
        r.flags.append("No dated employment history found")
    return r


@dataclass
class JD:
    jid: str
    title: str
    text: str
    mandatory: list
    preferred: list
    exp_band: tuple
    mandatory_skills: set = field(default_factory=set)
    preferred_skills: set = field(default_factory=set)


def parse_jd(jid: str, raw: str) -> JD:
    """JD format: TITLE line, EXPERIENCE: a-b, MANDATORY:/PREFERRED: bullet blocks."""
    from . import taxonomy
    title = next((l.strip() for l in raw.splitlines() if l.strip()), jid)
    def block(head):
        m = re.search(head + r":?\s*\n((?:[-•*].*\n?)+)", raw, re.I)
        return [re.sub(r"^[-•*]\s*", "", l).strip() for l in m.group(1).splitlines() if l.strip()] if m else []
    mandatory, preferred = block("MANDATORY"), block("PREFERRED")
    m = re.search(r"EXPERIENCE:?\s*(\d+)\s*[-–]\s*(\d+)", raw, re.I)
    band = (int(m.group(1)), int(m.group(2))) if m else (3, 10)
    jd = JD(jid=jid, title=title, text=raw, mandatory=mandatory, preferred=preferred, exp_band=band)
    jd.mandatory_skills = set().union(*[taxonomy.extract_skills(x) for x in mandatory]) if mandatory else set()
    jd.preferred_skills = set().union(*[taxonomy.extract_skills(x) for x in preferred]) if preferred else set()
    return jd
