import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const SETTINGS_STORAGE_KEY = "faith-run:settings";

interface SettingsState {
  loaded: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;

  load: () => Promise<void>;
  toggle: (key: "soundEnabled" | "musicEnabled" | "vibrationEnabled" | "notificationsEnabled") => void;
}

function persist(state: SettingsState) {
  const { soundEnabled, musicEnabled, vibrationEnabled, notificationsEnabled } = state;
  AsyncStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ soundEnabled, musicEnabled, vibrationEnabled, notificationsEnabled })
  ).catch(() => {
    // Non-fatal — settings just won't persist this session.
  });
}

/**
 * Sound/Music toggles are real settings but there's no audio system wired up
 * yet (spec section 24 is still unimplemented) — flipping them is currently
 * inert. This store exists now so the eventual audio manager has one real
 * source of truth to read from, rather than adding another store later.
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          soundEnabled: parsed.soundEnabled ?? true,
          musicEnabled: parsed.musicEnabled ?? true,
          vibrationEnabled: parsed.vibrationEnabled ?? true,
          notificationsEnabled: parsed.notificationsEnabled ?? true,
          loaded: true,
        });
        return;
      }
      set({ loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggle: (key) => {
    const next = { ...get(), [key]: !get()[key] };
    set(next);
    persist(next);
  },
}));
