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
    const {
        grid,
        residueGrid,
        lastStateGrid,
        flickerCountGrid,
        r,
        c,
        n,
        harmonyRatio,
        collapseLimit
    } = params;

    // Base value derived from neighbor harmony
    let val = (n / 8) >= harmonyRatio ? 1 : 0;

    // Residue nudges the cell on but never overrides completely
    if (residueGrid[r][c] > 0) {
        val = Math.max(val, 1);
        residueGrid[r][c]--;
    }

    // Track instability via flicker counts
    if (val !== lastStateGrid[r][c]) {
        flickerCountGrid[r][c] += 1;
    } else if (flickerCountGrid[r][c] > 0) {
        flickerCountGrid[r][c] -= 1;
    }

    let folded = false;
    if (collapseLimit > 0 && flickerCountGrid[r][c] > collapseLimit) {
        val = 0;
        folded = true;
        flickerCountGrid[r][c] = 0;
    }

    lastStateGrid[r][c] = val;
    return { val, folded };
}
