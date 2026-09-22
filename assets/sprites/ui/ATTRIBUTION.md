# UI panel — attribution

Source: **UI Pack - Sci-Fi** by Kenney (kenney.nl)
https://kenney.nl/assets/ui-pack-sci-fi

License: **CC0 1.0** — free to use in personal, educational, and commercial
projects, written permission not required.

`panel_glass.png` is the pack's plain glass panel (Extra/Default), **recolored**
from its original light-gray palette to FAITH's dark/neon palette using a
custom luminance-mapped duotone script (`art-source/tools/recolor.js`) —
shadows → `colors.background`, body → a dark glass tone, the original white
highlight stroke → `colors.accent` as a neon edge-glow. Alpha/transparency
is untouched, so the panel's rounded corners are preserved exactly.

The rest of the pack (130 assets — buttons, bars, cursors, etc.) is
downloaded to `art-source/downloads/kenney-ui-sci-fi/` but not yet
integrated. The bar pieces (`bar_round_*_l/m/r.png`) are good future
material for a sci-fi-styled progress bar, but need a small 3-piece
compositing component to stretch correctly — not done yet, current
`XPBar`/`MissionCard` bars remain the plain code-styled version.
