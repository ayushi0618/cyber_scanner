// API base: same origin as the served UI by default (Flask serves the
// frontend and the API from one origin). Override with
// window.CYBER_SCANNER_API_BASE when the UI is hosted separately.
const API_BASE = (window.CYBER_SCANNER_API_BASE || window.location.origin).replace(/\/$/, "");

window.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#history-table tbody');

    let data;
    try {
        const response = await fetch(`${API_BASE}/history`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="3" class="error">Could not load history: ${err.message}</td></tr>`;
        return;
    }

    if (!data.length) {
        tableBody.innerHTML = '<tr><td colspan="3" class="muted">No scans recorded yet.</td></tr>';
        return;
    }

    data.forEach(scan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${scan.name}</td>
            <td>${scan.timestamp}</td>
            <td><span class="badge">${scan.status}</span></td>
        `;
        tableBody.appendChild(row);
    });
});
