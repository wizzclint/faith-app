import { createAudioPlayer } from "expo-audio";
import { useSettingsStore } from "../../store/settingsStore";

/**
 * Every sound effect FAITH RUN plays. All placeholder CC0 assets (see
 * assets/audio/ATTRIBUTION.md) — swappable later without touching any of
 * the call sites below. No background music track yet.
 *
 * One player per sound, restarted from 0 on each trigger — simple and fine
 * for short, mostly non-overlapping SFX. A rapid-fire event (many coins in
 * one burst) will cut the previous instance short rather than layering;
 * good enough for a first pass, revisit with a small player pool per sound
 * if that turns out to feel wrong in practice.
 */
const players = {
  jump: createAudioPlayer(require("../../../assets/audio/jump.mp3")),
  slide: createAudioPlayer(require("../../../assets/audio/slide.mp3")),
  coin: createAudioPlayer(require("../../../assets/audio/coin.mp3")),
  powerUp: createAudioPlayer(require("../../../assets/audio/powerup.mp3")),
  collision: createAudioPlayer(require("../../../assets/audio/collision.mp3")),
  combo: createAudioPlayer(require("../../../assets/audio/combo.mp3")),
  gameOver: createAudioPlayer(require("../../../assets/audio/gameOver.mp3")),
  uiTap: createAudioPlayer(require("../../../assets/audio/uiTap.mp3")),
};

function play(player: (typeof players)[keyof typeof players]) {
  if (!useSettingsStore.getState().soundEnabled) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Non-fatal — a missing/broken player should never take gameplay down with it.
  }
}

export const soundManager = {
  playJump: () => play(players.jump),
  playSlide: () => play(players.slide),
  playCoin: () => play(players.coin),
  playPowerUp: () => play(players.powerUp),
  playCollision: () => play(players.collision),
  playCombo: () => play(players.combo),
  playGameOver: () => play(players.gameOver),
  playUiTap: () => play(players.uiTap),
};
