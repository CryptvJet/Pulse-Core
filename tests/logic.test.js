import { updateCellState } from '../public/logic.js';

test('updateCellState activates when neighbor harmony satisfied', () => {
    const grid = [
        [0,0,0],
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
    const params = {
        grid,
        residueGrid: residue,
        lastStateGrid: last,
        flickerCountGrid: flicker,
        r: 1,
        c: 1,
        n: 4,
        harmonyRatio: 0.5,
        collapseLimit: 2
    };
    const { val } = updateCellState(params);
    expect(val).toBe(1);
});

test('updateCellState collapses when flicker exceeds limit', () => {
    const grid = [
        [0]
    ];
    const residue = [
        [0]
    ];
    const last = [
        [1]
    ];
    const flicker = [
        [3]
    ];
    const params = {
        grid,
        residueGrid: residue,
        lastStateGrid: last,
        flickerCountGrid: flicker,
        r: 0,
        c: 0,
        n: 0,
        harmonyRatio: 0,
        collapseLimit: 2
    };
    const { val, folded } = updateCellState(params);
    expect(val).toBe(0);
    expect(folded).toBe(true);
});
