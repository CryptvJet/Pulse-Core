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
const foldValueSpan = document.getElementById('foldValue');
const zoomSlider = document.getElementById('zoomSlider');
const toolSelect = document.getElementById('toolSelect');
const pulseLengthInput = document.getElementById('pulseLength');
const patternSelect = document.getElementById('patternSelect');
const pulseLengthLabel = document.getElementById('pulseLengthLabel');
const patternLabel = document.getElementById('patternLabel');
const colorPicker = document.getElementById('colorPicker');
const pulseCounterSpan = document.getElementById('pulseCounter');
const reverseBtn = document.getElementById('reverseBtn');
const neighborSlider = document.getElementById('neighborSlider');
const neighborValueSpan = document.getElementById('neighborValue');
const debugCheckbox = document.getElementById('debugOverlay');
const patternDetectCheckbox = document.getElementById('patternDetect');
const pulseFlashCheckbox = document.getElementById('pulseFlash');
let currentColor = colorPicker.value;

let cellSize = parseInt(zoomSlider.value);
let rows;
let cols;
let grid = [];
let colorGrid = [];
let residueGrid = [];
let foldGrid = [];
let flickerCountGrid = [];
let lastStateGrid = [];
let running = false;
let intervalId = null;
let tool = 'brush';
let pulses = [];
let patterns = [];
let knownPatterns = {};
let pulseCounter = 0;
let reverse = false;
let history = [];
const MAX_HISTORY = 200;
let neighborThreshold = parseInt(neighborSlider.value);
let debugOverlay = false;
// Maximum row/column count before zoom is restricted. Increase at your own risk
const MAX_DIMENSION = 500;
const PATTERN_CHECK_INTERVAL = 5;
const PATTERN_CELL_THRESHOLD = 100000;
let patternDetectionEnabled = true;
let pulseFlash = true;

function updateDimensions() {
    cellSize = parseInt(zoomSlider.value);
    cols = Math.floor(window.innerWidth / cellSize);
    rows = Math.floor(window.innerHeight / cellSize);

    if (cols > MAX_DIMENSION || rows > MAX_DIMENSION) {
        const newSize = Math.ceil(Math.max(window.innerWidth, window.innerHeight) / MAX_DIMENSION);
        cellSize = newSize;
        zoomSlider.value = newSize;
        cols = Math.floor(window.innerWidth / cellSize);
        rows = Math.floor(window.innerHeight / cellSize);
    }

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
}

// Resize the canvas without recreating the grid
function updateCanvasSize() {
    cellSize = parseInt(zoomSlider.value);
    if (cols > MAX_DIMENSION || rows > MAX_DIMENSION) {
        const newSize = Math.ceil(Math.max(window.innerWidth, window.innerHeight) / MAX_DIMENSION);
        cellSize = newSize;
        zoomSlider.value = newSize;
    }
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
}

function createGrid() {
    grid = [];
    colorGrid = [];
    residueGrid = [];
    foldGrid = [];
    flickerCountGrid = [];
    lastStateGrid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        const cRow = [];
        const resRow = [];
        const foldRow = [];
        const flickerRow = [];
        const lastRow = [];
        for (let c = 0; c < cols; c++) {
            row.push(0);
            cRow.push(currentColor);
            resRow.push(0);
            foldRow.push(0);
            flickerRow.push(0);
            lastRow.push(0);
        }
        grid.push(row);
        colorGrid.push(cRow);
        residueGrid.push(resRow);
        foldGrid.push(foldRow);
        flickerCountGrid.push(flickerRow);
        lastStateGrid.push(lastRow);
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
    ctx.font = `${Math.max(cellSize - 2, 8)}px monospace`;
    ctx.textBaseline = 'top';
    const drawSize = Math.max(cellSize - 1, 1);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                if (running && pulseFlash && flickerCountGrid[r][c] > 0) {
                    ctx.fillStyle = '#000';
                } else {
                    ctx.fillStyle = colorGrid[r][c];
                }
            } else if (foldGrid[r][c] === 1) {
                ctx.fillStyle = '#111';
            } else {
                ctx.fillStyle = '#222';
            }
            ctx.fillRect(c * cellSize, r * cellSize, drawSize, drawSize);

            if (debugOverlay) {
                const n = getNeighborsSum(r, c);
                ctx.fillStyle = 'white';
                const disp = neighborThreshold === 0 ? grid[r][c] : n;
                ctx.fillText(disp, c * cellSize + 2, r * cellSize + 2);
            }
        }
    }
}

