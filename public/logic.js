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

function getResonanceCap(r, c, rows, cols) {
    const edge = Math.min(r, c, rows - 1 - r, cols - 1 - c);
    const maxDist = Math.max(1, Math.min(rows, cols) / 2);
    const ratio = edge / maxDist; // 0 at edge, 1 at center
    return Math.round(3 + ratio * 5); // lower cap near edges
}

export function updateCellState(params) {
    const {
        grid,
        residueGrid,
        lastStateGrid,
        flickerCountGrid,
        potentialGrid,
        foldGrid,
        r,
        c,
        n,
        harmonyRatio,
        collapseLimit,
        potentialThreshold,
        decayRate
    } = params;

    if (foldGrid && foldGrid[r][c]) {
        lastStateGrid[r][c] = 0;
        flickerCountGrid[r][c] = 0;
        potentialGrid[r][c] = 0;
        return { val: 0, folded: true, emergent: false };
    }

    const flickerCount = flickerCountGrid[r][c];
    const cap = getResonanceCap(r, c, grid.length, grid[0].length);

    // Base value derived from neighbor harmony with pulse toggling
    let val = 0;
    if (n / 8 >= harmonyRatio && flickerCount < cap) {
        val = lastStateGrid[r][c] === 0 ? 1 : 0;
    }

    // Residue nudges the cell toward on or a semi-active glow
    if (residueGrid[r][c] > 0) {
        const residue = residueGrid[r][c];
        const residueVal = residue > 3 ? 1 : 0.5;
        val = Math.max(val, residueVal);
        residueGrid[r][c]--;
    }

    // Track instability via flicker counts
    if (val !== lastStateGrid[r][c]) {
        flickerCountGrid[r][c] += 1;
    } else if (flickerCountGrid[r][c] > 0) {
        flickerCountGrid[r][c] *= 0.9;
    }

    let folded = false;
    if (collapseLimit > 0 && flickerCountGrid[r][c] > collapseLimit) {
        val = 0;
        folded = true;
        flickerCountGrid[r][c] = 0;
    }

    let emergent = false;
    // Potential accumulation for dormant cells
    potentialGrid[r][c] *= decayRate;
    if (val === 0) {
        if (n > 0) {
            potentialGrid[r][c] += n / 8;
            if (potentialGrid[r][c] >= potentialThreshold) {
                val = 1;
                emergent = true;
                potentialGrid[r][c] = 0;
            }
        }
    } else {
        potentialGrid[r][c] = 0;
    }

    // Clamp to valid range
    val = Math.max(0, Math.min(1, val));
    lastStateGrid[r][c] = val;
    return { val, folded, emergent };
}
