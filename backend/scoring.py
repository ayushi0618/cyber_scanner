"""Severity + remediation knowledge base for Cyber Scanner findings.

assign_severity(findings) takes a list of finding dicts with a
"vulnerability" key and enriches each with "severity" (Critical/High/Medium/
Low) and "remediation" guidance.
"""

SEVERITY_MAP = {
    # critical: direct credential / key exposure
    "exposed aws access key": (
        "Critical",
        "Revoke the key in the AWS console immediately, then move it to "
        "environment variables or a secrets manager (AWS Secrets Manager, "
        "Vault). Never commit credentials."),
    "exposed private key": (
        "Critical",
        "This private key must be considered compromised: generate a new "
        "keypair, revoke/replace the old one everywhere, and store keys in "
        "a secrets manager, never in the repo."),

    # high: injection / auth bypass primitives
    "eval usage": (
        "High",
        "Avoid eval(): it executes arbitrary code. Use safe parsing "
        "(json.loads, ast.literal_eval) or explicit allow-listed logic."),
    "exec usage": (
        "High",
        "Avoid exec(): it runs arbitrary code. Refactor to explicit "
        "functions or a restricted DSL."),
    "shell execution": (
        "High",
        "Avoid os.system()/shell=True with unsanitized input. Use "
        "subprocess with an argument list and shell=False, and validate "
        "all inputs."),
    "sql injection": (
        "High",
        "Use parameterized queries / prepared statements instead of "
        "string-built SQL. Never concatenate user input into queries."),
    "dangerous innerhtml": (
        "High",
        "Assigning innerHTML with untrusted data enables XSS. Use "
        "textContent or a sanitizer (DOMPurify) instead."),
    "document write xss": (
        "High",
        "document.write with dynamic data enables XSS. Build DOM nodes "
        "with createElement/textContent instead."),
    "hardcoded password": (
        "High",
        "Do not hardcode passwords. Use environment variables or a "
        "secrets manager, and rotate any exposed credential."),
    "hardcoded secret": (
        "High",
        "Move secrets to environment variables or a secrets manager and "
        "rotate them if they were ever committed."),
    "tls verification disabled": (
        "High",
        "Re-enable certificate verification (verify=True). Disabling it "
        "exposes the app to man-in-the-middle attacks."),
    "insecure deserialization": (
        "High",
        "Never unpickle untrusted data: it allows remote code execution. "
        "Use JSON or another safe format."),
    "weak password": (
        "High",
        "Enforce a strong password policy (length, complexity, breach "
        "lists) and never use default credentials."),

    # medium: weak crypto / risky config / data exposure
    "hardcoded api key": (
        "Medium",
        "Move the key to environment variables or a secrets manager, "
        "restrict its scope, and rotate it if exposed."),
    "weak password hashing": (
        "Medium",
        "MD5/SHA1 are not password hashes. Use bcrypt, scrypt or Argon2 "
        "with a per-user salt."),
    "insecure yaml load": (
        "Medium",
        "Use yaml.safe_load() instead of yaml.load() to prevent arbitrary "
        "code execution from malicious YAML."),
    "debug mode enabled": (
        "Medium",
        "Disable debug mode in production: it can leak stack traces, "
        "config and an interactive console."),
    "sensitive data in local storage": (
        "Medium",
        "localStorage is readable by any script on the page. Keep tokens "
        "in httpOnly secure cookies instead."),
    "weak randomness": (
        "Medium",
        "random is not cryptographically secure. Use the secrets module "
        "for tokens, passwords and security-sensitive values."),

    # low: hygiene
    "insecure file handling": (
        "Low",
        "Use `with open(...) as f:` so files are always closed properly, "
        "and validate/sanitize any user-controlled paths."),
}

DEFAULT = ("Low", "Investigate and apply secure coding best practices.")


def assign_severity(findings):
    for f in findings:
        name = f.get("vulnerability", "").lower()
        severity, remediation = DEFAULT
        for key, (sev, rem) in SEVERITY_MAP.items():
            if key in name:
                severity, remediation = sev, rem
                break
        f["severity"] = severity
        f["remediation"] = remediation
    return findings
