/**
 * Core FAITH RUN game types.
 * Kept small and scoped to Phase 1 (the runner engine itself) — profile/session/
 * backend data models arrive in later phases per the FAITH RUN spec.
 */

/** Lane index: 0 = left, 1 = center, 2 = right. */
export type Lane = 0 | 1 | 2;

/** What a player must do to survive a given obstacle. */
export enum ObstacleKind {
  /** Low barrier — must jump over it. */
  Jump = 0,
  /** Overhead bar — must slide under it. */
  Slide = 1,
}

/** A single pooled obstacle slot (mutated in place inside the worklet loop). */
export interface ObstacleSlot {
  active: 0 | 1;
  lane: Lane;
  kind: ObstacleKind;
  /** World distance at which this obstacle was spawned. */
  spawnDistance: number;
  /** Set once the obstacle has been resolved (avoided) to avoid double-scoring. */
  resolved: 0 | 1;
}

/** A single pooled coin slot. */
export interface CoinSlot {
  active: 0 | 1;
  lane: Lane;
  spawnDistance: number;
}

/** The four FAITH RUN power-ups (spec section 10). */
export enum PowerUpKind {
  Shield = 0,
  Magnet = 1,
  Boost = 2,
  SecondChance = 3,
}

/** A single pooled power-up pickup slot. */
export interface PowerUpSlot {
  active: 0 | 1;
  lane: Lane;
  kind: PowerUpKind;
  spawnDistance: number;
}

/** Remaining active-duration (seconds) per power-up, synced to React for the HUD. */
export interface ActivePowerUps {
  shield: number;
  magnet: number;
  boost: number;
  secondChance: 0 | 1;
}

/** A single pooled particle (coin-collect / power-up-pickup bursts). */
export interface ParticleSlot {
  active: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds remaining; particle deactivates at 0. */
  life: number;
  maxLife: number;
  colorIndex: 0 | 1 | 2;
}

export type GameStatus = "idle" | "playing" | "gameOver";
