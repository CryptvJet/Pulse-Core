import { updateCellState } from '../public/logic.js';

test('updateCellState toggles cell based on neighbor count', () => {
    const grid = [
        [0,1,0],
        [0,0,0],
        [0,0,0]
    ];
    const residue = [
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ];
    const last = [
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ];
    const flicker = [
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ];
    const params = { grid, residueGrid: residue, lastStateGrid: last, flickerCountGrid: flicker, neighborThreshold: 1, r:0, c:1, n:1, foldThreshold:0 };
    const { val } = updateCellState(params);
    expect(val).toBe(0);
});
