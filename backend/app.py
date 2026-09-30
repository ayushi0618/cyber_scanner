from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from scanner import scan_zip
import json
import os
import sqlite3
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Frontend lives in ../frontend relative to this file; served same-origin as the API.
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

app = Flask(__name__)
CORS(app)  # allow frontend requests from different domain/port

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = os.path.join(BASE_DIR, "scans.db")
MAX_HISTORY = 100

API_ROUTES = {"upload", "history", "dashboard-data", "scan"}


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                score INTEGER NOT NULL,
                grade TEXT NOT NULL,
                files_scanned INTEGER NOT NULL,
                total_findings INTEGER NOT NULL,
                critical INTEGER NOT NULL,
                high INTEGER NOT NULL,
                medium INTEGER NOT NULL,
                low INTEGER NOT NULL,
                report_json TEXT NOT NULL
            )
        """)


init_db()


def _save_scan(name, report):
    s = report["summary"]
    ts = datetime.now(timezone.utc).isoformat()
    with _db() as conn:
        conn.execute(
            """INSERT INTO scans
               (name, timestamp, score, grade, files_scanned, total_findings,
                critical, high, medium, low, report_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (name, ts, report["score"], report["grade"], s["files_scanned"],
             s["total_findings"], s["Critical"], s["High"], s["Medium"],
             s["Low"], json.dumps(report)),
        )
        # keep history bounded
        conn.execute(
            """DELETE FROM scans WHERE id NOT IN
               (SELECT id FROM scans ORDER BY id DESC LIMIT ?)""",
            (MAX_HISTORY,),
        )
        scan_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    return scan_id, ts


@app.route("/")
def home():
    # Serve the frontend UI from the same origin as the API.
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_frontend(filename):
    # Serve frontend pages/assets (scan.html, css/..., js/...).
    # Never shadow the API routes.
    first = filename.split("/")[0]
    if first in API_ROUTES or filename.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    file_path = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(file_path):
        return send_from_directory(FRONTEND_DIR, filename)
    # Extensionless unknown paths look like API/data routes -> 404 JSON
    # (so fetch().json() callers get a clean error, not the index page).
    if "." not in os.path.basename(filename):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api")
def api_health():
    return "Cyber Scanner Backend is running!"


@app.route("/upload", methods=["POST"])
def upload_and_scan():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith(".zip"):
        return jsonify({"error": "Only .zip archives are supported"}), 400

    # Save uploaded file (avoid path traversal via the client filename)
    safe_name = os.path.basename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(file_path)

    # Scan the uploaded archive with the real detection engine
    try:
        report = scan_zip(file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.remove(file_path)
        except OSError:
            pass

    scan_id, ts = _save_scan(safe_name, report)
    report["scan_id"] = scan_id
    report["timestamp"] = ts
    report["filename"] = safe_name
    return jsonify(report)


@app.route("/history")
def history():
    with _db() as conn:
        rows = conn.execute(
            """SELECT id, name, timestamp, score, grade, files_scanned,
                      total_findings, critical, high, medium, low
               FROM scans ORDER BY id DESC"""
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/scan/<int:scan_id>")
def scan_detail(scan_id):
    with _db() as conn:
        row = conn.execute(
            "SELECT id, name, timestamp, report_json FROM scans WHERE id = ?",
            (scan_id,),
        ).fetchone()
    if not row:
        return jsonify({"error": "Scan not found"}), 404
    report = json.loads(row["report_json"])
    report["scan_id"] = row["id"]
    report["filename"] = row["name"]
    report["timestamp"] = row["timestamp"]
    return jsonify(report)


@app.route("/dashboard-data")
def dashboard_data():
    with _db() as conn:
        rows = conn.execute(
            """SELECT id, name, timestamp, score, grade, total_findings,
                      critical, high, medium, low, report_json
               FROM scans ORDER BY id"""
        ).fetchall()

    scans = [dict(r) for r in rows]
    severity_totals = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    file_counts = {}
    for s in scans:
        for sev in severity_totals:
            severity_totals[sev] += s[sev.lower()]
        try:
            report = json.loads(s["report_json"])
            for r in report.get("results", []):
                n = len(r.get("findings", []))
                if n:
                    file_counts[r["file"]] = file_counts.get(r["file"], 0) + n
        except (ValueError, KeyError):
            pass

    trend = [{"id": s["id"], "name": s["name"], "timestamp": s["timestamp"],
              "score": s["score"], "grade": s["grade"],
              "findings": s["total_findings"]} for s in scans[-20:]]
    top_files = [{"file": f, "findings": c}
                 for f, c in sorted(file_counts.items(),
                                    key=lambda kv: kv[1], reverse=True)[:8]]
    avg_score = round(sum(s["score"] for s in scans) / len(scans), 1) if scans else 0

    return jsonify({
        "total_scans": len(scans),
        "avg_score": avg_score,
        "severity_totals": severity_totals,
        "total_findings": sum(severity_totals.values()),
        "score_trend": trend,
        "top_files": top_files,
    })


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)