// Return the total of all eight neighbors around (r, c)
function getNeighborsSum(r, c) {
    let sum = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; // skip the cell itself
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                sum += grid[nr][nc];
            }
        }
    }
    return sum;
}

// Update a single cell and return its new value and fold state
function updateCellState(r, c, n, foldThreshold) {
    let val = grid[r][c];
    let folded = false;

    if (foldThreshold > 0 && flickerCountGrid[r][c] >= foldThreshold) {
        val = 0;
        folded = true;
        flickerCountGrid[r][c] = 0;
    } else {
        if (neighborThreshold === 0) {
            val = grid[r][c] ? 0 : 1;
        } else {
            val = n === neighborThreshold ? 1 : 0;
        }

        if (residueGrid[r][c] > 0) {
            val = 1;
            residueGrid[r][c]--;
        }

        if (foldThreshold > 0 && n > foldThreshold) {
            val = 0;
            folded = true;
            flickerCountGrid[r][c] = 0;
        }

        if (!folded) {
            if (val !== lastStateGrid[r][c]) {
                flickerCountGrid[r][c] += 1;
            } else {
                flickerCountGrid[r][c] = 0;
            }
        }
    }

    lastStateGrid[r][c] = val;
    return { val, folded };
}
// Update all cells based on the neighbor threshold
// Future folding mechanics can modify the grid here using foldSlider.value

function update() {
    const foldThreshold = parseInt(foldSlider.value);
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
        if (history.length > MAX_HISTORY) {
            history.shift();
        }
        let next = [];
        let nextFold = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            const foldRow = [];
            for (let c = 0; c < cols; c++) {
                const n = getNeighborsSum(r, c);
                const { val, folded } = updateCellState(r, c, n, foldThreshold);

                if (debugOverlay) {
                    console.log('threshold', neighborThreshold, 'row', r, 'col', c, 'n', n, 'val', val);
                }

                row.push(val);
                foldRow.push(folded ? 1 : 0);
            }
            next.push(row);
            nextFold.push(foldRow);
        }

        // propagate flicker to neighbors
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (next[r][c] !== grid[r][c]) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                                residueGrid[nr][nc] = Math.max(residueGrid[nr][nc], 1);
                            }
                        }
                    }
                }
            }
        }

        grid = next;
        foldGrid = nextFold;
        pulses.forEach(p => {
            if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
                grid[p.r][p.c] = p.remaining % 2;
                colorGrid[p.r][p.c] = p.color;
                foldGrid[p.r][p.c] = 0;
                lastStateGrid[p.r][p.c] = grid[p.r][p.c];
                flickerCountGrid[p.r][p.c] = 0;
                p.remaining--;
            }
        });
        pulses = pulses.filter(p => p.remaining > 0);
        pulseCounter++;
    }
    drawGrid();
    if (
        patternDetectionEnabled &&
        rows * cols <= PATTERN_CELL_THRESHOLD &&
        pulseCounter % PATTERN_CHECK_INTERVAL === 0
    ) {
        detectPatternsInGrid();
    }
    pulseCounterSpan.textContent = pulseCounter;
}

function extractPatternSubgrid(centerR, centerC, size) {
    const half = Math.floor(size / 2);
    const subgrid = [];
    for (let dr = -half; dr <= half; dr++) {
        const row = [];
        for (let dc = -half; dc <= half; dc++) {
            const r = centerR + dr;
            const c = centerC + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                row.push(grid[r][c]);
            } else {
                row.push(0);
            }
        }
        subgrid.push(row);
    }
    return subgrid;
}

function loadPatternFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const pattern = JSON.parse(e.target.result);
            if (pattern.name && pattern.pattern) {
                knownPatterns[pattern.name] = pattern;
                console.log(`\u2705 Pattern '${pattern.name}' loaded.`);
            } else {
                alert('Invalid pattern file.');
            }
        } catch (err) {
            alert('Error parsing pattern file.');
        }
    };
    reader.readAsText(file);
}

