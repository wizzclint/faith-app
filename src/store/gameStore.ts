import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { BEST_SCORE_STORAGE_KEY } from "../game/constants";
import { ActivePowerUps, GameStatus } from "../game/types";

const IDLE_POWER_UPS: ActivePowerUps = { shield: 0, magnet: 0, boost: 0, secondChance: 0 };

/**
 * React-facing game state.
 *
 * This store is intentionally NOT touched from the per-frame worklet loop —
 * the engine only calls into it a few times a second (HUD sync) or on
 * discrete events (game over), per the "engine drives, React reacts" rule.
 */
interface GameState {
  status: GameStatus;
  score: number;
  coins: number;
  combo: number;
  /** Seconds survived this run — kept in sync so progression can reward real telemetry. */
  elapsedSec: number;
  powerUps: ActivePowerUps;
  bestScore: number;
  bestScoreLoaded: boolean;

  loadBestScore: () => Promise<void>;
  startRun: () => void;
  tick: (score: number, coins: number, combo: number, powerUps: ActivePowerUps, elapsedSec: number) => void;
  endRun: (finalScore: number, finalCoins: number, finalElapsedSec: number) => void;
  resetToIdle: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: "idle",
  score: 0,
  coins: 0,
  combo: 1,
  elapsedSec: 0,
  powerUps: IDLE_POWER_UPS,
  bestScore: 0,
  bestScoreLoaded: false,

  loadBestScore: async () => {
    try {
      const raw = await AsyncStorage.getItem(BEST_SCORE_STORAGE_KEY);
      set({ bestScore: raw ? parseInt(raw, 10) || 0 : 0, bestScoreLoaded: true });
    } catch {
      set({ bestScoreLoaded: true });
    }
  },

  startRun: () =>
    set({ status: "playing", score: 0, coins: 0, combo: 1, elapsedSec: 0, powerUps: IDLE_POWER_UPS }),

  tick: (score, coins, combo, powerUps, elapsedSec) => set({ score, coins, combo, powerUps, elapsedSec }),

  endRun: (finalScore, finalCoins, finalElapsedSec) => {
    const { bestScore } = get();
    const nextBest = Math.max(bestScore, finalScore);
    set({
      status: "gameOver",
      score: finalScore,
      coins: finalCoins,
      elapsedSec: finalElapsedSec,
      bestScore: nextBest,
      powerUps: IDLE_POWER_UPS,
    });
    if (nextBest > bestScore) {
      AsyncStorage.setItem(BEST_SCORE_STORAGE_KEY, String(nextBest)).catch(() => {
        // Non-fatal — best score just won't persist this session.
      });
    }
  },

  resetToIdle: () =>
    set({ status: "idle", score: 0, coins: 0, combo: 1, elapsedSec: 0, powerUps: IDLE_POWER_UPS }),
}));
