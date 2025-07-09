let triggerInfoNova;
let latestNovaCenters;

beforeEach(async () => {
    jest.resetModules();
    document.body.innerHTML = `
        <canvas id="grid"></canvas>
        <button id="startBtn"></button>
        <button id="stopBtn"></button>
        <input id="frameRateSlider" value="100" />
        <input id="pulseLength" value="2" />
        <div id="novaOverlay"></div>
    `;
    const mod = await import('../public/app.js');
    triggerInfoNova = mod.triggerInfoNova;
    latestNovaCenters = mod.latestNovaCenters;
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

test('stable genesis seeds cells organically', () => {
    global.genesisMode = 'stable';
    triggerInfoNova();
    const count = grid.flat().reduce((a, b) => a + b, 0);
    expect(count).toBeGreaterThan(0);
});

test('seeded genesis creates cross', () => {
    global.genesisMode = 'seeded';
    triggerInfoNova();
    const [r0, c0] = latestNovaCenters[0];
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
