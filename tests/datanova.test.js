let triggerInfoNova;
let latestNovaCenter;

// Mock minimal globals used by triggerInfoNova
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
    latestNovaCenter = mod.latestNovaCenter;
    global.rows = 8;
    global.cols = 8;
    global.grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    global.colorGrid = Array.from({ length: rows }, () => Array(cols).fill('#fff'));
    global.neighborThreshold = 1;
    global.pulseLength = 2;
    global.foldSlider = { value: '0' };
    global.currentColor = '#00ff00';
    global.genesisMode = 'stable';
    global.clearGrid = () => {};
    global.copyGrid = (src) => src.map(r => r.slice());
    global.drawGrid = () => {};
    global.start = () => {};
    global.accumulatedEnergy = 123;
    global.pulseCounter = 5;
    global.prevGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    // smaller cluster near top-left
    prevGrid[1][1] = 1;
    prevGrid[1][2] = 1;
    prevGrid[2][1] = 1;
    // larger cluster near bottom-right
    prevGrid[6][6] = 1;
    prevGrid[6][7] = 1;
    prevGrid[7][6] = 1;
    prevGrid[7][7] = 1;
});

test('triggerInfoNova picks origin in densest cluster', () => {
    triggerInfoNova();
    expect(pulseCounter).toBe(0);
    expect(latestNovaCenter[0]).toBeGreaterThan(4);
    expect(latestNovaCenter[1]).toBeGreaterThan(4);
});

test('triggerInfoNova uses single active cell as center', () => {
    global.prevGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    prevGrid[3][4] = 1;
    triggerInfoNova();
    expect(latestNovaCenter).toEqual([3, 4]);
});

test('triggerInfoNova averages position when density is tied', () => {
    global.prevGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    prevGrid[0][0] = 1;
    prevGrid[7][7] = 1;
    triggerInfoNova();
    expect(latestNovaCenter).toEqual([3, 3]);
});

