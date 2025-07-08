import { triggerInfoNova } from '../public/app.js';

// Mock minimal globals used by triggerInfoNova
beforeEach(() => {
    global.rows = 5;
    global.cols = 5;
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
    global.accumulatedEnergy = 123;
    global.pulseCounter = 5;
    global.prevGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
    prevGrid[1][1] = 1;
    prevGrid[1][2] = 1;
    prevGrid[2][1] = 1;
});

test('triggerInfoNova resets counter and uses densest region as origin', () => {
    triggerInfoNova();
    expect(pulseCounter).toBe(0);
    expect(grid[2][2]).toBe(1);
});

