// Cyber Scanner — dashboard analytics.
// Same-origin API by default; override with window.CYBER_SCANNER_API_BASE.
const API_BASE = (window.CYBER_SCANNER_API_BASE || window.location.origin).replace(/\/$/, "");

const CHART_COLORS = {
  Critical: "#ff5470",
  High: "#fb923c",
  Medium: "#fbbf24",
  Low: "#22d3ee",
};
const TICK = { color: "#6b8296", font: { family: "JetBrains Mono, monospace", size: 10 } };
const GRID = { color: "rgba(27,43,58,0.7)" };

window.addEventListener("DOMContentLoaded", async () => {
  let data;
  try {
    const res = await fetch(`${API_BASE}/dashboard-data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    document.getElementById("dash-error").innerHTML =
      `<div class="error-box">[!] Could not load dashboard data: ${err.message}</div>`;
    return;
  }

  if (!data.total_scans) {
    document.getElementById("dash-empty").style.display = "";
    return;
  }
  document.getElementById("stat-grid").style.display = "";
  document.getElementById("chart-grid").style.display = "";

  // stat cards
  document.getElementById("st-scans").textContent = data.total_scans;
  document.getElementById("st-avgscore").textContent = data.avg_score;
  const sev = data.severity_totals;
  for (const k of ["critical", "high", "medium", "low"]) {
    document.getElementById("st-" + k).textContent = sev[k[0].toUpperCase() + k.slice(1)];
  }

  // severity doughnut
  new Chart(document.getElementById("sevChart"), {
    type: "doughnut",
    data: {
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [{
        data: [sev.Critical, sev.High, sev.Medium, sev.Low],
        backgroundColor: [CHART_COLORS.Critical, CHART_COLORS.High, CHART_COLORS.Medium, CHART_COLORS.Low],
        borderColor: "#0a121b",
        borderWidth: 3,
      }],
    },
    options: {
      plugins: { legend: { labels: { color: "#d7e3ec", font: { family: "JetBrains Mono, monospace", size: 11 } } } },
      cutout: "62%",
    },
  });

  // score trend line
  const trend = data.score_trend;
  new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: trend.map((t) => `#${t.id}`),
      datasets: [{
        label: "Security score",
        data: trend.map((t) => t.score),
        borderColor: "#00ff88",
        backgroundColor: "rgba(0,255,136,0.12)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#00ff88",
        pointRadius: 4,
      }],
    },
    options: {
      scales: {
        x: { ticks: TICK, grid: GRID, title: { display: true, text: "scan", color: "#42566a", font: { size: 10 } } },
        y: { min: 0, max: 100, ticks: TICK, grid: GRID },
      },
      plugins: {
        legend: { labels: { color: "#d7e3ec", font: { family: "JetBrains Mono, monospace", size: 11 } } },
        tooltip: {
          callbacks: {
            title: (items) => { const t = trend[items[0].dataIndex]; return `${t.name} — ${new Date(t.timestamp).toLocaleString()}`; },
            label: (item) => ` score ${item.raw}/100 · grade ${trend[item.dataIndex].grade} · ${trend[item.dataIndex].findings} findings`,
          },
        },
      },
    },
  });

  // most vulnerable files
  const top = document.getElementById("top-files");
  if (!data.top_files.length) {
    top.innerHTML = `<p class="muted" style="font-family:var(--mono);font-size:0.85rem">No findings recorded — your code is clean. 🎉</p>`;
  } else {
    const max = data.top_files[0].findings;
    top.innerHTML = data.top_files.map((f) => `
      <div class="topfile-row">
        <span class="tf-name">${escapeHtml(f.file)}</span>
        <span class="tf-bar" style="width:${Math.max(8, (f.findings / max) * 220)}px"></span>
        <span class="tf-n">${f.findings}</span>
      </div>`).join("");
  }
});

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
