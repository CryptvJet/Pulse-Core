let triggerInfoNova;
let mod;

beforeEach(async () => {
    jest.resetModules();
    document.body.innerHTML = `
        <canvas id="grid"></canvas>
        <button id="startBtn"></button>
        <button id="stopBtn"></button>
        <input id="frameRateSlider" value="100" />
        <input id="pulseLength" value="2" />
        <div id="novaOverlay"></div>
        <div id="novaInfoContainer"></div>
    `;
    mod = await import('../public/app.js');
    triggerInfoNova = mod.triggerInfoNova;
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
    global.start = jest.fn();
    global.accumulatedEnergy = 100;
    global.pulseCounter = 0;
    global.genesisPhase = 'post';
    global.prevGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    prevGrid[0][0] = 1;
    prevGrid[7][7] = 1;
});

test('triggerInfoNova automatically seeds all novas in post phase', () => {
    triggerInfoNova();
    expect(global.start).toHaveBeenCalled();
    const boxes = document.querySelectorAll('.novaInfoBox');
    expect(boxes.length).toBe(2);
});
