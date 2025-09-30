# backend/app.py
import os
import io
import json
import uuid
import sqlite3
import datetime
import zipfile
from flask import Flask, jsonify, request
from flask_cors import CORS
import scanner
import scoring

# --- Configuration ---
BASE_DIR = os.path.dirname(__file__)
SAMPLE_DIR = os.path.join(BASE_DIR, "sample_code")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
RESULTS_FILE = os.path.join(BASE_DIR, "results.json")
DB_FILE = os.path.join(BASE_DIR, "history.db")
ALLOWED_EXTENSIONS = {".zip"}
MAX_ZIP_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit for uploads (adjust as needed)
# ----------------------

app = Flask(__name__)
CORS(app)

# Ensure folders exist
os.makedirs(SAMPLE_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# --- SQLite helper functions ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            source TEXT,
            target TEXT,
            results_count INTEGER,
            results_json TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_scan_record(run_id, source, target, results):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        'INSERT INTO scans (id, timestamp, source, target, results_count, results_json) VALUES (?, ?, ?, ?, ?, ?)',
        (run_id, datetime.datetime.utcnow().isoformat() + "Z", source, target, len(results), json.dumps(results))
    )
    conn.commit()
    conn.close()

def list_history(limit=50):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT id, timestamp, source, target, results_count FROM scans ORDER BY timestamp DESC LIMIT ?', (limit,))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "timestamp": r[1], "source": r[2], "target": r[3], "results_count": r[4]} for r in rows]

def get_history_entry(run_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT id, timestamp, source, target, results_count, results_json FROM scans WHERE id = ?', (run_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "timestamp": row[1],
        "source": row[2],
        "target": row[3],
        "results_count": row[4],
        "results": json.loads(row[5]) if row[5] else []
    }

# --- Utility helpers ---
def allowed_file(filename):
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS

def secure_extract_zip(file_bytes: bytes, dest_dir: str):
    """
    Safely extract zip bytes to dest_dir.
    Prevents zip-slip by validating each member path.
    Returns list of extracted file paths.
    """
    extracted_paths = []
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
        # Optional: check zip size/uncompressed size to avoid zip bombs
        # Here we simply iterate and extract with safety checks
        for member in z.infolist():
            member_name = member.filename
            # skip directories and __MACOSX
            if member_name.endswith('/') or member_name.startswith('__MACOSX'):
                continue
            # Normalize path
            normalized = os.path.normpath(member_name)
            # Prevent absolute paths and parent traversal
            if normalized.startswith("..") or os.path.isabs(normalized):
                continue
            # Only extract files (we'll keep directory structure)
            target_path = os.path.join(dest_dir, normalized)
            target_dir = os.path.dirname(target_path)
            os.makedirs(target_dir, exist_ok=True)
            with z.open(member) as source, open(target_path, "wb") as target:
                data = source.read()
                target.write(data)
            extracted_paths.append(target_path)
    return extracted_paths

# Initialize DB on startup
init_db()

# --- API endpoints ---
@app.route("/")
def home():
    return jsonify({"message": "Smart Vulnerability Scanner API - endpoints: /scan, /upload, /results, /history"})

@app.route("/scan", methods=["GET"])
def run_scan():
    """
    Scan server-side sample_code or a subfolder.
    GET /scan?target=project1
    """
    target = request.args.get("target", "")
    requested = os.path.normpath(os.path.join(SAMPLE_DIR, target))
    if not requested.startswith(SAMPLE_DIR):
        return jsonify({"error": "Invalid target path"}), 400

    results = scanner.scan_folder(requested if os.path.exists(requested) else SAMPLE_DIR)
    results = scoring.assign_severity(results)
    # save to latest results file
    try:
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
    except Exception as e:
        print("Failed to save results:", e)

    # Save to history DB
    run_id = str(uuid.uuid4())
    save_scan_record(run_id, "server_folder", target or "sample_code", results)
    return jsonify({"run_id": run_id, "results": results})

@app.route("/results", methods=["GET"])
def get_results():
    """Return last saved results.json"""
    if not os.path.exists(RESULTS_FILE):
        return jsonify({"message": "No results yet. Run /scan or /upload first."}), 404
    try:
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/upload", methods=["POST"])
def upload_and_scan():
    """
    POST /upload
    Form-data expected: file=<zipfile>
    Returns scan results.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    uploaded = request.files['file']
    filename = uploaded.filename or ""
    if filename == "":
        return jsonify({"error": "No selected file"}), 400
    if not allowed_file(filename):
        return jsonify({"error": "Only .zip files are allowed"}), 400

    # Read bytes and size check
    content = uploaded.read()
    if len(content) > MAX_ZIP_SIZE_BYTES:
        return jsonify({"error": "Uploaded file is too large"}), 413

    # Create unique extraction directory
    run_id = str(uuid.uuid4())
    dest_dir = os.path.join(UPLOADS_DIR, run_id)
    os.makedirs(dest_dir, exist_ok=True)

    # Safely extract zip
    try:
        extracted_paths = secure_extract_zip(content, dest_dir)
    except zipfile.BadZipFile:
        return jsonify({"error": "Uploaded file is not a valid zip"}), 400
    except Exception as e:
        return jsonify({"error": f"Extraction failed: {e}"}), 500

    # Scan only the extracted folder
    results = scanner.scan_folder(dest_dir)
    results = scoring.assign_severity(results)

    # Save results to results.json and to history DB
    try:
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
    except Exception as e:
        print("Failed to save results:", e)

    save_scan_record(run_id, "upload", filename, results)

    # For dev: return list of extracted file names and results
    return jsonify({"run_id": run_id, "extracted_count": len(extracted_paths), "results": results})

@app.route("/history", methods=["GET"])
def history():
    limit = request.args.get("limit", 50)
    try:
        limit = int(limit)
    except:
        limit = 50
    entries = list_history(limit=limit)
    return jsonify(entries)

@app.route("/history/<run_id>", methods=["GET"])
def history_entry(run_id):
    entry = get_history_entry(run_id)
    if not entry:
        return jsonify({"error": "Run not found"}), 404
    return jsonify(entry)

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
