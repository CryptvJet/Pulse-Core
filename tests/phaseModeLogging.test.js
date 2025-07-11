const markup = `
    <canvas id="grid"></canvas>
    <button id="startBtn"></button>
    <button id="stopBtn"></button>
    <button id="clearBtn"></button>
    <button id="randomizeBtn"></button>
    <input id="frameRateSlider" value="100" />
    <input id="foldSlider" value="2" />
    <span id="foldValue"></span>
    <input id="zoomSlider" value="10" />
    <select id="toolSelect"><option value="brush">brush</option></select>
    <input id="pulseLength" value="2" />
    <div id="novaOverlay"></div>
    <input id="collapseThreshold" value="1" />
    <span id="frameDuration">0</span>
    <span id="frameComplexity">0</span>
    <span id="pulseEnergy">0</span>
    <span id="tensionValue">0</span>
    <input id="neighborSlider" value="2" />
    <span id="neighborValue"></span>
    <input type="checkbox" id="debugOverlay" />
    <span id="patternLabel"></span>
    <span id="pulseCounter">0</span>
    <span id="stateLabel"></span>
    <button id="reverseBtn"></button>
    <input type="color" id="colorPicker" value="#ff009d" />
    <input type="checkbox" id="phaseColorToggle" />
    <select id="phaseMode">
        <option value="color">Color</option>
        <option value="grayscale" selected>Grayscale</option>
    </select>
`;

test('phase_mode is off when toggle unchecked', async () => {
    jest.resetModules();
    document.body.innerHTML = markup;
    const mod = await import('../public/app.js');
    mod.init();

    global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) }));

    mod.sendNovaToServer([[0,0]]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.phase_mode).toBe('off');
});
