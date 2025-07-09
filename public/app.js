import { getNeighborsSum, updateCellState } from './logic.js';
import { countActiveCells } from './tension.js';

// Base multiplier for translating user input into collapse energy units
const PULSE_UNIT = 2000; // adjust empirically if needed
// Basic pulse simulation grid
// Each cell toggles between 0 and 1.
// Folding logic will hook into update() using the foldSlider value.
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const frameRateSlider = document.getElementById('frameRateSlider');
const foldSlider = document.getElementById('foldSlider');
const foldValueSpan = document.getElementById('foldValue');
const zoomSlider = document.getElementById('zoomSlider');
const toolSelect = document.getElementById('toolSelect');
const pulseLengthInput = document.getElementById('pulseLength');
let pulseLength = parseInt(pulseLengthInput.value);
const patternSelect = document.getElementById('patternSelect');
const pulseLengthLabel = document.getElementById('pulseLengthLabel');
const patternLabel = document.getElementById('patternLabel');
const colorPicker = document.getElementById('colorPicker');
const pulseCounterSpan = document.getElementById('pulseCounter');
const stateLabel = document.getElementById('stateLabel');
const tensionValueSpan = document.getElementById('tensionValue');
const frameDurationSpan = document.getElementById('frameDuration');
const frameComplexitySpan = document.getElementById('frameComplexity');
const pulseEnergySpan = document.getElementById('pulseEnergy');
const collapseThresholdInput = document.getElementById('collapseThreshold');
const reverseBtn = document.getElementById('reverseBtn');
const neighborSlider = document.getElementById('neighborSlider');
const neighborValueSpan = document.getElementById('neighborValue');
const debugCheckbox = document.getElementById('debugOverlay');
const fieldTensionDropdown = document.getElementById('fieldTensionMode');
const pulseFlashCheckbox = document.getElementById('pulseFlash');
const patternLoader = document.getElementById('patternLoader');
const patternUploadBtn = document.getElementById('patternUploadBtn');
const gridLinesToggle = document.getElementById('gridLinesToggle');
const genesisSelect = document.getElementById('genesisModeSelect');
const postPhaseToggle = document.getElementById('postPhaseToggle');
const centerViewToggle = document.getElementById('centerViewToggle');
const resolutionSlider = document.getElementById('resolutionSlider');
const resolutionWarning = document.getElementById('resolutionWarning');
const aboutLink = document.getElementById('aboutLink');
const directionsLink = document.getElementById('directionsLink');
const aboutPopup = document.getElementById('aboutPopup');
const directionsPopup = document.getElementById('directionsPopup');
const closeButtons = document.querySelectorAll('.closePopup');
const novaOverlay = document.getElementById('novaOverlay');
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
let pulseCounter = 0;
let reverse = false;
let history = [];
const MAX_HISTORY = 200;
let neighborThreshold = parseInt(neighborSlider.value);
let debugOverlay = false;
let fieldTensionMode = 'none';
let activeCellCount = 0;
let collapseThreshold = parseFloat(collapseThresholdInput.value || '1') * 1000 * PULSE_UNIT;
let showGridLines = true;
let centerView = false;
let offsetX = 0;
let offsetY = 0;
// Maximum row/column count before zoom is restricted.
let maxDimension = resolutionSlider ? parseInt(resolutionSlider.value) : 500;

let pulseFlash = true;
let lastFrameTime = performance.now();
let startTime = null;
let timeElapsed = 0;
let prevGrid = [];
let accumulatedEnergy = 0;
let latestNovaCenter = null;
let latestNovaCenters = [];
let genesisMode = 'stable'; // stable | chaotic | organic | fractal | seeded
let genesisPhase = 'pre'; // pre | post
let selectionPending = false;
let showNovaHighlight = false;

function lockGenesisPhase() {
    if (postPhaseToggle) postPhaseToggle.disabled = true;
}

function unlockGenesisPhase() {
    if (postPhaseToggle) postPhaseToggle.disabled = false;
}

function updateZoom() {
    // Update the pixel size for each cell based on the zoom slider
    // and refresh the grid dimensions so the canvas remains filled.
    cellSize = parseInt(zoomSlider.value);
    updateDimensions();
}

