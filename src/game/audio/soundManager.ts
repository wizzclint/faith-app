import { createAudioPlayer } from "expo-audio";
import { useSettingsStore } from "../../store/settingsStore";
import { bundledAudioSource } from "./bundledAudio";

/**
 * Every sound effect FAITH RUN plays. All placeholder CC0 assets (see
 * assets/audio/ATTRIBUTION.md) — swappable later without touching any of
 * the call sites below. Music is managed separately by useGameMusic.
 *
 * One player per sound, restarted from 0 on each trigger — simple and fine
 * for short, mostly non-overlapping SFX. A rapid-fire event (many coins in
 * one burst) will cut the previous instance short rather than layering;
 * good enough for a first pass, revisit with a small player pool per sound
 * if that turns out to feel wrong in practice.
 */
const sources = {
  jump: require("../../../assets/audio/jump.mp3"),
  slide: require("../../../assets/audio/slide.mp3"),
  coin: require("../../../assets/audio/coin.mp3"),
  powerUp: require("../../../assets/audio/powerup.mp3"),
  collision: require("../../../assets/audio/collision.mp3"),
  combo: require("../../../assets/audio/combo.mp3"),
  gameOver: require("../../../assets/audio/gameOver.mp3"),
  uiTap: require("../../../assets/audio/uiTap.mp3"),
};
type Sound = keyof typeof sources;
const players = new Map<Sound, ReturnType<typeof createAudioPlayer>>();
let loading: Promise<void> | null = null;

export function prepareGameSounds(): Promise<void> {
  if (!loading) loading = Promise.all(Object.entries(sources).map(async ([name, asset]) => {
    try {
      const source = await bundledAudioSource(asset);
      players.set(name as Sound, createAudioPlayer(source));
    } catch {
      // A missing sound never prevents a run from starting.
    }
  })).then(() => {});
  return loading;
}

function play(name: Sound) {
  if (!useSettingsStore.getState().soundEnabled) return;
  const player = players.get(name);
  if (!player) { void prepareGameSounds(); return; }
  try {
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Non-fatal — a missing/broken player should never take gameplay down with it.
  }
}

export const soundManager = {
  playJump: () => play("jump"),
  playSlide: () => play("slide"),
  playCoin: () => play("coin"),
  playPowerUp: () => play("powerUp"),
  playCollision: () => play("collision"),
  playCombo: () => play("combo"),
  playGameOver: () => play("gameOver"),
  playUiTap: () => play("uiTap"),
};
