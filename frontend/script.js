// Elements
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const uploadMsg = document.getElementById("uploadMsg");
const historyList = document.getElementById("historyList");
const resultsList = document.getElementById("resultsList");
const progressBar = document.getElementById("progressBar");

// Upload & Scan
uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
        uploadMsg.textContent = "Please select a ZIP file!";
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    progressBar.style.width = "0%";
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 90) clearInterval(interval);
        progressBar.style.width = `${Math.min(progress, 90)}%`;
    }, 300);

    try {
        const res = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        uploadMsg.textContent = data.message || "Scan complete!";
        progressBar.style.width = "100%";

        if (data.results) displayResults(data.results);
        loadHistory();
    } catch (err) {
        uploadMsg.textContent = "Upload failed!";
        console.error(err);
    }
});

// Display scan results
function displayResults(results) {
    resultsList.innerHTML = "";
    results.forEach(r => {
        const div = document.createElement("div");
        div.classList.add("result-card");
        div.innerHTML = `
            <strong>${r.vulnerability || "Vulnerability"}</strong><br>
            Severity: ${r.severity || "N/A"}<br>
            File: ${r.file || "Unknown"}
        `;
        resultsList.appendChild(div);
    });
}

// Load scan history
async function loadHistory() {
    try {
        const res = await fetch("http://127.0.0.1:5000/history");
        const history = await res.json();
        historyList.innerHTML = "";
        history.forEach(h => {
            const div = document.createElement("div");
            div.classList.add("history-card");
            div.innerHTML = `
                <strong>${h.timestamp}</strong><br>
                ${h.source} → ${h.target}<br>
                <em>${h.results_count} results</em>
            `;
            historyList.appendChild(div);
        });
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

// Load history on page load
loadHistory();

/* Particle Background */
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const particlesArray = [];
for (let i = 0; i < 150; i++) particlesArray.push(new Particle());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
