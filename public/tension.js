export function countActiveCells(grid) {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] !== 0) count++;
        }
    }
    return count;
}

export function shouldBigBang(activeCount, pulseLength, thresholdFactor) {
    return activeCount >= pulseLength * thresholdFactor;
}
