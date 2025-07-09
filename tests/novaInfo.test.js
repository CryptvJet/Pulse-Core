import * as mod from '../public/app.js';

document.body.innerHTML = `
    <canvas id="grid"></canvas>
    <div id="novaInfoContainer"></div>
`;

const canvas = document.getElementById('grid');
canvas.width = 100;
canvas.height = 100;

global.canvas = canvas;
global.cellSize = 10;
global.offsetX = 0;
global.offsetY = 0;

global.drawGrid = jest.fn();

test('showNovaInfo displays box and centers on click', () => {
    const spy = jest.spyOn(mod, 'centerOnNova');
    mod.showNovaInfo([2, 3]);
    const boxes = document.querySelectorAll('.novaInfoBox');
    expect(boxes.length).toBe(1);
    expect(boxes[0].classList.contains('show')).toBe(true);
    boxes[0].querySelector('.focusNovaBtn').click();
    expect(spy).toHaveBeenCalledWith([2, 3]);
    expect(document.querySelectorAll('.novaInfoBox').length).toBe(0);
});
