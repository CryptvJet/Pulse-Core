// Basic pulse simulation grid
// Each cell toggles between 0 and 1.
// Folding logic will hook into update() using the foldSlider value.
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const tickSpeedSlider = document.getElementById('tickSpeedSlider');
const foldSlider = document.getElementById('foldSlider');
const foldValueSpan = document.getElementById('foldValue');
const zoomSlider = document.getElementById('zoomSlider');
const toolSelect = document.getElementById('toolSelect');
const pulseLengthInput = document.getElementById('pulseLength');
const savePatternBtn = document.getElementById('savePatternBtn');
const patternSelect = document.getElementById('patternSelect');
const pulseLengthLabel = document.getElementById('pulseLengthLabel');
const patternLabel = document.getElementById('patternLabel');
const colorPicker = document.getElementById('colorPicker');
const pulseCounterSpan = document.getElementById('pulseCounter');
const reverseBtn = document.getElementById('reverseBtn');
const neighborSlider = document.getElementById('neighborSlider');
const neighborValueSpan = document.getElementById('neighborValue');
const debugCheckbox = document.getElementById('debugOverlay');
let currentColor = colorPicker.value;

let cellSize = parseInt(zoomSlider.value);
let rows;
let cols;
let sim;
let running = false;
let intervalId = null;
let tool = 'brush';
let pulses = [];
let patterns = [];
let pulseCounter = 0;
let reverse = false;
const MAX_HISTORY = 200;
let neighborThreshold = parseInt(neighborSlider.value);
let debugOverlay = false;
let flickerPhase = false;

function updateDimensions() {
    cellSize = parseInt(zoomSlider.value);
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
}

// Resize the canvas without recreating the grid
function updateCanvasSize() {
    cellSize = parseInt(zoomSlider.value);
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
}

function createGrid() {
    sim = new SimulationState(rows, cols, MAX_HISTORY);
    applyColorToGrid(currentColor);
}

// Set every cell in colorGrid to the provided color
function applyColorToGrid(color) {
    if (!sim) return;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            sim.colorGrid[r][c] = color;
        }
    }
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${Math.max(cellSize - 2, 8)}px monospace`;
    ctx.textBaseline = 'top';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (sim.grid[r][c] === 1) {
                if (running) {
                    ctx.fillStyle = flickerPhase ? sim.colorGrid[r][c] : '#000';
                } else {
                    ctx.fillStyle = sim.colorGrid[r][c];
                }
            } else if (sim.foldGrid[r][c] === 1) {
                ctx.fillStyle = '#111';
            } else {
                ctx.fillStyle = '#222';
            }
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);

            if (debugOverlay) {
                const n = sim.getNeighborsSum(r, c);
                ctx.fillStyle = 'white';
                const disp = neighborThreshold === 0 ? sim.grid[r][c] : n;
                ctx.fillText(disp, c * cellSize + 2, r * cellSize + 2);
            }
        }
    }
}


// Update all cells based on the neighbor threshold
// Future folding mechanics can modify the grid here using foldSlider.value

function update() {
    flickerPhase = !flickerPhase;
    const foldThreshold = parseInt(foldSlider.value);
    if (reverse) {
        sim.reverse();
        if (pulseCounter > 0) pulseCounter--;
    } else {
        pulses = sim.tick(neighborThreshold, foldThreshold, pulses);
        pulseCounter++;
    }
    drawGrid();
    pulseCounterSpan.textContent = pulseCounter;
}

function applyTool(r, c) {
    if (tool === 'brush') {
        sim.updateCellState(r, c, 1, currentColor);
        flickerPhase = true;
    } else if (tool === 'eraser') {
        sim.updateCellState(r, c, 0);
    } else if (tool === 'pulse') {
        const len = parseInt(pulseLengthInput.value) || 1;
        pulses.push({ r, c, remaining: len * 2, color: currentColor });
        sim.updateCellState(r, c, 1, currentColor);
    } else if (tool === 'stamper') {
        const pattern = patterns.find(p => p.name === patternSelect.value);
        if (pattern) {
            pattern.cells.forEach(([dr, dc]) => {
                const nr = (r + dr + rows) % rows;
                const nc = (c + dc + cols) % cols;
                sim.updateCellState(nr, nc, 1, currentColor);
            });
        }
    }
    drawGrid();
}
// UI handlers

let isDrawing = false;

function getCellFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    return { r, c };
}

function toggleCell(event) {
    const { r, c } = getCellFromEvent(event);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        applyTool(r, c);
    }
}

function startDrawing(event) {
    isDrawing = true;
    toggleCell(event);
}

function drawIfNeeded(event) {
    if (!isDrawing) return;
    toggleCell(event);
}

function stopDrawing() {
    isDrawing = false;
}

function start() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    const speed = parseInt(tickSpeedSlider.value);
    intervalId = setInterval(update, speed);
}

function stop() {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearInterval(intervalId);
}

function clearGrid() {
    stop();
    createGrid();
    pulses = [];
    pulseCounter = 0;
    pulseCounterSpan.textContent = pulseCounter;
    drawGrid();
}

function saveCurrentPattern() {
    const pattern = sim.exportPattern();
    if (!pattern) return;
    const name = prompt('Pattern name?');
    if (!name) return;
    patterns.push({ name, cells: pattern.cells });
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    patternSelect.appendChild(opt);
}

function init() {
    updateDimensions();
    createGrid();
    drawGrid();
    pulseLengthLabel.style.display = 'none';
    patternLabel.style.display = 'none';
    pulseCounterSpan.textContent = pulseCounter;
    reverseBtn.textContent = 'Reverse';
    neighborThreshold = parseInt(neighborSlider.value);
    neighborValueSpan.textContent = neighborSlider.value;
    foldValueSpan.textContent = foldSlider.value;
    debugOverlay = debugCheckbox.checked;
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

toolSelect.addEventListener('change', () => {
    tool = toolSelect.value;
    pulseLengthLabel.style.display = tool === 'pulse' ? 'block' : 'none';
    patternLabel.style.display = tool === 'stamper' ? 'block' : 'none';
});

savePatternBtn.addEventListener('click', saveCurrentPattern);

colorPicker.addEventListener('input', () => {
    currentColor = colorPicker.value;
    applyColorToGrid(currentColor);
    drawGrid();
});

neighborSlider.addEventListener('input', () => {
    neighborThreshold = parseInt(neighborSlider.value);
    neighborValueSpan.textContent = neighborSlider.value;
});

foldSlider.addEventListener('input', () => {
    foldValueSpan.textContent = foldSlider.value;
});

tickSpeedSlider.addEventListener('input', () => {
    if (running) {
        clearInterval(intervalId);
        const speed = parseInt(tickSpeedSlider.value);
        intervalId = setInterval(update, speed);
    }
});

debugCheckbox.addEventListener('change', () => {
    debugOverlay = debugCheckbox.checked;
    drawGrid();
});

reverseBtn.addEventListener('click', () => {
    reverse = !reverse;
    reverseBtn.textContent = reverse ? 'Forward' : 'Reverse';
});

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', drawIfNeeded);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
clearBtn.addEventListener('click', clearGrid);

init();
// Additional hooks for pulse direction and substrate density will be added later.
