/**
 * FAITH RUN progression logic — pure functions, no I/O.
 *
 * Everything here runs entirely client-side against locally-persisted stats
 * (see profileStore.ts). There is no backend yet, so this is deliberately
 * built as an isolated, swappable service per the spec's Section 21 rule
 * ("use clearly isolated mock services — do not scatter fake data through
 * UI components") — when a real backend exists, only this file and the
 * store's persistence calls change; screens don't.
 *
 * Achievements and missions are scoped to what's honestly derivable from
 * real single-player telemetry today — nothing here fabricates progress
 * that didn't actually happen (no fake multiplayer wins, no fake balances).
 */

/** XP required to advance FROM this level to the next. Centralized so it's one dial to tune. */
export function xpRequiredForLevel(level: number): number {
  return 500 + (level - 1) * 250;
}

export interface AchievementDef {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_run", label: "First Run", icon: "🏁", description: "Complete your first run." },
  { id: "speed_demon", label: "Speed Demon", icon: "⚡", description: "Score 25,000+ in a single run." },
  { id: "collector", label: "Collector", icon: "🪙", description: "Collect 1,000 coins lifetime." },
  { id: "combo_master", label: "Combo Master", icon: "🔥", description: "Reach ×10 combo in a run." },
  { id: "marathon", label: "Marathon", icon: "🏃", description: "Complete 50 runs." },
];

export interface ProfileStats {
  totalRuns: number;
  totalCoins: number;
}

export interface RunResult {
  score: number;
  coins: number;
  combo: number;
  elapsedSec: number;
}

/** Which achievement ids newly unlock, given stats AFTER this run is folded in. */
export function checkNewlyUnlocked(
  statsAfter: ProfileStats,
  run: RunResult,
  alreadyUnlocked: string[]
): string[] {
  const unlocked = new Set(alreadyUnlocked);
  const fresh: string[] = [];

  const maybeUnlock = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) {
      unlocked.add(id);
      fresh.push(id);
    }
  };

  maybeUnlock("first_run", statsAfter.totalRuns >= 1);
  maybeUnlock("speed_demon", run.score >= 25000);
  maybeUnlock("collector", statsAfter.totalCoins >= 1000);
  maybeUnlock("combo_master", run.combo >= 10);
  maybeUnlock("marathon", statsAfter.totalRuns >= 50);

  return fresh;
}

/** XP awarded for one run — distance/score-driven, coins add a little extra. */
export function xpForRun(run: RunResult): number {
  return Math.round(run.score / 20) + run.coins * 2;
}

export interface DailyMissionDef {
  id: string;
  label: string;
  target: number;
  xpReward: number;
  /** How this mission's progress is measured against a single run's result. */
  metric: "runsPlayed" | "bestScore" | "coinsToday" | "survivalSec";
}

const DAILY_MISSION_POOL: DailyMissionDef[] = [
  { id: "play_3", label: "Play 3 runs", target: 3, xpReward: 100, metric: "runsPlayed" },
  { id: "score_10k", label: "Score 10,000 in one run", target: 10000, xpReward: 150, metric: "bestScore" },
  { id: "coins_50", label: "Collect 50 coins today", target: 50, xpReward: 100, metric: "coinsToday" },
  { id: "survive_60", label: "Survive 60 seconds in one run", target: 60, xpReward: 150, metric: "survivalSec" },
  { id: "score_20k", label: "Score 20,000 in one run", target: 20000, xpReward: 250, metric: "bestScore" },
];

/** Deterministic per-day pick so the same day's missions don't reshuffle on every app open. */
export function missionsForDate(dateKey: string): DailyMissionDef[] {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const startIndex = hash % DAILY_MISSION_POOL.length;
  const picked: DailyMissionDef[] = [];
  for (let i = 0; i < 3; i += 1) {
    picked.push(DAILY_MISSION_POOL[(startIndex + i) % DAILY_MISSION_POOL.length]);
  }
  return picked;
}

export interface DailyChallengeDef {
  id: string;
  label: string;
  xpReward: number;
  target: number;
  metric: "survivalSec" | "bestScore";
}

const DAILY_CHALLENGE_POOL: DailyChallengeDef[] = [
  { id: "survive_90", label: "Survive 90 seconds", xpReward: 500, target: 90, metric: "survivalSec" },
  { id: "score_30k", label: "Score 30,000 in one run", xpReward: 500, target: 30000, metric: "bestScore" },
  { id: "survive_120", label: "Survive 2 minutes", xpReward: 650, target: 120, metric: "survivalSec" },
];

export function challengeForDate(dateKey: string): DailyChallengeDef {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 17 + dateKey.charCodeAt(i)) >>> 0;
  }
  return DAILY_CHALLENGE_POOL[hash % DAILY_CHALLENGE_POOL.length];
}

/** Local date key (YYYY-MM-DD) — streaks/missions reset on the day boundary, not a rolling 24h window. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isConsecutiveDay(previousKey: string, currentKey: string): boolean {
  const prev = new Date(previousKey);
  const curr = new Date(currentKey);
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}
