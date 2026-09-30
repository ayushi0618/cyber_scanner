from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from scanner import scan_folder
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Frontend lives in ../frontend relative to this file; served same-origin as the API.
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

app = Flask(__name__)
CORS(app)  # allow frontend requests from different domain/port

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def home():
    # Serve the frontend UI from the same origin as the API.
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_frontend(filename):
    # Serve frontend pages/assets (scan.html, css/..., js/...).
    # Never shadow the API routes.
    if filename == "upload" or filename.startswith("api/"):
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

    # Save uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Scan the uploaded file/folder
    try:
        results = scan_folder(file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(results)


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)
