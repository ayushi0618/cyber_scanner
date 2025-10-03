const form = document.getElementById('upload-form');
const resultsDiv = document.getElementById('scan-results');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    resultsDiv.innerHTML = "Scanning...";

    try {
        const response = await fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        resultsDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch(err) {
        resultsDiv.innerHTML = `Error: ${err.message}`;
    }
});
