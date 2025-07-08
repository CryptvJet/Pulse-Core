import { countActiveCells, shouldBigBang } from '../public/tension.js';

test('countActiveCells counts non-zero cells', () => {
    const g = [ [1,0], [0,2] ];
    expect(countActiveCells(g)).toBe(2);
});

test('shouldBigBang evaluates threshold', () => {
    expect(shouldBigBang(10, 2, 4)).toBe(true);
    expect(shouldBigBang(5, 2, 4)).toBe(false);
});
