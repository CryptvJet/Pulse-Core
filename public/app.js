// Basic pulse simulation grid
// Each cell toggles between 0 and 1.
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSlider = document.getElementById('speedSlider');
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
const modeToggleBtn = document.getElementById('modeToggleBtn');
const modeIndicator = document.getElementById('modeIndicator');
let currentMode = 'color';
let currentColor = colorPicker.value;

let cellSize = parseInt(zoomSlider.value);
let rows;
let cols;
let grid = [];
let colorGrid = [];
let touchedGrid = [];
let running = false;
let intervalId = null;

function updateInterval() {
    if (running) {
        clearInterval(intervalId);
        const speed = parseInt(speedSlider.value);
        intervalId = setInterval(update, speed);
    }
}
let tool = 'brush';
let pulses = [];
let patterns = [];
let pulseCounter = 0;
let reverse = false;
let history = [];
const HISTORY_LIMIT = 100;

function invertColor(hex) {
    const h = hex.replace('#', '');
    const r = 255 - parseInt(h.substring(0, 2), 16);
    const g = 255 - parseInt(h.substring(2, 4), 16);
    const b = 255 - parseInt(h.substring(4, 6), 16);
    return '#' + r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0');
}

function blendColors(a, colorB) {
    const ca = parseInt(a.slice(1), 16);
    const cb = parseInt(colorB.slice(1), 16);
    const ra = (ca >> 16) & 0xff;
    const ga = (ca >> 8) & 0xff;
    const ba = ca & 0xff;
    const rb = (cb >> 16) & 0xff;
    const gb = (cb >> 8) & 0xff;
    const bb = cb & 0xff;
    const r = Math.floor((ra + rb) / 2);
    const g = Math.floor((ga + gb) / 2);
    const bVal = Math.floor((ba + bb) / 2);
    return '#' + r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        bVal.toString(16).padStart(2, '0');
}

function getNeighbors(stateGrid, colorGrid, r, c) {
    const cells = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = (r + dr + rows) % rows;
            const nc = (c + dc + cols) % cols;
            cells.push({ state: stateGrid[nr][nc], color: colorGrid[nr][nc] });
        }
    }
    return cells;
}

function getNextCellState(current, neighbors) {
    const counts = {};
    neighbors.forEach(cell => {
        if (cell.state > 0) {
            counts[cell.color] = (counts[cell.color] || 0) + 1;
        }
    });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (dominant.length === 0) {
        return { state: 0, color: '#000000' };
    }
    const [topColor, count] = dominant[0];
    if (count > 3) {
        return { state: 1, color: topColor };
    }
    if (dominant.length > 1 && dominant[0][1] === dominant[1][1]) {
        return { state: 1, color: blendColors(dominant[0][0], dominant[1][0]) };
    }
    return current.state > 0 ? { state: 1, color: current.color } : { state: 0, color: '#000000' };
}

function updateDimensions() {
    cellSize = parseInt(zoomSlider.value);
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
}

function create2DArray(r, c, initial) {
    const arr = [];
    for (let i = 0; i < r; i++) {
        const row = [];
        for (let j = 0; j < c; j++) {
            row.push(initial);
        }
        arr.push(row);
    }
    return arr;
}

function createGrid() {
    grid = create2DArray(rows, cols, 0);
    colorGrid = create2DArray(rows, cols, '#000000');
    touchedGrid = create2DArray(rows, cols, false);
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let color;
            if (currentMode === 'color') {
                color = grid[r][c] === 1 ? colorGrid[r][c] : '#000000';
            } else {
                color = grid[r][c] === 1 ? '#ffffff' : '#000000';
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
        }
    }
}

// Update the grid state each tick.
// Previously this used the placeholder "flicker rule" `((n + 1) ** 2) % 2`
// which toggled every cell between 0 and 1 every frame, causing the entire
// canvas background to flash green/black. The rule has been removed so the
// grid only changes when pulses are applied or future mechanics modify it.

