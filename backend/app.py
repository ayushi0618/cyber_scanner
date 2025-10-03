from flask import Flask, request, jsonify
from flask_cors import CORS
from scanner import scan_folder
import os

app = Flask(__name__)
CORS(app)  # allow frontend requests from different domain/port

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return "Cyber Scanner Backend is running!"

@app.route('/upload', methods=['POST'])
def upload_and_scan():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
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
    app.run(debug=True)
