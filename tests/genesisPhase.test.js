import { init, lockGenesisPhase, genesisPhase } from '../public/app.js';

document.body.innerHTML = `
    <input type="radio" name="genesisPhase" id="prePhase" value="pre" checked>
    <input type="radio" name="genesisPhase" id="postPhase" value="post">
`;

test('lockGenesisPhase disables phase radios', () => {
    init();
    lockGenesisPhase();
    const pre = document.getElementById('prePhase');
    const post = document.getElementById('postPhase');
    expect(pre.disabled).toBe(true);
    expect(post.disabled).toBe(true);
});
