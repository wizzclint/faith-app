# Sound effects — attribution

Source: **Interface Sounds** and **Impact Sounds** by Kenney (kenney.nl)
https://kenney.nl/assets/interface-sounds
https://kenney.nl/assets/impact-sounds

License: **CC0 1.0** — free to use in personal, educational, and commercial
projects, written permission not required.

Original files are `.ogg` (not supported by iOS's audio stack) — converted
to `.mp3` via ffmpeg for cross-platform playback. Mapping:

| File | Source |
|---|---|
| `jump.mp3` | Interface Sounds — `select_001.ogg` |
| `slide.mp3` | Interface Sounds — `switch_001.ogg` |
| `coin.mp3` | Interface Sounds — `confirmation_002.ogg` |
| `powerup.mp3` | Interface Sounds — `maximize_003.ogg` |
| `collision.mp3` | Impact Sounds — `impactMetal_heavy_002.ogg` |
| `combo.mp3` | Interface Sounds — `tick_001.ogg` |
| `gameOver.mp3` | Interface Sounds — `error_003.ogg` |
| `uiTap.mp3` | Interface Sounds — `click_001.ogg` |

All placeholder per the FAITH RUN asset strategy — swappable later without
touching call sites (see `src/game/audio/soundManager.ts`). No background
music yet.
