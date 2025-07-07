# Pulse-Core

Yay!

This project contains a simple pulse simulation playground. Open `index.html` in a browser to try it out.

## Usage

1. Click cells on the grid to activate them.
2. Press **Start** to run the simulation or **Stop** to pause.
3. Adjust **Pulse Length**, **Fold Threshold** and **Zoom** with the sliders. A threshold of 0 disables folding and folded cells appear dark gray.
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

This scaffolding separates UI from simulation logic to allow future growth. Upcoming work will add pulse direction, folding geometry and substrate density.

The project is released under the MIT License (see `LICENSE`).
