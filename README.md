# 🔐 Cyber Scanner

> **A web-based cybersecurity analysis tool for inspecting uploaded ZIP archives and presenting scan results through a modern web interface.**

[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge\&logo=python\&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-000000?style=for-the-badge\&logo=flask\&logoColor=white)](https://flask.palletsprojects.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Educational-blue?style=for-the-badge)](#-license)

## 🌐 Live Demo

**Live Application:**
https://cyber-scanner.onrender.com/

---

## 📌 Overview

**Cyber Scanner** is a web-based cybersecurity analysis project designed to provide a simple interface for uploading and inspecting ZIP archives.

Instead of requiring users to work directly with command-line tools, the application provides a web interface where a ZIP file can be uploaded to the backend for processing.

The backend:

1. Receives the uploaded ZIP file.
2. Extracts its contents.
3. Traverses the extracted directory.
4. Collects the files discovered inside the archive.
5. Returns structured JSON results to the frontend.

The project is structured around a **frontend + Flask backend architecture**, making it suitable as a foundation for extending the scanner with more advanced security-analysis capabilities.

---

## ✨ Features

### 📦 ZIP File Analysis

Upload a ZIP archive through the web application and process its contents automatically.

### 📂 File Enumeration

The scanner recursively walks through the extracted directory and identifies files contained within the archive.

### 🔌 REST API

The Flask backend exposes an API endpoint for uploading and processing files.

### ⚡ Frontend / Backend Architecture

The project separates the user interface from the backend scanning logic, making the application easier to extend.

### 🌐 CORS Support

The backend is configured with Flask-CORS so that frontend requests can communicate with the Flask API across different origins.

### 📊 JSON Results

Scan results are returned in a structured JSON format, making them easy for the frontend to display and process.

---

## 🏗️ Architecture

```text
                 ┌──────────────────────┐
                 │      Web Browser     │
                 │                      │
                 │     Frontend UI      │
                 └──────────┬───────────┘
                            │
                            │ HTTP POST
                            ▼
                 ┌──────────────────────┐
                 │     Flask Backend    │
                 │                      │
                 │       /upload        │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     ZIP Processor    │
                 │                      │
                 │  Extract ZIP Archive │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    File Traversal    │
                 │                      │
                 │   Analyze ZIP files  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     JSON Results     │
                 │                      │
                 │  File + Scan Status  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Frontend UI     │
                 │   Display Results    │
                 └──────────────────────┘
```

---

## 🛠️ Tech Stack

| Technology      | Purpose                                     |
| --------------- | ------------------------------------------- |
| **Python**      | Backend programming                         |
| **Flask**       | REST API and web server                     |
| **Flask-CORS**  | Cross-origin frontend/backend communication |
| **JavaScript**  | Frontend interactions                       |
| **HTML5**       | Application structure                       |
| **CSS3**        | Styling and responsive interface            |
| **ZIP Library** | Archive extraction and file traversal       |

The repository currently identifies HTML, Python, JavaScript and CSS as its primary languages.

---

## 📁 Project Structure

```text
cyber_scanner/
│
├── backend/
│   ├── app.py
│   ├── scanner.py
│   ├── requirements.txt
│   └── uploads/
│
├── frontend/
│   └── ...
│
├── package.json
├── .gitignore
└── README.md
```

### Backend

```text
backend/
├── app.py
├── scanner.py
└── requirements.txt
```

### `app.py`

The Flask application provides:

* Backend server
* CORS configuration
* File upload endpoint
* ZIP scanning integration
* JSON responses

The primary scanning endpoint is:

```http
POST /upload
```

The endpoint expects a file uploaded using the `file` form field.

### `scanner.py`

Responsible for:

* Validating the uploaded archive
* Extracting ZIP files
* Traversing extracted directories
* Building scan results

Currently, ZIP files are the supported archive format.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ayushi0618/cyber_scanner.git
cd cyber_scanner
```

---

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

#### Windows

```bash
venv\Scripts\activate
```

#### macOS / Linux

```bash
source venv/bin/activate
```

---

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

The current backend dependencies include:

```text
Flask==3.0.3
flask-cors==4.0.0
```

---

### 4. Start the Backend

```bash
python app.py
```

The Flask application will start locally.

You should see something similar to:

```text
* Running on http://127.0.0.1:5000
```

---

## 🖥️ Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the frontend dependencies according to the project's frontend configuration.

If the frontend uses a Node-based development setup:

```bash
npm install
```

Then start the development server:

```bash
npm run dev
```

---

## 🔄 How It Works

### Step 1 — Upload

The user selects a ZIP archive through the frontend.

```text
User
 ↓
Select ZIP
 ↓
Upload
```

### Step 2 — Backend Processing

The frontend sends the archive to:

```http
POST /upload
```

The Flask server receives the file and saves it in the upload directory.

### Step 3 — Extraction

The scanner extracts the ZIP archive into a temporary extraction directory.

```text
uploaded.zip
      ↓
Extract
      ↓
uploaded.zip_extracted/
```

### Step 4 — File Discovery

The scanner recursively searches the extracted directory and records each discovered file.

```text
project.zip
│
├── src/
│   ├── app.js
│   └── utils.js
│
├── package.json
└── README.md
```

### Step 5 — Results

The backend returns structured JSON:

```json
{
  "results": [
    {
      "file": "src/app.js",
      "status": "clean"
    },
    {
      "file": "package.json",
      "status": "clean"
    }
  ]
}
```

---

## 🔌 API Reference

### Upload & Scan

```http
POST /upload
```

### Request

Send the ZIP archive as multipart form data:

```text
file=<your-zip-file>
```

### Successful Response

```json
{
  "results": [
    {
      "file": "example.txt",
      "status": "clean"
    }
  ]
}
```

### Error — No File

```json
{
  "error": "No file part"
}
```

### Error — No Selected File

```json
{
  "error": "No selected file"
}
```

### Error — Unsupported Format

Currently, non-ZIP files are rejected.

```text
Only ZIP files are supported
```

The API behavior follows the current Flask implementation.

---

## 🔐 Security Considerations

Cybersecurity tools must be used responsibly.

### ⚠️ Authorized Use Only

Only upload and analyze files that you own or have explicit permission to inspect.

Do **not** use this application to analyze confidential, private, or third-party data without authorization.

### ⚠️ Current Scanner Limitation

The current implementation performs ZIP extraction and file enumeration. The returned `"clean"` status is currently a placeholder rather than proof that a file is malware-free.

Therefore:

> **A file being reported as `clean` should not be interpreted as a guarantee that the file is safe.**

---

## 🧪 Current Capabilities

| Capability                     | Status |
| ------------------------------ | ------ |
| ZIP upload                     | ✅      |
| ZIP extraction                 | ✅      |
| Recursive file discovery       | ✅      |
| JSON scan results              | ✅      |
| REST API                       | ✅      |
| Frontend integration           | ✅      |
| Real malware detection         | 🚧     |
| Hash-based threat intelligence | 🚧     |
| YARA rules                     | 🚧     |
| VirusTotal integration         | 🚧     |
| File signature analysis        | 🚧     |
| CVE analysis                   | 🚧     |
| PDF security report            | 🚧     |

---

## 🔮 Future Roadmap

The current architecture provides a foundation for adding more meaningful security analysis.

### Phase 1 — File Intelligence

* SHA-256 hash generation
* File type detection
* File size analysis
* MIME-type verification
* Suspicious extension detection

### Phase 2 — Malware Detection

* YARA rule integration
* ClamAV integration
* Malware signature scanning
* Suspicious file pattern detection

### Phase 3 — Threat Intelligence

Integrate trusted threat-intelligence sources to check file hashes against known malicious indicators.

Possible additions:

```text
Hash
 ↓
Threat Intelligence API
 ↓
Known / Unknown
 ↓
Risk Assessment
```

### Phase 4 — Security Scoring

Introduce a risk model such as:

```text
🟢 LOW
🟡 MEDIUM
🟠 HIGH
🔴 CRITICAL
```

The score should be based on documented detection signals rather than simply labeling unknown files as safe.

### Phase 5 — Professional Reports

Generate:

* HTML reports
* PDF reports
* JSON reports
* Scan history
* Detection summaries
* File-level findings

---

## 📊 Example Future Report

```text
╔══════════════════════════════════════════╗
║           CYBER SCANNER REPORT           ║
╠══════════════════════════════════════════╣
║ Target        : sample-project.zip       ║
║ Files Scanned : 127                      ║
║ Suspicious    : 3                        ║
║ High Risk     : 1                        ║
║ Medium Risk   : 2                        ║
║ Clean         : 124                      ║
╚══════════════════════════════════════════╝
```

---

## 🎯 Project Goals

Cyber Scanner is intended to demonstrate practical implementation of:

* Full-stack web application architecture
* REST API development
* File upload handling
* Archive processing
* Backend/frontend communication
* JSON-based data exchange
* Fundamentals of cybersecurity automation

---

## 🤝 Contributing

Contributions are welcome.

### 1. Fork the repository

```bash
git fork
```

### 2. Create a branch

```bash
git checkout -b feature/your-feature
```

### 3. Make your changes

Implement and test your feature.

### 4. Commit

```bash
git add .
git commit -m "Add: your feature"
```

### 5. Push

```bash
git push origin feature/your-feature
```

### 6. Open a Pull Request

Explain:

* What you changed
* Why you changed it
* How you tested it

---

## 🐛 Reporting Issues

If you find a bug or have a feature request, open an issue with:

```text
### Description
Describe the problem.

### Steps to Reproduce
1. ...
2. ...
3. ...

### Expected Behavior
...

### Actual Behavior
...

### Environment
OS:
Python:
Browser:
```

---

## 📜 License

This project is intended for **educational and authorized cybersecurity research purposes**.

Before deploying the scanner against real systems or processing third-party data, ensure that you have the necessary authorization.

---

## 👩‍💻 Author

**Ayushi0618**

GitHub:
https://github.com/ayushi0618

Repository:
https://github.com/ayushi0618/cyber_scanner

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

### 🔐 Cybersecurity Disclaimer

**Cyber Scanner is an educational cybersecurity project. Use it only on files, systems, and environments that you own or have explicit permission to analyze. The developers are not responsible for unauthorized or malicious use of this software.**
