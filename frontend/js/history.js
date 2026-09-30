// Cyber Scanner — history page. Click a row to reopen the full report.
// Same-origin API by default; override with window.CYBER_SCANNER_API_BASE.
const API_BASE = (window.CYBER_SCANNER_API_BASE || window.location.origin).replace(/\/$/, "");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

window.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#history-table tbody");

  let data;
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="error-box">[!] Could not load history: ${esc(err.message)}</div></td></tr>`;
    return;
  }

  if (!data.length) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><span class="big">📡</span>No scans recorded yet. <a href="scan.html">Run your first scan</a>.</div></td></tr>`;
    return;
  }

  data.forEach((scan) => {
    const row = document.createElement("tr");
    row.title = "Open full report";
    row.innerHTML = `
      <td class="h-name">${esc(scan.name)}</td>
      <td class="h-ts">${esc(new Date(scan.timestamp).toLocaleString())}</td>
      <td><span class="h-num" style="font-weight:700">${scan.score}</span>
          <span class="badge grade-${esc(scan.grade)}">${esc(scan.grade)}</span></td>
      <td class="h-num">${scan.total_findings} <span class="muted">(${scan.files_scanned} files)</span></td>
      <td><span class="sev-dots">
        <span class="c">C ${scan.critical}</span><span class="h">H ${scan.high}</span><span class="m">M ${scan.medium}</span><span class="l">L ${scan.low}</span>
      </span></td>`;
    row.addEventListener("click", () => {
      window.location.href = `scan.html?id=${encodeURIComponent(scan.id)}`;
    });
    tableBody.appendChild(row);
  });
});
