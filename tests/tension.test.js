import { countActiveCells } from '../public/tension.js';

test('countActiveCells counts non-zero cells', () => {
    const g = [ [1,0], [0,2] ];
    expect(countActiveCells(g)).toBe(2);
});

