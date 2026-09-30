// API base: same origin as the served UI by default (Flask serves the
// frontend and the API from one origin). Override with
// window.CYBER_SCANNER_API_BASE when the UI is hosted separately.
const API_BASE = (window.CYBER_SCANNER_API_BASE || window.location.origin).replace(/\/$/, "");

window.addEventListener('DOMContentLoaded', async () => {
    const barCtx = document.getElementById('barChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');

    let data;
    try {
        const response = await fetch(`${API_BASE}/dashboard-data`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (err) {
        document.querySelector('.dashboard').insertAdjacentHTML(
            'beforeend',
            `<p class="error">Could not load dashboard data: ${err.message}</p>`
        );
        return;
    }

    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Threats Found',
                data: data.threats,
                backgroundColor: '#22d3ee',
                borderRadius: 6
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#cbd5e1' } } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }
            }
        }
    });

    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Safe', 'Infected'],
            datasets: [{
                data: [data.safe, data.infected],
                backgroundColor: ['#34d399', '#f87171'],
                borderColor: '#0f172a',
                borderWidth: 2
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#cbd5e1' } } }
        }
    });
});