function updateColor() {
    if (reverse) {
        const prev = history.pop();
        if (prev) {
            grid = prev.grid;
            colorGrid = prev.colorGrid;
            pulses = prev.pulses;
            pulseCounter--;
        }
    } else {
        history.push({
            grid: JSON.parse(JSON.stringify(grid)),
            colorGrid: JSON.parse(JSON.stringify(colorGrid)),
            pulses: JSON.parse(JSON.stringify(pulses))
        });
        if (history.length > HISTORY_LIMIT) {
            history.shift();
        }
        // Clone the current grid so we can apply pulses without altering
        // the original during iteration.
        const next = grid.map(row => row.slice());
        const nextColors = colorGrid.map(row => row.slice());
        const pulsed = new Set();
        // In the old implementation every cell was recalculated here,
        // forcing a full-frame flicker. Now we only modify cells affected
        // by active pulses or future mechanics.
        pulses.forEach(p => {
            if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
                next[p.r][p.c] = p.remaining % 2;
                nextColors[p.r][p.c] = p.color;
                pulsed.add(p.r + ',' + p.c);
                p.remaining--;
                if (p.remaining <= 0) {
                    next[p.r][p.c] = 0;
                    nextColors[p.r][p.c] = '#000000';
                }
            }
        });
        // Apply neighbor-based color evolution
        const evolvedGrid = next.map(row => row.slice());
        const evolvedColors = nextColors.map(row => row.slice());
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (pulsed.has(r + ',' + c)) continue;
                const neighbors = getNeighbors(next, nextColors, r, c);
                const { state, color } = getNextCellState({ state: next[r][c], color: nextColors[r][c] }, neighbors);
                evolvedGrid[r][c] = state;
                evolvedColors[r][c] = color;
            }
        }
        pulses = pulses.filter(p => p.remaining > 0);
        grid = evolvedGrid;
        colorGrid = evolvedColors;
        pulseCounter++;
    }
    drawGrid();
    pulseCounterSpan.textContent = pulseCounter;
}

function updateBinary() {
    const next = create2DArray(rows, cols, 0);
    const pulsed = new Set();
    pulses.forEach(p => {
        if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
            next[p.r][p.c] = p.remaining % 2;
            pulsed.add(p.r + ',' + p.c);
            p.remaining--;
        }
    });
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!pulsed.has(r + ',' + c)) {
                next[r][c] = touchedGrid[r][c] ? 1 - grid[r][c] : grid[r][c];
            }
        }
    }
    pulses = pulses.filter(p => p.remaining > 0);
    grid = next;
    pulseCounter++;
    drawGrid();
    pulseCounterSpan.textContent = pulseCounter;
}

function update() {
    if (currentMode === 'color') {
        updateColor();
    } else {
        updateBinary();
    }
}

function applyTool(r, c) {
    if (tool === 'brush') {
        grid[r][c] = 1;
        colorGrid[r][c] = currentMode === 'color' ? currentColor : '#ffffff';
        touchedGrid[r][c] = true;
    } else if (tool === 'eraser') {
        grid[r][c] = 0;
        colorGrid[r][c] = '#000000';
        touchedGrid[r][c] = true;
    } else if (tool === 'pulse') {
        const len = parseInt(pulseLengthInput.value) || 1;
        grid[r][c] = 1;                 // start active
        const color = currentMode === 'color' ? currentColor : '#ffffff';
        colorGrid[r][c] = color; // display chosen color
        pulses.push({ r, c, remaining: len * 2 - 1, color });
        touchedGrid[r][c] = true;
    } else if (tool === 'stamper') {
        const pattern = patterns.find(p => p.name === patternSelect.value);
        if (pattern) {
            pattern.cells.forEach(([dr, dc]) => {
                const nr = (r + dr + rows) % rows;
                const nc = (c + dc + cols) % cols;
                grid[nr][nc] = 1;
                colorGrid[nr][nc] = currentMode === 'color' ? currentColor : '#ffffff';
                touchedGrid[nr][nc] = true;
            });
        }
    }
    drawGrid();
}
// UI handlers

function toggleCell(event) {
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
    updateInterval();
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
    modeIndicator.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    modeIndicator.className = currentMode === 'color' ? 'mode-color' : 'mode-binary';
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

speedSlider.addEventListener('input', updateInterval);

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

modeToggleBtn.addEventListener('click', () => {
    currentMode = currentMode === 'color' ? 'binary' : 'color';
    modeIndicator.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    modeIndicator.className = currentMode === 'color' ? 'mode-color' : 'mode-binary';
    drawGrid();
});

canvas.addEventListener('click', toggleCell);
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);

init();
// Additional hooks for pulse direction and substrate density will be added later.
