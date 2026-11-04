import { useEffect } from "react";
import { AppState } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useSettingsStore } from "../../store/settingsStore";

/** One bundled loop per game screen, released automatically on unmount. */
export function useGameMusic(active: boolean) {
  const player = useAudioPlayer(require("../../../assets/audio/faith-run-theme.m4a"));
  const enabled = useSettingsStore((s) => s.musicEnabled);
  const loaded = useSettingsStore((s) => s.loaded);
  const load = useSettingsStore((s) => s.load);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.24;
    const update = (state: string) => {
      if (active && enabled && loaded && state === "active") player.play();
      else player.pause();
    };
    update(AppState.currentState);
    const subscription = AppState.addEventListener("change", update);
    return () => {
      subscription.remove();
      player.pause();
    };
  }, [active, enabled, loaded, player]);
}
