# Pulse-Core

Pulse-Core is a browser-based sandbox for experimenting with a simple pulse simulation. Open `index.html` in a modern browser and start drawing patterns to see how they evolve.

## Features

- **Interactive grid** – Click and drag to paint cells even while the simulation runs.
- **Start/Stop controls** – Run or pause the pulse engine at any time.
- **Randomize button** – Fill the entire field with random cells using the current grid size.
- **Adjustable sliders** – Tune pulse length, fold threshold (flicker count), zoom level, neighbor count and collapse threshold (in Pulse Units) on the fly.
- **Tool selection** – Switch between brush, pulse injector and pattern stamper. Right-click cells to erase.
- **Color picker** – Choose the color used for brush strokes, injected pulses and stamped patterns. Cell rendering now uses a phase-based gradient.
- **Tinted colors** – When the Phase Colors toggle is off, each cell is drawn using a tinted version of its assigned color based on phase.
- **Phase colors** – Hue represents cell phase from red (inactive) to cyan (active) with intermediate tones for residue and flicker. Use the Phase Mode dropdown to switch between color and grayscale.
- **Reverse stepping** – Walk backward through up to 200 prior pulses.
- **Pattern saving** – Download the entire grid as a JSON file and reload it later with the upload option.
- **Optional overlays** – Toggle field tension mapping and grid lines.
- **Center View option** – Keep the field centered while zooming or resizing.
- **Hard Reset button** – Clears local storage, session storage and cookies, then reloads with cache busting.
 - **Data Nova** – If accumulated energy exceeds the collapse threshold, the grid
  clears and one or more novas explode from the densest regions before the simulation restarts.
- **Genesis Mode** – Choose how Data Nova seeds cells on restart: stable, chaotic, organic, fractal or seeded.
- **Genesis Phase** – Choose **Pre-Pulse** to automatically launch all novas when multiple centers tie, or **Post-Pulse** to manually pick one before continuing.

The grid automatically resizes with your browser window. Use the **Resolution Limit** slider to cap the maximum grid size (250–2000 cells per side). Values above 800 display a warning as high resolutions may impact performance.
Adjusting the zoom slider now scales the existing grid so it always fills the window.

## Running the Simulation

1. Open `index.html` in your browser.
2. Select a tool and draw directly on the canvas. Right-click to erase cells.
3. Press **Start** to begin pulsing; **Stop** pauses the animation.
4. Adjust sliders and checkboxes to experiment with different behaviors. The collapse threshold (in Pulse Units) controls how much energy accumulates before the field clears.
5. When the threshold is crossed, a **Data Nova** burst clears the grid, shows a brief message and resumes from frame 0.
6. Save your design with **Save Pattern** (press Enter after typing a name) or restore a previous one with **Upload Pattern**.
7. Use **Randomize** to populate the current grid with randomly placed cells.
8. If nova circles appear without data boxes, ensure `<div id="novaInfoContainer"></div>` exists in `index.html` near the bottom of the page. The script will automatically create this container if it is missing.

Everything happens client-side, so once loaded you can use the tool without an internet connection.

## Genesis Modes

When a **Data Nova** occurs, the selected genesis mode seeds the initial pattern in a distinct way:

- **Stable** – Creates a symmetrical square burst around the densest region.
- **Chaotic** – Scatters random active cells across the field.
- **Organic** – Forms a wavy cluster using a sine-based curve.
- **Fractal** – Recursively lays out cells in a fractal cross pattern.
- **Seeded** – Loads a user-defined pattern from memory.

The **Genesis Phase** toggle controls multi-nova behavior. In **Pre-Pulse** mode every detected nova launches automatically. In **Post-Pulse** mode the simulation pauses so you can choose a single origin when several dense regions compete.

The current mode is displayed on screen and logged to the console whenever seeding happens.

## Development

This repository uses ESLint for basic linting. Install dependencies first and then run:

```sh
npm install
npm run lint
npm test
```

### Test Setup

Install dependencies before running the unit tests:

```sh
npm install
```

Once the packages are installed you can execute the test suite with:

```sh
npm test
```

`npm test` runs the Jest suite which validates multi-nova logic, genesis modes and other utilities.

### Database Configuration

Nova event logging requires a `db_config.php` file with your database connection details. Start by copying the provided template and then edit it for your environment:

```sh
cp db_config.sample.php db_config.php
# update db_config.php with your credentials
```

The generated `db_config.php` is ignored by Git so it won't be included in commits.

The project is released under the MIT License (see `LICENSE`).

---

<p align="center">
  <a href="ABOUT.md" target="_blank">About this Web Tool</a>
</p>
