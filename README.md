# Pulse-Core

Pulse-Core is a browser-based sandbox for experimenting with a simple pulse simulation. Open `index.html` in a modern browser and start drawing patterns to see how they evolve.

## Features

- **Interactive grid** – Click and drag to paint cells even while the simulation runs.
- **Start/Stop controls** – Run or pause the pulse engine at any time.
- **Randomize button** – Fill the entire field with random cells using the current grid size.
- **Adjustable sliders** – Tune pulse length, fold threshold, zoom level, neighbor count and collapse threshold (in Pulse Units) on the fly.
- **Tool selection** – Switch between brush, pulse injector and pattern stamper. Right-click cells to erase.
- **Color picker** – Choose the color used for brush strokes, injected pulses and stamped patterns.
- **Reverse stepping** – Walk backward through up to 200 prior pulses.
- **Pattern saving** – Download the entire grid as a JSON file and reload it later with the upload option.
- **Optional overlays** – Toggle pulse flash, field tension mapping and grid lines.
- **Center View option** – Keep the field centered while zooming or resizing.
- **Info Nova** – If accumulated energy exceeds the collapse threshold, the grid
  clears, explodes from the center and the simulation restarts.
- **Genesis Mode** – Choose how Info Nova seeds cells on restart: stable, chaotic, organic, fractal or seeded.

The grid automatically resizes with your browser window but will not exceed 500×500 cells for performance reasons.
Adjusting the zoom slider now scales the existing grid so it always fills the window.

## Running the Simulation

1. Open `index.html` in your browser.
2. Select a tool and draw directly on the canvas. Right-click to erase cells.
3. Press **Start** to begin pulsing; **Stop** pauses the animation.
4. Adjust sliders and checkboxes to experiment with different behaviors. The collapse threshold (in Pulse Units) controls how much energy accumulates before the field clears.
5. When the threshold is crossed, an **Info Nova** burst clears the grid, shows a brief message and resumes from frame 0.
5. Save your design with **Save Pattern** or restore a previous one with **Upload Pattern**.
6. Use **Randomize** to populate the current grid with randomly placed cells.

Everything happens client-side, so once loaded you can use the tool without an internet connection.

## Development

This repository uses ESLint for basic linting. Install dependencies and run:

```sh
npm install
npm run lint
npm test
```

Run `npm install` once before running the tests to ensure Jest is available.

`npm test` currently outputs a placeholder message but establishes a spot for future tests.

The project is released under the MIT License (see `LICENSE`).

---

<p align="center">
  <a href="ABOUT.md" target="_blank">About this Web Tool</a>
</p>
