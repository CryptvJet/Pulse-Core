import { getColorFromPhase, getHueFromPhase, getValueFromPhase } from '../public/app.js';

test('phase 0 maps to red', () => {
    expect(getColorFromPhase(0)).toBe('hsl(0, 100%, 50%)');
});

test('phase 1 maps to cyan', () => {
    expect(getColorFromPhase(1)).toBe('hsl(180, 100%, 50%)');
});

test('phase 0.5 maps to mid hue', () => {
    expect(getColorFromPhase(0.5)).toBe('hsl(90, 100%, 50%)');
});

test('getHueFromPhase mirrors getColorFromPhase', () => {
    expect(getHueFromPhase(0)).toBe('hsl(0, 100%, 50%)');
    expect(getHueFromPhase(1)).toBe('hsl(180, 100%, 50%)');
});

test('getValueFromPhase converts to grayscale', () => {
    expect(getValueFromPhase(0)).toBe('rgb(0, 0, 0)');
    expect(getValueFromPhase(1)).toBe('rgb(255, 255, 255)');
});
