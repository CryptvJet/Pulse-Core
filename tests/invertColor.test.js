import { invertHexColor } from '../public/app.js';

test('invertHexColor returns RGB inversion', () => {
    const { r, g, b } = invertHexColor('#123456');
    expect(r).toBe(0xED);
    expect(g).toBe(0xCA);
    expect(b).toBe(0xA9);
});
