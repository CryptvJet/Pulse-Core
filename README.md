# Pulse-Core

This project contains a simple pulse simulation playground. Open `index.html` in a browser to try it out.

## Usage

1. Click cells on the grid to activate them. Brushed cells will blink once the
   simulation starts.
2. Press **Start** to run the simulation or **Stop** to pause. You can continue
   editing the grid while the simulation is running.
3. Adjust **Pulse Speed** and **Zoom** with the sliders.
4. Choose a tool from the **Tool** drop-down:
   - **Brush** – paint live cells.
   - **Eraser** – reset cells to 0.
   - **Pulse Injector** – inject a repeating 0→1→0 signal for the selected **Injector Length** and color.
   - **Pattern Stamper** – stamp a saved pattern at the clicked location. Use **Save Pattern** to store the current live cells.

Use the **Reverse** button to step backward through previous pulses. A color
picker lets you choose the color for brush strokes, injected pulses and stamped
patterns. The **Pulse Injector** tool creates explicit pulses, while brushed
cells simply toggle on each tick.

This scaffolding separates UI from simulation logic to allow future growth. Upcoming work will add pulse direction, folding geometry and substrate density.

The project is released under the MIT License (see `LICENSE`).
