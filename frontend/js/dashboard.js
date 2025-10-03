window.addEventListener('DOMContentLoaded', async () => {
    const barCtx = document.getElementById('barChart').getContext('2d');
    const pieCtx = document.getElementById('pieChart').getContext('2d');

    const response = await fetch('http://127.0.0.1:5000/dashboard-data');
    const data = await response.json();

    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Threats Found',
                data: data.threats,
                backgroundColor: '#0ff'
            }]
        }
    });

    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Safe', 'Infected'],
            datasets: [{
                data: [data.safe, data.infected],
                backgroundColor: ['#0f0', '#f00']
            }]
        }
    });
});
