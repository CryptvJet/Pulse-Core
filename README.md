# Pulse-Core

This project contains a simple pulse simulation playground. Open `index.html` in a browser to try it out.

## Usage

1. Click cells on the grid to activate them.
2. Press **Start** to run the simulation or **Stop** to pause.
3. Adjust **Tick Speed** and **Zoom** with the sliders.
4. Choose a tool from the **Tool** drop-down:
   - **Brush** – paint live cells.
   - **Eraser** – reset cells to 0.
   - **Pulse Injector** – inject a repeating 0→1→0 signal for the selected **Pulse Length**.
   - **Pattern Stamper** – stamp a saved pattern at the clicked location. Use **Save Pattern** to store the current live cells.

This scaffolding separates UI from simulation logic to allow future growth. Upcoming work will add pulse direction, folding geometry and substrate density.

The project is released under the MIT License (see `LICENSE`).