function updateDimensions() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const oldRows = rows || 0;
    const oldCols = cols || 0;

    cols = Math.ceil(canvas.width / cellSize);
    rows = Math.ceil(canvas.height / cellSize);

    if (cols > maxDimension || rows > maxDimension) {
        const newSize = Math.ceil(Math.max(canvas.width, canvas.height) / maxDimension);
        cellSize = newSize;
        zoomSlider.value = newSize;
        cols = Math.ceil(canvas.width / cellSize);
        rows = Math.ceil(canvas.height / cellSize);
    }

    if (rows !== oldRows || cols !== oldCols) {
        resizeGrid(oldRows, oldCols);
    }

    if (centerView) {
        offsetX = Math.floor((canvas.width - cols * cellSize) / 2);
        offsetY = Math.floor((canvas.height - rows * cellSize) / 2);
    } else {
        offsetX = 0;
        offsetY = 0;
    }
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
    prevGrid = copyGrid(grid);
}

function resizeGrid(oldRows, oldCols) {
    function copy(src, fill) {
        const arr = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                if (r < oldRows && c < oldCols && src[r] && src[r][c] !== undefined) {
                    row.push(src[r][c]);
                } else {
                    row.push(fill);
                }
            }
            arr.push(row);
        }
        return arr;
    }

    grid = copy(grid, 0);
    colorGrid = copy(colorGrid, currentColor);
    residueGrid = copy(residueGrid, 0);
    foldGrid = copy(foldGrid, 0);
    flickerCountGrid = copy(flickerCountGrid, 0);
    lastStateGrid = copy(lastStateGrid, 0);
}

// Set every cell in colorGrid to the provided color
function applyColorToGrid(color) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            colorGrid[r][c] = color;
        }
    }
}

function copyGrid(src) {
    return src.map(row => row.slice());
}

