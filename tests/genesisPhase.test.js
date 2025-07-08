import { init, lockGenesisPhase } from '../public/app.js';

document.body.innerHTML = `
    <input type="checkbox" id="postPhaseToggle">
`;

test('lockGenesisPhase disables phase toggle', () => {
    init();
    lockGenesisPhase();
    const toggle = document.getElementById('postPhaseToggle');
    expect(toggle.disabled).toBe(true);
});
