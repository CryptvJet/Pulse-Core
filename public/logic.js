export function getNeighborsSum(grid, r, c) {
    let sum = 0;
    const rows = grid.length;
    const cols = grid[0].length;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                sum += grid[nr][nc];
            }
        }
    }
    return sum;
}

export function updateCellState(params) {
    const { grid, residueGrid, lastStateGrid, flickerCountGrid, neighborThreshold, r, c, n, foldThreshold } = params;
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
