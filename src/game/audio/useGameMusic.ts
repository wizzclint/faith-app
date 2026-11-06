import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useSettingsStore } from "../../store/settingsStore";
import { bundledAudioSource } from "./bundledAudio";

/** Own creation and release together: no calls into an already-released player. */
export function useGameMusic(active: boolean) {
  const enabled = useSettingsStore((s) => s.musicEnabled);
  const loaded = useSettingsStore((s) => s.loaded);
  const load = useSettingsStore((s) => s.load);
  const shouldPlay = useRef(false);
  const updatePlayback = useRef<() => void>(() => {});
  shouldPlay.current = active && enabled && loaded;

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  useEffect(() => {
    let disposed = false;
    let player: ReturnType<typeof createAudioPlayer> | null = null;
    const update = () => {
      if (disposed || !player) return;
      try {
        if (shouldPlay.current && AppState.currentState === "active") player.play();
        else player.pause();
      } catch {
        // Audio failure must never close the game.
      }
    };
    updatePlayback.current = update;
    const subscription = AppState.addEventListener("change", update);

    void (async () => {
      const source = await bundledAudioSource(require("../../../assets/audio/faith-run-theme.m4a"));
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      if (disposed) return;
      player = createAudioPlayer(source);
      player.loop = true;
      player.volume = 0.35;
      update();
    })().catch(() => {
      console.warn("FAITH RUN music could not be loaded");
    });

    return () => {
      disposed = true;
      subscription.remove();
      updatePlayback.current = () => {};
      if (!player) return;
      try { player.pause(); } catch {}
      try { player.release(); } catch {}
      player = null;
    };
  }, []);

  useEffect(() => { updatePlayback.current(); }, [active, enabled, loaded]);
}
