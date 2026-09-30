// API base: same origin as the served UI by default (Flask serves the
// frontend and the API from one origin). Override with
// window.CYBER_SCANNER_API_BASE when the UI is hosted separately.
const API_BASE = (window.CYBER_SCANNER_API_BASE || window.location.origin).replace(/\/$/, "");

const form = document.getElementById('upload-form');
const resultsDiv = document.getElementById('scan-results');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    resultsDiv.innerHTML = '<p class="scanning">Scanning...</p>';

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            resultsDiv.innerHTML = `<p class="error">Error: ${data.error || response.statusText}</p>`;
            return;
        }
        const rows = (data.results || []).map(r =>
            `<div class="result-row"><span class="result-file">${r.file}</span><span class="badge badge-clean">${r.status}</span></div>`
        ).join('');
        resultsDiv.innerHTML = rows || '<p class="muted">No files found in the archive.</p>';
    } catch(err) {
        resultsDiv.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }
});
