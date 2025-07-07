// Basic pulse simulation grid
// Each cell toggles between 0 and 1.
// Folding logic will hook into update() using the foldSlider value.
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSlider = document.getElementById('speedSlider');
const foldSlider = document.getElementById('foldSlider');
const zoomSlider = document.getElementById('zoomSlider');

let cellSize = parseInt(zoomSlider.value);
let rows;
let cols;
let grid = [];
let running = false;
let intervalId = null;

function updateDimensions() {
    cellSize = parseInt(zoomSlider.value);
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
}

function createGrid() {
    grid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(0);
        }
        grid.push(row);
    }
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.fillStyle = grid[r][c] === 1 ? 'green' : '#222';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
        }
    }
}

function getNeighborsSum(r, c) {
    let sum = grid[r][c];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = (r + dr + rows) % rows;
            const nc = (c + dc + cols) % cols;
            sum += grid[nr][nc];
        }
    }
    return sum;
}
// Update all cells based on the flicker rule f(n) = (n + 1)^2 % 2
// Future folding mechanics can modify the grid here using foldSlider.value

function update() {
    const next = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const n = getNeighborsSum(r, c);
            row.push(((n + 1) ** 2) % 2);
        }
        next.push(row);
    }
    grid = next;
    drawGrid();
}
// UI handlers

function toggleCell(event) {
    if (running) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = grid[r][c] === 1 ? 0 : 1;
        drawGrid();
    }
}

function start() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    const speed = parseInt(speedSlider.value);
    intervalId = setInterval(update, speed);
}

function stop() {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearInterval(intervalId);
}

function init() {
    updateDimensions();
    createGrid();
    drawGrid();
}

window.addEventListener('resize', () => {
    updateDimensions();
    createGrid();
    drawGrid();
});

zoomSlider.addEventListener('input', () => {
    updateDimensions();
    createGrid();
    drawGrid();
});

canvas.addEventListener('click', toggleCell);
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);

init();
// Additional hooks for pulse direction and substrate density will be added later.
