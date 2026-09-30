"""
Cyber Scanner detection engine.

Statically analyzes source files inside an uploaded ZIP archive and reports
real vulnerability findings: each finding carries the file, line number,
vulnerability name, severity, remediation guidance and the offending code
snippet. Severity/remediation come from scoring.assign_severity; a 0-100
security score and letter grade are derived from severity-weighted findings.
"""
import os
import re
import zipfile

from scoring import assign_severity

# ---------------------------------------------------------------------------
# Detection rules: (vulnerability name, compiled regex, applicable extensions)
# ---------------------------------------------------------------------------
PY = {".py"}
JS = {".js", ".jsx", ".ts", ".tsx", ".mjs"}
ALL_TEXT = PY | JS | {".java", ".php", ".rb", ".go", ".cs", ".cpp", ".c", ".h",
                      ".html", ".htm", ".xml", ".json", ".yml", ".yaml", ".env",
                      ".txt", ".md", ".sh", ".sql"}

RULES = [
    # --- secrets / credentials -------------------------------------------
    ("Exposed AWS Access Key",
     re.compile(r"\bAKIA[0-9A-Z]{16}\b"), ALL_TEXT),
    ("Exposed Private Key",
     re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"), ALL_TEXT),
    ("Hardcoded API Key",
     re.compile(r"(?i)\b(api[_-]?key|apikey|api[_-]?secret|client[_-]?secret)\b\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
     ALL_TEXT),
    ("Hardcoded Password",
     re.compile(r"(?i)\b(password|passwd|pwd)\b\s*[:=]\s*['\"][^'\"]{3,}['\"]"),
     ALL_TEXT),
    ("Hardcoded Secret",
     re.compile(r"(?i)\b(secret|token)\b\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
     ALL_TEXT),

    # --- code / command injection -----------------------------------------
    ("Eval Usage",
     re.compile(r"\beval\s*\("), PY | JS),
    ("Exec Usage",
     re.compile(r"(?<!\w)exec\s*\("), PY),
    ("Shell Execution",
     re.compile(r"\bos\.system\s*\("), PY),
    ("Shell Execution",
     re.compile(r"subprocess\.\w+\s*\([^)]*shell\s*=\s*True"), PY),
    ("Dangerous innerHTML",
     re.compile(r"\.innerHTML\s*="), JS),
    ("Document Write XSS",
     re.compile(r"\bdocument\.write\s*\("), JS),

    # --- injection ---------------------------------------------------------
    ("SQL Injection",
     re.compile(r"(?i)\b(SELECT|INSERT|UPDATE|DELETE)\b[^;'\"]*(['\"]\s*\+|\+[^;]*['\"]|%\s*\(|f['\"])"),
     PY | {".php", ".java", ".js"}),
    ("SQL Injection",
     re.compile(r"\.execute\s*\(\s*['\"].*%s.*['\"]\s*%"), PY),

    # --- crypto / randomness ----------------------------------------------
    ("Weak Password Hashing",
     re.compile(r"hashlib\.(md5|sha1)\s*\("), PY),
    ("Weak Password",
     re.compile(r"(?i)(password|passwd|pwd)\s*=\s*['\"](123|password|qwerty|admin|letmein)['\"]"),
     ALL_TEXT),
    ("Weak Randomness",
     re.compile(r"\brandom\.(random|randint|choice)\s*\("), PY),
    ("Insecure Deserialization",
     re.compile(r"\bpickle\.loads?\s*\("), PY),
    ("Insecure YAML Load",
     re.compile(r"yaml\.load\s*\([^)]*\)"), PY),

    # --- transport / config ------------------------------------------------
    ("TLS Verification Disabled",
     re.compile(r"verify\s*=\s*False"), PY),
    ("Debug Mode Enabled",
     re.compile(r"debug\s*=\s*True"), PY),
    ("Insecure File Handling",
     re.compile(r"open\s*\([^)]*['\"]w['\"]"), PY),
    ("Sensitive Data in Local Storage",
     re.compile(r"localStorage\.setItem\s*\("), JS),
]

# Skip noise: vendored code, lockfiles, minified bundles
SKIP_DIRS = {"node_modules", ".git", "__pycache__", "venv", ".venv", "dist", "build"}
SKIP_SUFFIXES = (".min.js", ".bundle.js", ".lock", ".map")
MAX_FILE_BYTES = 1_000_000  # don't scan huge blobs


def _should_scan(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    if any(p in SKIP_DIRS for p in parts):
        return False
    low = rel_path.lower()
    if low.endswith(SKIP_SUFFIXES):
        return False
    ext = os.path.splitext(low)[1]
    return ext in ALL_TEXT


def _scan_text(rel_path, text):
    findings = []
    ext = os.path.splitext(rel_path.lower())[1]
    lines = text.splitlines()
    for vuln_name, pattern, exts in RULES:
        if ext not in exts:
            continue
        for i, line in enumerate(lines, start=1):
            if pattern.search(line):
                findings.append({
                    "file": rel_path,
                    "line": i,
                    "vulnerability": vuln_name,
                    "snippet": line.strip()[:200],
                })
    return findings


def _score_and_grade(findings):
    weights = {"Critical": 25, "High": 10, "Medium": 5, "Low": 2}
    score = 100 - sum(weights.get(f.get("severity", "Low"), 2) for f in findings)
    score = max(0, score)
    grade = "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 \
        else "D" if score >= 60 else "F"
    return score, grade


def scan_zip(zip_path):
    """Scan a ZIP archive. Returns a dict with score, grade, summary and
    per-file results (each with status + findings)."""
    if not os.path.exists(zip_path):
        raise FileNotFoundError(f"{zip_path} does not exist")
    if not zip_path.endswith(".zip"):
        raise ValueError("Only ZIP files are supported")

    all_findings = []
    file_results = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        names = [n for n in zf.namelist() if not n.endswith("/")]
        for name in names:
            if not _should_scan(name):
                continue
            try:
                info = zf.getinfo(name)
                if info.file_size > MAX_FILE_BYTES:
                    continue
                text = zf.read(name).decode("utf-8", errors="replace")
            except Exception:
                continue
            findings = _scan_text(name, text)
            if findings:
                all_findings.extend(findings)
            file_results.append({"file": name, "findings": findings})

    # Enrich every finding with severity + remediation
    all_findings = assign_severity(all_findings)

    # Attach enriched findings back to their files and set file status
    by_file = {}
    for f in all_findings:
        by_file.setdefault(f["file"], []).append(f)
    for fr in file_results:
        fr["findings"] = by_file.get(fr["file"], [])
        sev_order = {"Critical": 3, "High": 2, "Medium": 1, "Low": 0}
        top = max((sev_order.get(f.get("severity", "Low"), 0)
                   for f in fr["findings"]), default=-1)
        fr["status"] = ("vulnerable" if top >= 2 else
                        "suspicious" if top >= 0 else "clean")

    score, grade = _score_and_grade(all_findings)
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for f in all_findings:
        sev = f.get("severity", "Low")
        counts[sev] = counts.get(sev, 0) + 1

    return {
        "score": score,
        "grade": grade,
        "summary": {
            "files_scanned": len(file_results),
            "total_findings": len(all_findings),
            **counts,
        },
        "results": file_results,
    }


# Backwards-compatible alias: the old API returned {"results": [...]} from
# scan_folder(). Kept so nothing that imports it breaks.
def scan_folder(zip_path):
    report = scan_zip(zip_path)
    return {"results": [{"file": r["file"], "status": r["status"]}
                        for r in report["results"]]}
