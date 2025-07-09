import { getColorFromPhase } from '../public/app.js';

test('phase 0 maps to red', () => {
    expect(getColorFromPhase(0)).toBe('hsl(0, 100%, 50%)');
});

test('phase 1 maps to cyan', () => {
    expect(getColorFromPhase(1)).toBe('hsl(180, 100%, 50%)');
});

test('phase 0.5 maps to mid hue', () => {
    expect(getColorFromPhase(0.5)).toBe('hsl(90, 100%, 50%)');
});
