// Cyber Scanner — scan page logic.
// Same-origin API by default; override with window.CYBER_SCANNER_API_BASE.
const API_BASE = (window.CYBER_SCANNER_API_BASE || window.location.origin).replace(/\/$/, "");

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const fileNameEl = document.getElementById("file-name");
const scanBtn = document.getElementById("scan-btn");
const dropzone = document.getElementById("dropzone");
const resultsDiv = document.getElementById("scan-results");

let activeFilters = new Set(["Critical", "High", "Medium", "Low"]);
let lastReport = null;

const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

// ---------- file input / drag & drop ----------
fileInput.addEventListener("change", () => {
  fileNameEl.textContent = fileInput.files[0] ? "▸ " + fileInput.files[0].name : "";
});
["dragover", "dragenter"].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault(); dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault(); dropzone.classList.remove("dragover");
}));
dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (f) {
    fileInput.files = e.dataTransfer.files;
    fileNameEl.textContent = "▸ " + f.name;
  }
});

// ---------- score ring ----------
function scoreColor(score) {
  return score >= 90 ? "#00ff88" : score >= 80 ? "#22d3ee" : score >= 70 ? "#fbbf24"
    : score >= 60 ? "#fb923c" : "#ff5470";
}
function scoreRing(score, grade) {
  const c = scoreColor(score);
  const r = 54, circ = 2 * Math.PI * r;
  const off = circ - (circ * score) / 100;
  return `
    <div class="score-ring">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r="${r}" fill="none" stroke="#1b2b3a" stroke-width="10"/>
        <circle cx="66" cy="66" r="${r}" fill="none" stroke="${c}" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}"
          stroke-dashoffset="${off.toFixed(1)}"
          style="filter: drop-shadow(0 0 6px ${c}); transition: stroke-dashoffset 1s ease;"/>
      </svg>
      <div class="score-num"><span class="v" style="color:${c}">${score}</span><span class="g">GRADE ${esc(grade)}</span></div>
    </div>`;
}

// ---------- report rendering ----------
function findingCard(f) {
  return `
    <div class="finding sev-${f.severity}" data-sev="${f.severity}">
      <div class="finding-head" onclick="this.parentElement.classList.toggle('open')">
        <span class="badge sev-${f.severity}">${esc(f.severity)}</span>
        <span class="f-name">${esc(f.vulnerability)}</span>
        <span class="f-loc">${esc(f.file)}:${f.line}</span>
      </div>
      <div class="finding-body">
        <pre>${esc(f.snippet)}</pre>
        <p class="remediation"><strong>FIX →</strong><br>${esc(f.remediation)}</p>
      </div>
    </div>`;
}

function renderReport(report) {
  lastReport = report;
  const s = report.summary;
  const sevCounts = ["Critical", "High", "Medium", "Low"]
    .map((sev) => `
      <button class="sev-pill ${activeFilters.has(sev) ? "" : "off"}" data-sev="${sev}"
              onclick="toggleFilter('${sev}')" title="Toggle ${sev} findings">
        ${sev.toUpperCase()} · ${s[sev]}
      </button>`).join("");

  const filesHtml = report.results.map((r) => {
    if (!r.findings.length) {
      return `
        <div class="file-group">
          <div class="file-bar"><span class="badge status-clean">CLEAN</span>
            <span class="fpath">${esc(r.file)}</span></div>
        </div>`;
    }
    const top = r.findings.slice().sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])[0];
    const cards = r.findings
      .slice()
      .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.line - b.line)
      .map(findingCard).join("");
    return `
      <div class="file-group" data-file="${esc(r.file)}">
        <div class="file-bar" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? '' : 'none'">
          <span class="badge status-${r.status}">${esc(r.status).toUpperCase()}</span>
          <span class="fpath">${esc(r.file)}</span>
          <span class="count">${r.findings.length} finding${r.findings.length === 1 ? "" : "s"} · top: ${esc(top.severity)}</span>
        </div>
        <div class="file-findings">${cards}</div>
      </div>`;
  }).join("");

  resultsDiv.innerHTML = `
    <div class="panel">
      <div class="scan-head">
        ${scoreRing(report.score, report.grade)}
        <div class="scan-meta">
          <div class="fname">▸ ${esc(report.filename || "scan")}</div>
          <div>${report.timestamp ? esc(new Date(report.timestamp).toLocaleString()) : ""}</div>
          <div>${s.files_scanned} files analyzed · ${s.total_findings} findings</div>
        </div>
        <span class="badge grade-${esc(report.grade)}" style="font-size:0.9rem">GRADE ${esc(report.grade)}</span>
      </div>
      <div class="sev-summary">${sevCounts}</div>
      <div class="scan-actions">
        <button class="btn-ghost btn-sm" onclick="downloadReport()">⬇ Export JSON report</button>
        <button class="btn-ghost btn-sm" onclick="expandAll(true)">Expand all</button>
        <button class="btn-ghost btn-sm" onclick="expandAll(false)">Collapse all</button>
      </div>
    </div>
    <div id="findings-list">
      ${s.total_findings ? filesHtml : `<div class="panel"><div class="empty-state"><span class="big">✅</span>No vulnerabilities found. Ship it.</div></div>`}
    </div>`;
  applyFilters();
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.toggleFilter = (sev) => {
  activeFilters.has(sev) ? activeFilters.delete(sev) : activeFilters.add(sev);
  document.querySelectorAll(`.sev-pill[data-sev="${sev}"]`).forEach((el) => el.classList.toggle("off"));
  applyFilters();
};

function applyFilters() {
  document.querySelectorAll("#findings-list .finding").forEach((el) => {
    el.style.display = activeFilters.has(el.dataset.sev) ? "" : "none";
  });
  // hide file groups with no visible findings
  document.querySelectorAll("#findings-list .file-group").forEach((g) => {
    const anyVisible = [...g.querySelectorAll(".finding")].some((el) => el.style.display !== "none");
    const hasClean = g.querySelector(".badge.status-clean");
    g.style.display = (anyVisible || hasClean) ? "" : "none";
  });
}

window.expandAll = (open) => {
  document.querySelectorAll("#findings-list .finding").forEach((el) =>
    el.classList.toggle("open", open));
};

window.downloadReport = () => {
  if (!lastReport) return;
  const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cyber-scanner-report-${lastReport.scan_id || "scan"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

// ---------- submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput.files[0]) return;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  scanBtn.disabled = true;
  resultsDiv.innerHTML = `
    <div class="terminal"><div class="term-bar">
      <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <span class="term-title">scanner — analyzing ${esc(fileInput.files[0].name)}</span>
    </div><div class="term-body scanning-line">[+] extracting archive<span class="dots"></span>
[+] running detection rules<span class="dots"></span></div></div>`;

  try {
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    activeFilters = new Set(["Critical", "High", "Medium", "Low"]);
    renderReport(data);
  } catch (err) {
    resultsDiv.innerHTML = `<div class="error-box">[!] Scan failed: ${esc(err.message)}</div>`;
  } finally {
    scanBtn.disabled = false;
  }
});

// Deep link: scan.html?id=<scan_id> renders a historic scan (from History drill-down).
(async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;
  resultsDiv.innerHTML = `<div class="terminal"><div class="term-body scanning-line">[+] loading scan #${esc(id)}<span class="dots"></span></div></div>`;
  try {
    const res = await fetch(`${API_BASE}/scan/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    activeFilters = new Set(["Critical", "High", "Medium", "Low"]);
    renderReport(data);
  } catch (err) {
    resultsDiv.innerHTML = `<div class="error-box">[!] Could not load scan: ${esc(err.message)}</div>`;
  }
})();
