import { triggerInfoNova, latestNovaCenter } from '../public/app.js';

beforeEach(() => {
    global.rows = 20;
    global.cols = 20;
    global.grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    global.colorGrid = Array.from({ length: rows }, () => Array(cols).fill('#fff'));
    global.neighborThreshold = 1;
    global.pulseLength = 2;
    global.foldSlider = { value: '0' };
    global.currentColor = '#00ff00';
    global.clearGrid = () => {};
    global.copyGrid = (src) => src.map(r => r.slice());
    global.drawGrid = () => {};
    global.start = () => {};
    global.accumulatedEnergy = 50;
    global.pulseCounter = 5;
    global.prevGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
});

test('stable genesis creates centered square', () => {
    global.genesisMode = 'stable';
    triggerInfoNova();
    const [r0, c0] = latestNovaCenter;
    let active = 0;
    for (let r = r0 - 5; r <= r0 + 5; r++) {
        for (let c = c0 - 5; c <= c0 + 5; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                expect(grid[r][c]).toBe(1);
                active++;
            }
        }
    }
    expect(active).toBe(121);
});

test('seeded genesis creates cross', () => {
    global.genesisMode = 'seeded';
    triggerInfoNova();
    const [r0, c0] = latestNovaCenter;
    const coords = [
        [r0, c0],
        [r0 - 1, c0],
        [r0 + 1, c0],
        [r0, c0 - 1],
        [r0, c0 + 1]
    ];
    coords.forEach(([r, c]) => {
        expect(grid[r][c]).toBe(1);
    });
});

test('fractal genesis seeds multiple cells', () => {
    global.genesisMode = 'fractal';
    triggerInfoNova();
    const count = grid.flat().reduce((a, b) => a + b, 0);
    expect(count).toBeGreaterThan(1);
});
