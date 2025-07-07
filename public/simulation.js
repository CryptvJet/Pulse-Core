class SimulationState {
    constructor(rows, cols, historySize = 200) {
        this.historySize = historySize;
        this.history = new Array(historySize);
        this.historyIndex = 0;
        this.historyCount = 0;
        this.reset(rows, cols);
    }

    reset(rows = this.rows, cols = this.cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = this._createMatrix(rows, cols, 0);
        this.colorGrid = this._createMatrix(rows, cols, '#00ff00');
        this.foldGrid = this._createMatrix(rows, cols, 0);
        this.flickerCountGrid = this._createMatrix(rows, cols, 0);
        this.lastStateGrid = this._createMatrix(rows, cols, 0);
        this.stabilityGrid = this._createMatrix(rows, cols, 0);
        this.residueGrid = this._createMatrix(rows, cols, 0);
    }

    _createMatrix(rows, cols, initial) {
        const arr = new Array(rows);
        for (let r = 0; r < rows; r++) {
            arr[r] = new Array(cols).fill(initial);
        }
        return arr;
    }

    _copyMatrix(src) {
        return src.map(row => row.slice());
    }

    getCellState(r, c) {
        return this.grid[r][c];
    }

    updateCellState(r, c, val, color) {
        this.grid[r][c] = val;
        if (color !== undefined) {
            this.colorGrid[r][c] = color;
        }
        this.foldGrid[r][c] = 0;
        this.flickerCountGrid[r][c] = 0;
        this.stabilityGrid[r][c] = 0;
    }

    pushHistory() {
        const snap = {
            grid: this._copyMatrix(this.grid),
            colorGrid: this._copyMatrix(this.colorGrid),
            foldGrid: this._copyMatrix(this.foldGrid),
            flickerCountGrid: this._copyMatrix(this.flickerCountGrid),
            lastStateGrid: this._copyMatrix(this.lastStateGrid),
            stabilityGrid: this._copyMatrix(this.stabilityGrid),
            residueGrid: this._copyMatrix(this.residueGrid)
        };
        this.history[this.historyIndex] = snap;
        this.historyIndex = (this.historyIndex + 1) % this.historySize;
        if (this.historyCount < this.historySize) {
            this.historyCount++;
        }
    }

    reverse() {
        if (this.historyCount === 0) return;
        this.historyIndex = (this.historyIndex - 1 + this.historySize) % this.historySize;
        const snap = this.history[this.historyIndex];
        this.grid = this._copyMatrix(snap.grid);
        this.colorGrid = this._copyMatrix(snap.colorGrid);
        this.foldGrid = this._copyMatrix(snap.foldGrid);
        this.flickerCountGrid = this._copyMatrix(snap.flickerCountGrid);
        this.lastStateGrid = this._copyMatrix(snap.lastStateGrid);
        this.stabilityGrid = this._copyMatrix(snap.stabilityGrid);
        this.residueGrid = this._copyMatrix(snap.residueGrid);
        this.historyCount--;
    }

    _neighborsFrom(grid, r, c) {
        let sum = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = (r + dr + this.rows) % this.rows;
                const nc = (c + dc + this.cols) % this.cols;
                sum += grid[nr][nc];
            }
        }
        return sum;
    }

    getNeighborsSum(r, c) {
        return this._neighborsFrom(this.grid, r, c);
    }

    tick(neighborThreshold, foldThreshold, pulses = []) {
        this.pushHistory();
        const oldGrid = this.grid;
        const next = this._createMatrix(this.rows, this.cols, 0);
        const nextFold = this._createMatrix(this.rows, this.cols, 0);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.foldGrid[r][c] === 1) {
                    next[r][c] = 0;
                    nextFold[r][c] = 1;
                    continue;
                }
                const n = this._neighborsFrom(oldGrid, r, c);
                let val;
                if (neighborThreshold === 0) {
                    val = oldGrid[r][c] ? 0 : 1;
                } else {
                    val = n === neighborThreshold ? 1 : 0;
                }

                if (this.residueGrid[r][c] > 0) {
                    val = 1;
                    this.residueGrid[r][c]--;
                }

                if (val === oldGrid[r][c]) {
                    this.flickerCountGrid[r][c] = 0;
                    this.stabilityGrid[r][c] += 1;
                } else {
                    this.stabilityGrid[r][c] = 0;
                    this.flickerCountGrid[r][c] += 1;
                    if (foldThreshold > 0 && this.flickerCountGrid[r][c] >= foldThreshold) {
                        this.foldGrid[r][c] = 1;
                        val = 0;
                        nextFold[r][c] = 1;
                    }
                }
                next[r][c] = val;
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (next[r][c] !== oldGrid[r][c]) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = (r + dr + this.rows) % this.rows;
                            const nc = (c + dc + this.cols) % this.cols;
                            this.residueGrid[nr][nc] = Math.max(this.residueGrid[nr][nc], 1);
                        }
                    }
                }
            }
        }

        this.lastStateGrid = this._copyMatrix(oldGrid);
        this.grid = next;
        this.foldGrid = nextFold;

        pulses.forEach(p => {
            if (p.r >= 0 && p.r < this.rows && p.c >= 0 && p.c < this.cols) {
                this.grid[p.r][p.c] = p.remaining % 2;
                this.colorGrid[p.r][p.c] = p.color;
                this.foldGrid[p.r][p.c] = 0;
                this.flickerCountGrid[p.r][p.c] = 0;
                this.stabilityGrid[p.r][p.c] = 0;
                p.remaining--;
            }
        });

        return pulses.filter(p => p.remaining > 0);
    }

    exportPattern() {
        const cells = [];
        let minR = this.rows, minC = this.cols;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 1) {
                    cells.push([r, c]);
                    if (r < minR) minR = r;
                    if (c < minC) minC = c;
                }
            }
        }
        if (cells.length === 0) return null;
        const rel = cells.map(([r, c]) => [r - minR, c - minC]);
        return { cells: rel };
    }

    importPattern(pattern, r, c, color = '#00ff00') {
        if (!pattern || !pattern.cells) return;
        pattern.cells.forEach(([dr, dc]) => {
            const nr = (r + dr + this.rows) % this.rows;
            const nc = (c + dc + this.cols) % this.cols;
            this.updateCellState(nr, nc, 1, color);
        });
    }
}

window.SimulationState = SimulationState;
