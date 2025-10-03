window.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#history-table tbody');

    const response = await fetch('http://127.0.0.1:5000/history');
    const data = await response.json();

    data.forEach(scan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${scan.name}</td>
            <td>${scan.timestamp}</td>
            <td>${scan.status}</td>
        `;
        tableBody.appendChild(row);
    });
});
