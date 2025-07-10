import { getResonanceLevel } from '../public/app.js';

test('getResonanceLevel maps phase 0 to tier 0', () => {
    expect(getResonanceLevel(0)).toBe(0);
});

test('getResonanceLevel maps near 1 to highest tier', () => {
    expect(getResonanceLevel(0.99)).toBe(7);
});

// Phase halfway through should map to middle tier (approx tier 4)
// since harmonicCount is 8

test('getResonanceLevel maps phase 0.5 to tier 4', () => {
    expect(getResonanceLevel(0.5)).toBe(4);
});
