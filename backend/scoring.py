
def assign_severity(findings):
    for f in findings:
        name = f.get("vulnerability", "").lower()
        f["severity"] = "Low"
        f["remediation"] = "Investigate and apply secure coding best practices."

        if "weak password" in name:
            f["severity"] = "High"
            f["remediation"] = "Do not hardcode passwords. Use environment variables or a secrets manager."
        elif "eval()" in name or "exec()" in name:
            f["severity"] = "High"
            f["remediation"] = "Avoid eval/exec. Use safe parsing or explicit logic."
        elif "shell execution" in name or "subprocess" in name:
            f["severity"] = "High"
            f["remediation"] = "Avoid unsanitized shell execution. Validate inputs and use safer APIs."
        elif "hardcoded api key" in name:
            f["severity"] = "Medium"
            f["remediation"] = "Move secrets to environment variables; rotate keys if exposed."
        elif "open file without context manager" in name:
            f["severity"] = "Low"
            f["remediation"] = "Use `with open(...) as f:` to ensure files are properly closed."

    return findings

