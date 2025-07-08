# About Pulse-Core

Pulse-Core is a browser-based sandbox that lets you play with a simple pulse simulation. Cells on a grid flip on and off according to neighbor counts and optional folding logic. The interface lets you draw patterns, inject pulses and watch the results in real time.

## Features

- **Dynamic grid** – Each cell toggles between on and off as the simulation runs. The grid dimensions are based on your browser window (up to 500×500 cells) and the zoom slider changes the size of each cell. Adjusting the zoom slider rebuilds the grid so it always fills the page.
- **Start/Stop controls** – Start, stop and step backward through pulses with dedicated buttons.
- **Adjustable behavior** – Tune pulse length, folding threshold and neighbor count while the simulation is running.
- **Multiple tools** – Brush, pulse injector and pattern stamper let you build and experiment with different configurations. Right-click cells to erase.
- **Color picker and flash** – Choose a color for new cells and optionally flash between pulses.
- **Pattern saving** – Save the entire grid to a JSON file for offline use and reload it later.
- **Debug and grid options** – Toggle a numeric overlay or hide grid lines to change the display.

## Using the Tool

1. Open `index.html` in your browser. The grid fills the page.
2. Select a tool from the **Tool** dropdown and draw directly on the grid. Right-click to erase cells.
3. Press **Start** to animate the pattern. Adjust sliders and options to see how the behavior changes.
4. Use **Save Pattern** to download your creation or load a previously saved `.json` file with **Upload Pattern**.
5. The **Reverse** button walks backward through prior pulses.

Everything runs entirely client-side, so once the page is loaded you can experiment offline.

