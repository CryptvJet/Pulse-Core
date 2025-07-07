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
const toolSelect = document.getElementById('toolSelect');
const pulseLengthInput = document.getElementById('pulseLength');
const savePatternBtn = document.getElementById('savePatternBtn');
const patternSelect = document.getElementById('patternSelect');
const pulseLengthLabel = document.getElementById('pulseLengthLabel');
const patternLabel = document.getElementById('patternLabel');
const colorPicker = document.getElementById('colorPicker');
const pulseCounterSpan = document.getElementById('pulseCounter');
const reverseBtn = document.getElementById('reverseBtn');
let currentColor = colorPicker.value;

let cellSize = parseInt(zoomSlider.value);
let rows;
let cols;
let grid = [];
let colorGrid = [];
let touchedGrid = [];
let running = false;
let intervalId = null;
let tool = 'brush';
let pulses = [];
let patterns = [];
let pulseCounter = 0;
let reverse = false;
let history = [];

function invertColor(hex) {
    const h = hex.replace('#', '');
    const r = 255 - parseInt(h.substring(0, 2), 16);
    const g = 255 - parseInt(h.substring(2, 4), 16);
    const b = 255 - parseInt(h.substring(4, 6), 16);
    return '#' + r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0');
}

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
    touchedGrid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        const cRow = [];
        const tRow = [];
        for (let c = 0; c < cols; c++) {
            row.push(0);
            cRow.push('#000000');
            tRow.push(false);
        }
        grid.push(row);
        colorGrid.push(cRow);
        touchedGrid.push(tRow);
    }
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let color = '#000';
            if (touchedGrid[r][c]) {
                color = grid[r][c] === 1
                    ? colorGrid[r][c]
                    : invertColor(colorGrid[r][c]);
            }
            ctx.fillStyle = color;
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
// Update the grid state each tick.
// Previously this used the placeholder "flicker rule" `((n + 1) ** 2) % 2`
// which toggled every cell between 0 and 1 every frame, causing the entire
// canvas background to flash green/black. The rule has been removed so the
// grid only changes when pulses are applied or future mechanics modify it.

function update() {
    if (reverse) {
        const prev = history.pop();
        if (prev) {
            grid = prev.grid;
            colorGrid = prev.colorGrid;
            touchedGrid = prev.touchedGrid;
            pulseCounter--;
        }
    } else {
        history.push({
            grid: JSON.parse(JSON.stringify(grid)),
            colorGrid: JSON.parse(JSON.stringify(colorGrid)),
            touchedGrid: JSON.parse(JSON.stringify(touchedGrid))
        });
        // Clone the current grid so we can apply pulses without altering
        // the original during iteration.
        const next = grid.map(row => row.slice());
        // In the old implementation every cell was recalculated here,
        // forcing a full-frame flicker. Now we only modify cells affected
        // by active pulses or future mechanics.
        pulses.forEach(p => {
            if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
                next[p.r][p.c] = p.remaining % 2;
                if (!touchedGrid[p.r][p.c]) {
                    colorGrid[p.r][p.c] = p.color;
                    touchedGrid[p.r][p.c] = true;
                }
                p.remaining--;
            }
        });
        pulses = pulses.filter(p => p.remaining > 0);
        grid = next;
        pulseCounter++;
    }
    drawGrid();
    pulseCounterSpan.textContent = pulseCounter;
}

function applyTool(r, c) {
    if (tool === 'brush') {
        grid[r][c] = 1;
        colorGrid[r][c] = currentColor;
        touchedGrid[r][c] = true;
    } else if (tool === 'eraser') {
        grid[r][c] = 0;
        colorGrid[r][c] = '#000000';
        touchedGrid[r][c] = false;
    } else if (tool === 'pulse') {
        const len = parseInt(pulseLengthInput.value) || 1;
        pulses.push({ r, c, remaining: len * 2, color: currentColor });
        colorGrid[r][c] = currentColor;
        touchedGrid[r][c] = true;
    } else if (tool === 'stamper') {
        const pattern = patterns.find(p => p.name === patternSelect.value);
        if (pattern) {
            pattern.cells.forEach(([dr, dc]) => {
                const nr = (r + dr + rows) % rows;
                const nc = (c + dc + cols) % cols;
                grid[nr][nc] = 1;
                colorGrid[nr][nc] = currentColor;
                touchedGrid[nr][nc] = true;
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
});

reverseBtn.addEventListener('click', () => {
    reverse = !reverse;
    reverseBtn.textContent = reverse ? 'Forward' : 'Reverse';
});

canvas.addEventListener('click', toggleCell);
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);

init();
// Additional hooks for pulse direction and substrate density will be added later.