function countCellChanges(prev, curr) {
    if (!prev || prev.length === 0) return 0;
    let changes = 0;
    for (let r = 0; r < prev.length; r++) {
        for (let c = 0; c < prev[r].length; c++) {
            if (prev[r][c] !== curr[r][c]) {
                changes++;
            }
        }
    }
    return changes;
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${Math.max(cellSize - 2, 8)}px monospace`;
    ctx.textBaseline = 'top';
    const drawSize = showGridLines ? Math.max(cellSize - 1, 1) : cellSize;
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
            ctx.fillRect(c * cellSize + offsetX, r * cellSize + offsetY, drawSize, drawSize);

            if (debugOverlay) {
                const n = getNeighborsSum(grid, r, c);
                ctx.fillStyle = 'white';
                const disp = neighborThreshold === 0 ? grid[r][c] : n;
                ctx.fillText(disp, c * cellSize + offsetX + 2, r * cellSize + offsetY + 2);
            }
        }
    }
    if (debugOverlay || selectionPending || showNovaHighlight) {
        if (debugOverlay) {
            const mode = fieldTensionDropdown ? fieldTensionDropdown.value : 'none';
            if (mode === 'none') {
                clearFieldOverlay();
            } else {
                drawFieldTensionOverlay(mode);
            }
        }
        const centers = latestNovaCenters && latestNovaCenters.length ? latestNovaCenters : (latestNovaCenter ? [latestNovaCenter] : []);
        centers.forEach(([nr, nc]) => {
            ctx.strokeStyle = selectionPending ? '#0f0' : 'red';
            ctx.lineWidth = 2;
            const x = nc * cellSize + offsetX + cellSize / 2;
            const y = nr * cellSize + offsetY + cellSize / 2;
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
    repositionNovaInfoBoxes();
}

// Stub for rendering different field tension overlays
function drawFieldTensionOverlay(mode) {
    switch (mode) {
        case 'pulse-barrier':
            drawPulseBarrierTest31();
            break;
        case 'waveguide':
            drawWaveguideLockA();
            break;
        case 'channel-field':
            drawSymmetricChannelField();
            break;
        case 'containment':
            drawContainmentCorridor1();
            break;
        case 'reactor-chamber':
            drawDualReactorChamber();
            break;
        default:
            break; // do nothing for "none"
    }
}

function clearFieldOverlay() {
    // Simply redraw the grid without any overlay
    // Overlay will be omitted if mode is 'none'
}

function drawPulseBarrierTest31() {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    const w = cols * cellSize;
    const h = rows * cellSize;
    ctx.strokeRect(offsetX + cellSize * 2, offsetY + cellSize * 2, w - cellSize * 4, h - cellSize * 4);
}

function drawWaveguideLockA() {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    const w = cols * cellSize;
    const h = rows * cellSize;
    ctx.beginPath();
    ctx.moveTo(offsetX + w / 2, offsetY + cellSize);
    ctx.lineTo(offsetX + w / 2, offsetY + h - cellSize);
    ctx.stroke();
}

function drawSymmetricChannelField() {
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
    ctx.lineWidth = 2;
    const w = cols * cellSize;
    const h = rows * cellSize;
    ctx.beginPath();
    ctx.moveTo(offsetX + cellSize, offsetY + h / 2);
    ctx.lineTo(offsetX + w - cellSize, offsetY + h / 2);
    ctx.stroke();
}

function drawContainmentCorridor1() {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    const w = cols * cellSize;
    const h = rows * cellSize;
    ctx.strokeRect(offsetX + cellSize, offsetY + cellSize, w - cellSize * 2, h - cellSize * 2);
}

function drawDualReactorChamber() {
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
    ctx.lineWidth = 2;
    const w = cols * cellSize;
    const h = rows * cellSize;
    const mid = w / 2;
    ctx.strokeRect(offsetX + cellSize, offsetY + cellSize, mid - cellSize * 1.5, h - cellSize * 2);
    ctx.strokeRect(offsetX + mid + cellSize * 0.5, offsetY + cellSize, mid - cellSize * 1.5, h - cellSize * 2);
}

// Return the total of all eight neighbors around (r, c)
// Update all cells based on the neighbor threshold
// Future folding mechanics can modify the grid here using foldSlider.value

function update() {
    const now = performance.now();
    if (pulseCounter === 0) {
        startTime = now;
        lastFrameTime = now;
        accumulatedEnergy = 0;
        timeElapsed = 0;
        pulseCounter = 1;
        lockGenesisPhase();
        pulseCounterSpan.textContent = pulseCounter;
        stateLabel.textContent = 'State: Pulsing';
        stateLabel.classList.add('pulse-start');
        setTimeout(() => stateLabel.classList.remove('pulse-start'), 300);
        frameDurationSpan.textContent = '0';
        frameComplexitySpan.textContent = '0';
        pulseEnergySpan.textContent = '0';
        drawGrid();
        return;
    }
    const frameDuration = now - lastFrameTime;
    lastFrameTime = now;
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
            grid: copyGrid(grid),
            colorGrid: copyGrid(colorGrid)
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
                const n = getNeighborsSum(grid, r, c);
                const { val, folded } = updateCellState({ grid, residueGrid, lastStateGrid, flickerCountGrid, neighborThreshold, r, c, n, foldThreshold });

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
    pulseCounterSpan.textContent = pulseCounter;
    stateLabel.textContent = 'State: Pulsing';
    activeCellCount = countActiveCells(grid);
    tensionValueSpan.textContent = activeCellCount;
    const complexity = countCellChanges(prevGrid, grid);
    const energyThisFrame = complexity * (frameDuration / 16);
    accumulatedEnergy += energyThisFrame;
    timeElapsed = now - startTime;
    frameDurationSpan.textContent = Math.round(frameDuration);
    frameComplexitySpan.textContent = complexity;
    pulseEnergySpan.textContent = Math.round(accumulatedEnergy);
    prevGrid = copyGrid(grid);
    if (pulseCounter >= pulseLength && accumulatedEnergy >= collapseThreshold) {
        triggerInfoNova();
    }
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


let selectedPatternFile = null;

function handlePatternSelection(input) {
    selectedPatternFile = input.files[0] || null;
    if (selectedPatternFile) {
        patternUploadBtn.style.display = 'block';
    } else {
        patternUploadBtn.style.display = 'none';
    }
}

function uploadPattern() {
    if (!selectedPatternFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            applyPatternData(data);
        } catch (err) {
            alert('Error parsing pattern file.');
        }
    };
    reader.readAsText(selectedPatternFile);
    patternUploadBtn.style.display = 'none';
    patternLoader.value = '';
    selectedPatternFile = null;
}

function applyPatternData(data) {
    if (!data.pattern || !Array.isArray(data.pattern)) {
        alert('Invalid pattern file.');
        return;
    }
    clearGrid();

    if (data.fold !== undefined) {
        foldSlider.value = data.fold;
        foldValueSpan.textContent = data.fold;
    }
    if (data.neighbors !== undefined) {
        neighborSlider.value = data.neighbors;
        neighborThreshold = parseInt(data.neighbors);
        neighborValueSpan.textContent = data.neighbors;
    }
    if (data.currentColor) {
        colorPicker.value = data.currentColor;
        currentColor = data.currentColor;
    }

    const rowCount = data.rows || data.pattern.length;
    const colCount = data.cols || (Array.isArray(data.pattern[0]) ? data.pattern[0].length : 0);
    const halfRows = Math.floor(rowCount / 2);
    const halfCols = Math.floor(colCount / 2);
    const pos = data.position || [Math.floor(rows / 2), Math.floor(cols / 2)];

    for (let r = 0; r < rowCount; r++) {
        const row = data.pattern[r] || [];
        for (let c = 0; c < colCount; c++) {
            const val = row[c] || 0;
            const gr = pos[0] - halfRows + r;
            const gc = pos[1] - halfCols + c;
            if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
                grid[gr][gc] = val;
                if (data.colors && data.colors[r] && data.colors[r][c]) {
                    colorGrid[gr][gc] = data.colors[r][c];
                } else if (val === 1) {
                    colorGrid[gr][gc] = currentColor;
                }
            }
        }
    }

    pulseCounter = data.pulse || 0;
    pulseCounterSpan.textContent = pulseCounter;
    stateLabel.textContent = pulseCounter === 0 ? 'State: Pre-Pulse' : 'State: Pulsing';
    drawGrid();
}


function applyTool(r, c) {
    if (tool === 'brush') {
        grid[r][c] = 1;
        colorGrid[r][c] = currentColor;
        foldGrid[r][c] = 0;
        lastStateGrid[r][c] = 1;
        flickerCountGrid[r][c] = 0;
    } else if (tool === 'pulse') {
        const len = running ? pulseLength : (parseInt(pulseLengthInput.value) || 1);
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

function eraseCell(r, c) {
    grid[r][c] = 0;
    foldGrid[r][c] = 0;
    lastStateGrid[r][c] = 0;
    flickerCountGrid[r][c] = 0;
    drawGrid();
}
// UI handlers

let isDrawing = false;

function getCellFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX - offsetX;
    const y = (event.clientY - rect.top) * scaleY - offsetY;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    return { r, c };
}

function toggleCell(event) {
    const { r, c } = getCellFromEvent(event);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const rightClick = event.buttons === 2 || event.button === 2;
        if (rightClick) {
            eraseCell(r, c);
        } else {
            applyTool(r, c);
        }
    }
}

function startDrawing(event) {
    event.preventDefault();
    isDrawing = true;
    toggleCell(event);
}

function drawIfNeeded(event) {
    event.preventDefault();
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
    stateLabel.classList.remove('pulse-start');
    pulseLength = parseInt(pulseLengthInput.value);
    pulseLengthInput.disabled = true;
    lastFrameTime = performance.now();
    accumulatedEnergy = 0;
    prevGrid = copyGrid(grid);
    frameDurationSpan.textContent = '0';
    frameComplexitySpan.textContent = '0';
    pulseEnergySpan.textContent = '0';
    const speed = parseInt(frameRateSlider.value);
    intervalId = setInterval(update, speed);
}

function stop() {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    pulseLengthInput.disabled = false;
    clearInterval(intervalId);
    stateLabel.textContent = 'State: Paused';
}

function clearGrid(resetStats = true) {
    stop();
    unlockGenesisPhase();
    createGrid();
    pulses = [];
    history = [];
    pulseCounter = 0;
    accumulatedEnergy = 0;
    startTime = null;
    timeElapsed = 0;
    prevGrid = copyGrid(grid);
    stateLabel.textContent = 'State: Pre-Pulse';
    if (resetStats) {
        pulseCounterSpan.textContent = pulseCounter;
        frameDurationSpan.textContent = '0';
        frameComplexitySpan.textContent = '0';
        pulseEnergySpan.textContent = '0';
    }
    drawGrid();
    hideNovaInfoBoxes();
}

function randomizeGrid() {
    stop();
    unlockGenesisPhase();
    createGrid();
    prevGrid = copyGrid(grid);
    accumulatedEnergy = 0;
    startTime = null;
    timeElapsed = 0;
    pulseCounter = 0;
    pulseCounterSpan.textContent = pulseCounter;
    stateLabel.textContent = 'State: Pre-Pulse';
    frameDurationSpan.textContent = '0';
    frameComplexitySpan.textContent = '0';
    pulseEnergySpan.textContent = '0';

    const size = 20;
    const fillRatio = 0.8;

    const areaRows = Math.min(size, rows);
    const areaCols = Math.min(size, cols);
    // Center the random area within the current grid
    const startRow = Math.floor((rows - areaRows) / 2);
    const startCol = Math.floor((cols - areaCols) / 2);

    const total = areaRows * areaCols;
    const maxFill = Math.floor(total * fillRatio);
    const fillCount = Math.floor(Math.random() * (maxFill + 1));

    const cells = [];
    for (let r = 0; r < areaRows; r++) {
        for (let c = 0; c < areaCols; c++) {
            cells.push([startRow + r, startCol + c]);
        }
    }

    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    for (let i = 0; i < fillCount; i++) {
        const [r, c] = cells[i];
        grid[r][c] = 1;
        colorGrid[r][c] = currentColor;
    }
    drawGrid();
    hideNovaInfoBoxes();
}

function triggerBigBang() {
    canvas.classList.add('flash');
    setTimeout(() => canvas.classList.remove('flash'), 100);
    clearGrid(false);
    console.log('Big Bang at', new Date().toISOString());
}

function seedSymmetricalBurst(cr, cc) {
    for (let r = cr - 5; r <= cr + 5; r++) {
        for (let c = cc - 5; c <= cc + 5; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = 1;
                colorGrid[r][c] = currentColor;
            }
        }
    }
}

function seedRandomScatter(_cr, _cc, density = 0.05) {
    const count = Math.floor(rows * cols * density);
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        grid[r][c] = 1;
        colorGrid[r][c] = currentColor;
    }
}

function seedPerlinCluster(cr, cc, scale = 0.5) {
    for (let r = cr - 10; r <= cr + 10; r++) {
        for (let c = cc - 10; c <= cc + 10; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const dx = c - cc;
                const dy = r - cr;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (Math.sin(dist * scale) > 0.5) {
                    grid[r][c] = 1;
                    colorGrid[r][c] = currentColor;
                }
            }
        }
    }
}

function seedRecursiveFractals(cr, cc, depth = 3) {
    if (depth <= 0) return;
    for (let dr = -depth; dr <= depth; dr++) {
        for (let dc = -depth; dc <= depth; dc++) {
            const r = cr + dr;
            const c = cc + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = 1;
                colorGrid[r][c] = currentColor;
            }
        }
    }
    seedRecursiveFractals(cr - depth, cc, depth - 1);
    seedRecursiveFractals(cr + depth, cc, depth - 1);
    seedRecursiveFractals(cr, cc - depth, depth - 1);
    seedRecursiveFractals(cr, cc + depth, depth - 1);
}

function loadPatternFromMemory(cr, cc) {
    const pattern = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
    ];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (pattern[r][c]) {
                const nr = cr + r - 1;
                const nc = cc + c - 1;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    grid[nr][nc] = 1;
                    colorGrid[nr][nc] = currentColor;
                }
            }
        }
    }
}

function triggerInfoNova() {
    const searchRadius = Math.max(2, Math.min(5, Math.floor(Math.min(rows, cols) / 4)));
    let maxScore = -1;
    let novaCandidates = [];

    if (prevGrid && prevGrid.length) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let sum = 0;
                for (let dr = -searchRadius; dr <= searchRadius; dr++) {
                    for (let dc = -searchRadius; dc <= searchRadius; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                            if (prevGrid[nr][nc] === 1) sum++;
                        }
                    }
                }
                if (sum > maxScore) {
                    maxScore = sum;
                    novaCandidates = [[r, c]];
                } else if (sum === maxScore) {
                    novaCandidates.push([r, c]);
                }
            }
        }
    }

    function clusterPoints(points, radius) {
        const clusters = [];
        const visited = new Set();
        const r2 = radius * radius;
        for (const [r, c] of points) {
            const key = r + ',' + c;
            if (visited.has(key)) continue;
            const stack = [[r, c]];
            const cluster = [];
            visited.add(key);
            while (stack.length) {
                const [cr, cc] = stack.pop();
                cluster.push([cr, cc]);
                for (const [nr, nc] of points) {
                    const nk = nr + ',' + nc;
                    if (!visited.has(nk)) {
                        const dist2 = (nr - cr) * (nr - cr) + (nc - cc) * (nc - cc);
                        if (dist2 <= r2) {
                            visited.add(nk);
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
            clusters.push(cluster);
        }
        return clusters;
    }

    const clusters = clusterPoints(novaCandidates, searchRadius);
    latestNovaCenters = clusters.map(cluster => {
        let tr = 0, tc = 0;
        cluster.forEach(([r, c]) => { tr += r; tc += c; });
        return [Math.round(tr / cluster.length), Math.round(tc / cluster.length)];
    });

    if (latestNovaCenters.length === 0) {
        latestNovaCenters = [[Math.floor(rows / 2), Math.floor(cols / 2)]];
    }
    latestNovaCenter = latestNovaCenters[0];

    if (genesisPhase === 'pre' && latestNovaCenters.length > 1) {
        selectionPending = true;
        stop();
        drawGrid();
        latestNovaCenters.forEach(showNovaInfo);
        if (novaOverlay) {
            novaOverlay.textContent = 'Choose Timeline';
            novaOverlay.classList.add('prompt', 'show');
        }
        const handler = (e) => {
            if (!selectionPending) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - offsetX;
            const y = e.clientY - rect.top - offsetY;
            const r = Math.floor(y / cellSize);
            const c = Math.floor(x / cellSize);
            let chosen = null;
            let best = Infinity;
            latestNovaCenters.forEach(pt => {
                const d = Math.hypot(pt[0] - r, pt[1] - c);
                if (d < best) { best = d; chosen = pt; }
            });
            if (chosen) {
                selectionPending = false;
                canvas.removeEventListener('click', handler);
                latestNovaCenters = [chosen];
                latestNovaCenter = chosen;
                novaOverlay.classList.remove('prompt', 'show');
                performNovaSequence();
            }
        };
        canvas.addEventListener('click', handler);
        return;
    }

    if (genesisPhase === 'post' && latestNovaCenters.length > 1) {
        selectionPending = true;
        stop();
        drawGrid();
        latestNovaCenters.forEach(showNovaInfo);
        if (novaOverlay) {
            novaOverlay.textContent = 'Choose Nova';
            novaOverlay.classList.add('prompt', 'show');
        }
        const handler = (e) => {
            if (!selectionPending) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - offsetX;
            const y = e.clientY - rect.top - offsetY;
            const r = Math.floor(y / cellSize);
            const c = Math.floor(x / cellSize);
            let chosen = null;
            let best = Infinity;
            latestNovaCenters.forEach(pt => {
                const d = Math.hypot(pt[0] - r, pt[1] - c);
                if (d < best) { best = d; chosen = pt; }
            });
            if (chosen) {
                selectionPending = false;
                canvas.removeEventListener('click', handler);
                latestNovaCenters = [chosen];
                latestNovaCenter = chosen;
                novaOverlay.classList.remove('prompt', 'show');
                performNovaSequence();
            }
        };
        canvas.addEventListener('click', handler);
        return;
    }

    performNovaSequence();

    function performNovaSequence() {
        hideNovaInfoBoxes();
        clearGrid(false);
        console.log('Seeding: ' + genesisMode);
        if (novaOverlay) {
            const modeDisplay = genesisMode.charAt(0).toUpperCase() + genesisMode.slice(1);
            novaOverlay.innerHTML = modeDisplay + '<br>Data Nova';
        }
        latestNovaCenters.forEach(([originR, originC], idx) => {
            switch (genesisMode) {
            case 'stable':
                seedSymmetricalBurst(originR, originC);
                break;
            case 'chaotic':
                seedRandomScatter(originR, originC, 0.05);
                break;
            case 'fractal':
                seedRecursiveFractals(originR, originC, 3);
                break;
            case 'organic':
                seedPerlinCluster(originR, originC, 0.5);
                break;
            case 'seeded':
                loadPatternFromMemory(originR, originC);
                break;
            default:
                console.log('Unknown genesis mode:', genesisMode);
                break;
            }
        });
        accumulatedEnergy = 0;
        pulseCounter = 0;
        prevGrid = copyGrid(grid);
        drawGrid();
        latestNovaCenters.forEach(showNovaInfo);
        if (novaOverlay) {
            novaOverlay.classList.add('show');
            setTimeout(() => {
                novaOverlay.classList.remove('show');
                novaOverlay.textContent = 'Data Nova';
            }, 1200);
        }
        console.log('Data Nova at', new Date().toISOString());
        start();
    }
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

    // Create JSON representation for offline use (entire grid)
    const centerR = Math.floor(rows / 2);
    const centerC = Math.floor(cols / 2);
    const pattern = grid.map(row => row.slice());
    const colors = colorGrid.map(row => row.slice());

    const data = {
        name,
        pulse: pulseCounter || 0,
        phase: pulseCounter === 0 ? 'Seed Substrate' : 'Live Evolution',
        elapsedMs: pulseCounter === 0 || startTime === null ? 0 : Math.round(performance.now() - startTime),
        position: [centerR, centerC],
        rows,
        cols,
        pattern,
        colors,
        fold: foldSlider.value,
        neighbors: neighborSlider.value,
        currentColor
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);

    nameInput.value = '';
}

function init() {
    centerView = centerViewToggle ? centerViewToggle.checked : false;
    updateDimensions();
    createGrid();
    if (resolutionWarning) {
        resolutionWarning.style.display = maxDimension > 800 ? 'inline' : 'none';
    }
    pulseFlash = pulseFlashCheckbox ? pulseFlashCheckbox.checked : true;
    showGridLines = gridLinesToggle ? gridLinesToggle.checked : true;
    drawGrid();
    unlockGenesisPhase();
    frameDurationSpan.textContent = '0';
    frameComplexitySpan.textContent = '0';
    pulseEnergySpan.textContent = '0';
    patternLabel.style.display = 'none';
    pulseCounterSpan.textContent = pulseCounter;
    stateLabel.textContent = 'State: Pre-Pulse';
    reverseBtn.textContent = 'Reverse';
    neighborThreshold = parseInt(neighborSlider.value);
    neighborValueSpan.textContent = neighborSlider.value;
    foldValueSpan.textContent = foldSlider.value;
    debugOverlay = debugCheckbox.checked;
    fieldTensionMode = fieldTensionDropdown ? fieldTensionDropdown.value : 'none';
    genesisMode = genesisSelect ? genesisSelect.value : 'stable';
    genesisPhase = postPhaseToggle && postPhaseToggle.checked ? 'post' : 'pre';
}

window.addEventListener('resize', () => {
    updateDimensions();
    createGrid();
    drawGrid();
});

zoomSlider.addEventListener('input', () => {
    updateZoom();
    drawGrid();
});

if (resolutionSlider) {
    resolutionSlider.addEventListener('input', () => {
        maxDimension = parseInt(resolutionSlider.value);
        if (resolutionWarning) {
            resolutionWarning.style.display = maxDimension > 800 ? 'inline' : 'none';
        }
        updateDimensions();
        drawGrid();
    });
}

toolSelect.addEventListener('change', () => {
    tool = toolSelect.value;
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

pulseLengthInput.addEventListener('input', () => {
    if (!running) {
        pulseLength = parseInt(pulseLengthInput.value);
    }
});

collapseThresholdInput.addEventListener('input', () => {
    collapseThreshold = parseFloat(collapseThresholdInput.value || '1') * 1000 * PULSE_UNIT;
});

frameRateSlider.addEventListener('input', () => {
    if (running) {
        clearInterval(intervalId);
        const speed = parseInt(frameRateSlider.value);
        intervalId = setInterval(update, speed);
    }
});

debugCheckbox.addEventListener('change', () => {
    debugOverlay = debugCheckbox.checked;
    drawGrid();
});

if (fieldTensionDropdown) {
    fieldTensionDropdown.addEventListener('change', () => {
        fieldTensionMode = fieldTensionDropdown.value;
        drawGrid();
    });
}

if (genesisSelect) {
    genesisSelect.addEventListener('change', (e) => {
        genesisMode = e.target.value;
    });
}

if (postPhaseToggle) {
    postPhaseToggle.addEventListener('change', () => {
        if (!postPhaseToggle.disabled) {
            genesisPhase = postPhaseToggle.checked ? 'post' : 'pre';
        }
    });
}

if (pulseFlashCheckbox) {
    pulseFlashCheckbox.addEventListener('change', () => {
        pulseFlash = pulseFlashCheckbox.checked;
        drawGrid();
    });
}

if (gridLinesToggle) {
    gridLinesToggle.addEventListener('change', () => {
        showGridLines = gridLinesToggle.checked;
        drawGrid();
    });
}

if (centerViewToggle) {
    centerViewToggle.addEventListener('change', () => {
        centerView = centerViewToggle.checked;
        updateDimensions();
        drawGrid();
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
canvas.addEventListener('contextmenu', e => e.preventDefault());
startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
clearBtn.addEventListener('click', clearGrid);
randomizeBtn.addEventListener('click', randomizeGrid);

function openPopup(el) {
    if (el) {
        el.classList.add('show');
    }
}

function closePopup(el) {
    if (el) {
        el.classList.remove('show');
    }
}

function centerOnNova([r, c]) {
    offsetX = Math.floor(canvas.width / 2 - (c + 0.5) * cellSize);
    offsetY = Math.floor(canvas.height / 2 - (r + 0.5) * cellSize);
    drawGrid();
}

function hideNovaInfoBoxes() {
    document.querySelectorAll('.novaInfoBox').forEach(el => el.remove());
    showNovaHighlight = false;
}

function showNovaInfo(center) {
    if (!center) return;
    const container = document.getElementById('novaInfoContainer') || document.body;
    const box = document.createElement('div');
    box.className = 'popupOverlay novaInfo novaInfoBox show';
    const [r, c] = center;
    const x = c * cellSize + offsetX + cellSize / 2;
    const y = r * cellSize + offsetY + cellSize / 2;
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.dataset.row = r;
    box.dataset.col = c;
    box.innerHTML = `<div>Nova (${r}, ${c})</div><button class="focusNovaBtn">Center</button>`;
    container.appendChild(box);
    showNovaHighlight = true;
    const btn = box.querySelector('.focusNovaBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            centerOnNova(center);
        });
    }
}

function repositionNovaInfoBoxes() {
    document.querySelectorAll('.novaInfoBox').forEach(box => {
        const r = parseInt(box.dataset.row, 10);
        const c = parseInt(box.dataset.col, 10);
        if (!isNaN(r) && !isNaN(c)) {
            const x = c * cellSize + offsetX + cellSize / 2;
            const y = r * cellSize + offsetY + cellSize / 2;
            box.style.left = `${x}px`;
            box.style.top = `${y}px`;
        }
    });
}

if (aboutLink && aboutPopup) {
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPopup(aboutPopup);
    });
}

if (directionsLink && directionsPopup) {
    directionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPopup(directionsPopup);
    });
}

if (closeButtons) {
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closePopup(btn.parentElement);
        });
    });
}

const menuToggle = document.getElementById('menuToggle');
const slideMenu = document.getElementById('slideMenu');
if (menuToggle && slideMenu) {
    menuToggle.addEventListener('click', () => {
        slideMenu.classList.toggle('open');
    });
}

// Additional hooks for pulse direction and substrate density will be added later.

export { init, triggerInfoNova, latestNovaCenter, latestNovaCenters, genesisMode, genesisPhase, lockGenesisPhase, showNovaInfo, centerOnNova, repositionNovaInfoBoxes };
