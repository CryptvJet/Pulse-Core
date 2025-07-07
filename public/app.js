// Basic pulse simulation grid
// Each cell toggles between 0 and 1.
// Folding logic will hook into update() using the foldSlider value.
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const speedSlider = document.getElementById('speedSlider');
const foldSlider = document.getElementById('foldSlider');
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
const modeSelect = document.getElementById('modeSelect');
let currentColor = colorPicker.value;

let cellSize = parseInt(zoomSlider.value);
let rows;
let cols;
let grid = [];
let colorGrid = [];
let running = false;
let intervalId = null;
let tool = 'brush';
let pulses = [];
let patterns = [];
let pulseCounter = 0;
let reverse = false;
let history = [];
let mode = 'pulse';

function updateDimensions() {
    cellSize = parseInt(zoomSlider.value);
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
}

function createGrid() {
    grid = [];
    colorGrid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        const cRow = [];
        for (let c = 0; c < cols; c++) {
            row.push(0);
            cRow.push(currentColor);
        }
        grid.push(row);
        colorGrid.push(cRow);
    }
}

// Set every cell in colorGrid to the provided color
function applyColorToGrid(color) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            colorGrid[r][c] = color;
        }
    }
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.fillStyle = grid[r][c] === 1 ? colorGrid[r][c] : '#222';
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
    if (reverse) {
        const prev = history.pop();
        if (prev) {
            grid = prev.grid;
            colorGrid = prev.colorGrid;
            pulseCounter--;
        }
    } else {
        history.push({
            grid: JSON.parse(JSON.stringify(grid)),
            colorGrid: JSON.parse(JSON.stringify(colorGrid))
        });
        let next = [];
        if (mode === 'neighbor') {
            for (let r = 0; r < rows; r++) {
                const row = [];
                for (let c = 0; c < cols; c++) {
                    const n = getNeighborsSum(r, c);
                    row.push(((n + 1) ** 2) % 2);
                }
                next.push(row);
            }
        } else {
            for (let r = 0; r < rows; r++) {
                next.push([...grid[r]]);
            }
        }
        grid = next;
        pulses.forEach(p => {
            if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
                grid[p.r][p.c] = p.remaining % 2;
                colorGrid[p.r][p.c] = p.color;
                p.remaining--;
            }
        });
        pulses = pulses.filter(p => p.remaining > 0);
        pulseCounter++;
    }
    drawGrid();
    pulseCounterSpan.textContent = pulseCounter;
}

function applyTool(r, c) {
    if (tool === 'brush') {
        grid[r][c] = 1;
        colorGrid[r][c] = currentColor;
    } else if (tool === 'eraser') {
        grid[r][c] = 0;
    } else if (tool === 'pulse') {
        const len = parseInt(pulseLengthInput.value) || 1;
        pulses.push({ r, c, remaining: len * 2, color: currentColor });
        grid[r][c] = 1; // Ensure the pulse cell is active immediately
        colorGrid[r][c] = currentColor;
    } else if (tool === 'stamper') {
        const pattern = patterns.find(p => p.name === patternSelect.value);
        if (pattern) {
            pattern.cells.forEach(([dr, dc]) => {
                const nr = (r + dr + rows) % rows;
                const nc = (c + dc + cols) % cols;
                grid[nr][nc] = 1;
                colorGrid[nr][nc] = currentColor;
            });
        }
    }
    drawGrid();
}
// UI handlers

function toggleCell(event) {
    if (running) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        applyTool(r, c);
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

function clearGrid() {
    stop();
    createGrid();
    pulses = [];
    history = [];
    pulseCounter = 0;
    pulseCounterSpan.textContent = pulseCounter;
    drawGrid();
}

function saveCurrentPattern() {
    const cells = [];
    let minR = rows, minC = cols;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                cells.push([r, c]);
                if (r < minR) minR = r;
                if (c < minC) minC = c;
            }
        }
    }
    if (cells.length === 0) return;
    const name = prompt('Pattern name?');
    if (!name) return;
    const rel = cells.map(([r, c]) => [r - minR, c - minC]);
    patterns.push({ name, cells: rel });
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
    mode = modeSelect.value;
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

modeSelect.addEventListener('change', () => {
    mode = modeSelect.value;
});

reverseBtn.addEventListener('click', () => {
    reverse = !reverse;
    reverseBtn.textContent = reverse ? 'Forward' : 'Reverse';
});

canvas.addEventListener('click', toggleCell);
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
clearBtn.addEventListener('click', clearGrid);

init();
// Additional hooks for pulse direction and substrate density will be added later.