function comparePattern(sub, reference) {
    if (sub.length !== reference.length) return false;
    for (let i = 0; i < sub.length; i++) {
        for (let j = 0; j < sub[i].length; j++) {
            if (sub[i][j] !== reference[i][j]) return false;
        }
    }
    return true;
}

function detectPatternsInGrid() {
    const size = 10;
    for (let r = size; r < rows - size; r++) {
        for (let c = size; c < cols - size; c++) {
            const sub = extractPatternSubgrid(r, c, size);
            for (const name in knownPatterns) {
                if (comparePattern(sub, knownPatterns[name].pattern)) {
                    labelPattern(r, c, name);
                }
            }
        }
    }
}

function labelPattern(r, c, label) {
    ctx.font = '10px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(label, c * cellSize + 5, r * cellSize - 5);
}

function applyTool(r, c) {
    if (tool === 'brush') {
        grid[r][c] = 1;
        colorGrid[r][c] = currentColor;
        foldGrid[r][c] = 0;
        lastStateGrid[r][c] = 1;
        flickerCountGrid[r][c] = 0;
    } else if (tool === 'eraser') {
        grid[r][c] = 0;
        foldGrid[r][c] = 0;
        lastStateGrid[r][c] = 0;
        flickerCountGrid[r][c] = 0;
    } else if (tool === 'pulse') {
        const len = parseInt(pulseLengthInput.value) || 1;
        pulses.push({ r, c, remaining: len * 2, color: currentColor });
        grid[r][c] = 1; // Ensure the pulse cell is active immediately
        colorGrid[r][c] = currentColor;
        foldGrid[r][c] = 0;
        lastStateGrid[r][c] = 1;
        flickerCountGrid[r][c] = 0;
    } else if (tool === 'stamper') {
        const pattern = patterns.find(p => p.name === patternSelect.value);
        if (pattern) {
            pattern.cells.forEach(([dr, dc]) => {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    grid[nr][nc] = 1;
                    colorGrid[nr][nc] = currentColor;
                    foldGrid[nr][nc] = 0;
                    lastStateGrid[nr][nc] = 1;
                    flickerCountGrid[nr][nc] = 0;
                }
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
    const nameInput = document.getElementById('patternName');
    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter a pattern name.');
        return;
    }

    // Collect cells for stamping functionality
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
    if (cells.length === 0) {
        alert('No active cells to save.');
        return;
    }
    const rel = cells.map(([r, c]) => [r - minR, c - minC]);
    patterns.push({ name, cells: rel });
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    patternSelect.appendChild(opt);

    // Create JSON representation for offline use
    const size = 10;
    const centerR = Math.floor(rows / 2);
    const centerC = Math.floor(cols / 2);
    const pattern = extractPatternSubgrid(centerR, centerC, size);

    const data = {
        name,
        pulse: pulseCounter || 0,
        position: [centerR, centerC],
        pattern
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);

    knownPatterns[name] = data;
    nameInput.value = '';
}

function init() {
    updateDimensions();
    createGrid();
    pulseFlash = pulseFlashCheckbox ? pulseFlashCheckbox.checked : true;
    drawGrid();
    pulseLengthLabel.style.display = 'none';
    patternLabel.style.display = 'none';
    pulseCounterSpan.textContent = pulseCounter;
    reverseBtn.textContent = 'Reverse';
    neighborThreshold = parseInt(neighborSlider.value);
    neighborValueSpan.textContent = neighborSlider.value;
    foldValueSpan.textContent = foldSlider.value;
    debugOverlay = debugCheckbox.checked;
    patternDetectionEnabled = patternDetectCheckbox ? patternDetectCheckbox.checked : true;
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

speedSlider.addEventListener('input', () => {
    if (running) {
        clearInterval(intervalId);
        const speed = parseInt(speedSlider.value);
        intervalId = setInterval(update, speed);
    }
});

debugCheckbox.addEventListener('change', () => {
    debugOverlay = debugCheckbox.checked;
    drawGrid();
});

if (pulseFlashCheckbox) {
    pulseFlashCheckbox.addEventListener('change', () => {
        pulseFlash = pulseFlashCheckbox.checked;
        drawGrid();
    });
}

if (patternDetectCheckbox) {
    patternDetectCheckbox.addEventListener('change', () => {
        patternDetectionEnabled = patternDetectCheckbox.checked;
    });
}

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
