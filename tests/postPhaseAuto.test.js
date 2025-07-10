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
        <input id="zoomSlider" value="10" />
    `;
    mod = await import('../public/app.js');
    triggerInfoNova = mod.triggerInfoNova;
    global.rows = 8;
    global.cols = 8;
    global.grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    global.colorGrid = Array.from({ length: rows }, () => Array(cols).fill(null));
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

test('triggerInfoNova waits for manual selection in post phase', () => {
    triggerInfoNova();
    // start should not fire until a nova center is chosen
    expect(global.start).not.toHaveBeenCalled();
    const boxes = document.querySelectorAll('.novaInfoBox');
    expect(boxes.length).toBe(2);
    const canvas = document.getElementById('grid');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 80, height: 80 });
    global.cellSize = 10;
    global.offsetX = 0;
    global.offsetY = 0;
    canvas.dispatchEvent(new MouseEvent('click', { clientX: 5, clientY: 5 }));
    expect(global.start).toHaveBeenCalled();
});
