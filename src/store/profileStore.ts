import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  checkNewlyUnlocked,
  DailyChallengeDef,
  DailyMissionDef,
  RunResult,
  challengeForDate,
  isConsecutiveDay,
  missionsForDate,
  todayKey,
  xpForRun,
  xpRequiredForLevel,
} from "../game/progression";

const PROFILE_STORAGE_KEY = "faith-run:profile";

interface DailyProgress {
  date: string;
  runsPlayed: number;
  bestScore: number;
  coinsToday: number;
  longestSurvivalSec: number;
  challengeCompleted: boolean;
  missionsCompleted: string[];
}

function freshDailyProgress(date: string): DailyProgress {
  return {
    date,
    runsPlayed: 0,
    bestScore: 0,
    coinsToday: 0,
    longestSurvivalSec: 0,
    challengeCompleted: false,
    missionsCompleted: [],
  };
}

interface ProfileState {
  loaded: boolean;
  level: number;
  xp: number;
  totalRuns: number;
  totalCoins: number;
  currentStreak: number;
  lastPlayedDate: string | null;
  achievementsUnlocked: string[];
  daily: DailyProgress;
  /** Achievements unlocked by the most recently ended run — for a one-shot toast/animation. */
  lastUnlocked: string[];

  load: () => Promise<void>;
  awardRunResult: (run: RunResult) => Promise<void>;
  dismissLastUnlocked: () => void;
}

function persist(state: ProfileState) {
  const { level, xp, totalRuns, totalCoins, currentStreak, lastPlayedDate, achievementsUnlocked, daily } =
    state;
  AsyncStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify({
      level,
      xp,
      totalRuns,
      totalCoins,
      currentStreak,
      lastPlayedDate,
      achievementsUnlocked,
      daily,
    })
  ).catch(() => {
    // Non-fatal — progression just won't persist this session.
  });
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  loaded: false,
  level: 1,
  xp: 0,
  totalRuns: 0,
  totalCoins: 0,
  currentStreak: 0,
  lastPlayedDate: null,
  achievementsUnlocked: [],
  daily: freshDailyProgress(todayKey()),
  lastUnlocked: [],

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) {
        set({ loaded: true });
        return;
      }
      const parsed = JSON.parse(raw);
      const today = todayKey();
      const daily: DailyProgress =
        parsed.daily?.date === today ? parsed.daily : freshDailyProgress(today);
      set({
        level: parsed.level ?? 1,
        xp: parsed.xp ?? 0,
        totalRuns: parsed.totalRuns ?? 0,
        totalCoins: parsed.totalCoins ?? 0,
        currentStreak: parsed.currentStreak ?? 0,
        lastPlayedDate: parsed.lastPlayedDate ?? null,
        achievementsUnlocked: parsed.achievementsUnlocked ?? [],
        daily,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  awardRunResult: async (run) => {
    const state = get();
    const today = todayKey();

    // --- streak ---
    let currentStreak = state.currentStreak;
    if (state.lastPlayedDate !== today) {
      if (state.lastPlayedDate && isConsecutiveDay(state.lastPlayedDate, today)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }

    // --- daily progress (reset if the day rolled over) ---
    const daily: DailyProgress = state.daily.date === today ? { ...state.daily } : freshDailyProgress(today);
    daily.runsPlayed += 1;
    daily.bestScore = Math.max(daily.bestScore, run.score);
    daily.coinsToday += run.coins;
    daily.longestSurvivalSec = Math.max(daily.longestSurvivalSec, run.elapsedSec);

    const missions: DailyMissionDef[] = missionsForDate(today);
    const missionsCompleted = new Set(daily.missionsCompleted);
    let missionXp = 0;
    for (const mission of missions) {
      if (missionsCompleted.has(mission.id)) continue;
      const progress =
        mission.metric === "runsPlayed"
          ? daily.runsPlayed
          : mission.metric === "bestScore"
            ? daily.bestScore
            : mission.metric === "coinsToday"
              ? daily.coinsToday
              : daily.longestSurvivalSec;
      if (progress >= mission.target) {
        missionsCompleted.add(mission.id);
        missionXp += mission.xpReward;
      }
    }
    daily.missionsCompleted = Array.from(missionsCompleted);

    const challenge: DailyChallengeDef = challengeForDate(today);
    let challengeXp = 0;
    if (!daily.challengeCompleted) {
      const progress = challenge.metric === "survivalSec" ? daily.longestSurvivalSec : daily.bestScore;
      if (progress >= challenge.target) {
        daily.challengeCompleted = true;
        challengeXp = challenge.xpReward;
      }
    }

    // --- XP / level ---
    let xp = state.xp + xpForRun(run) + missionXp + challengeXp;
    let level = state.level;
    while (xp >= xpRequiredForLevel(level)) {
      xp -= xpRequiredForLevel(level);
      level += 1;
    }

    const totalRuns = state.totalRuns + 1;
    const totalCoins = state.totalCoins + run.coins;

    const newlyUnlocked = checkNewlyUnlocked({ totalRuns, totalCoins }, run, state.achievementsUnlocked);
    const achievementsUnlocked = [...state.achievementsUnlocked, ...newlyUnlocked];

    const nextState: ProfileState = {
      ...state,
      level,
      xp,
      totalRuns,
      totalCoins,
      currentStreak,
      lastPlayedDate: today,
      achievementsUnlocked,
      daily,
      lastUnlocked: newlyUnlocked,
    };
    set(nextState);
    persist(nextState);
  },

  dismissLastUnlocked: () => set({ lastUnlocked: [] }),
}));
