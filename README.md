# Pulse-Core

Yay!

This project contains a simple pulse simulation playground. Open `index.html` in a browser to try it out.

## Usage

1. Click and drag on the grid to paint active cells, even while the simulation is running.
2. Press **Start** to run the simulation or **Stop** to pause.
3. Adjust **Pulse Length**, **Fold Threshold** and **Zoom** with the sliders. A threshold of 0 disables folding and folded cells appear dark gray. The current fold threshold is shown next to its slider. These values—and **Neighbor Count**—can be changed even while the simulation is running.
   The grid is capped at 250×250 cells for performance. Zoom levels that would exceed this size are automatically adjusted.
4. Choose a tool from the **Tool** drop-down:
   - **Brush** – paint live cells.
   - **Eraser** – reset cells to 0.
   - **Pulse Injector** – inject a repeating 0→1→0 signal for the selected **Injector Length** and color.
   - **Pattern Stamper** – stamp a saved pattern at the clicked location. Use **Save Pattern** to store the current live cells.
5. Adjust the **Neighbor Count** slider (0–8) to control when a cell becomes active:
   - **0** – every cell simply flips state each tick.
   - **1–8** – a cell turns on only when it has exactly that many live neighbors.
   The chosen value appears next to the slider.

Use the **Reverse** button to step backward through previous pulses. A color picker lets you choose the color for brush strokes, injected pulses and stamped patterns.
Pattern detection runs automatically every few pulses but is skipped on very large grids. You can toggle this feature with the **Detect Patterns** checkbox.
The **Pulse Flash** checkbox toggles the brief black-frame effect between pulses for a smoother visual if disabled.

This scaffolding separates UI from simulation logic to allow future growth. Upcoming work will add pulse direction, folding geometry and substrate density.

## Offline Pattern Saving

You can save the current pattern to a `.json` file and load it later without any backend:

1. Enter a name in the **Pattern Name** field and click **Save Pattern**. A JSON file will be downloaded.
2. Use the file input to load a previously saved pattern. Loaded patterns are stored locally for this session.
3. When a loaded pattern reappears on the grid it is automatically labelled on the canvas.

Everything runs entirely in the browser so no internet connection is required.

## Development

This repository uses ESLint for basic linting. Install dependencies and run:

```sh
npm install
npm run lint
npm test
```

`npm test` currently outputs a placeholder message but establishes a spot for future tests.

The project is released under the MIT License (see `LICENSE`).
