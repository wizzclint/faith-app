/**
 * Centralized FAITH RUN gameplay tuning values.
 * Nothing gameplay-related should be a magic number scattered in a component —
 * it belongs here so the feel of the game can be tuned from one place.
 */

export const LANE_COUNT = 3;

/** How many obstacle / coin slots are pre-allocated and reused (object pooling). */
export const OBSTACLE_POOL_SIZE = 6;
export const COIN_POOL_SIZE = 6;

/** World-units-per-second at speed multiplier 1.0. */
export const BASE_SPEED = 6;

/** Converts world distance travelled into on-screen pixels moved. */
export const PIXELS_PER_UNIT = 60;

/** Seconds between each difficulty stage bump. */
export const STAGE_DURATION_SEC = 15;

/** Speed multiplier per stage — matches the FAITH RUN design spec's stage table. */
export const SPEED_STAGES = [1.0, 1.15, 1.3, 1.5, 1.75];

/** After the last defined stage, keep creeping speed up slowly so it never plateaus. */
export const POST_STAGE_SPEED_GROWTH_PER_SEC = 0.01;

/** Base world-distance gap between obstacle spawns at stage-1 speed. */
export const BASE_SPAWN_GAP = 11;
/** Spawn gap never shrinks below this, so patterns always stay survivable. */
export const MIN_SPAWN_GAP = 6.5;

/** Base world-distance gap between coin spawns. */
export const COIN_SPAWN_GAP = 4.5;

/**
 * Chance an obstacle spawn also blocks a second, different lane.
 * With 3 lanes, blocking at most 2 always leaves one guaranteed clear path.
 */
export const TWO_LANE_PATTERN_CHANCE = 0.25;

/** How far above the player's lane a slot starts becoming visible on screen (px). */
export const SPAWN_MARGIN_PX = 40;

export const JUMP_DURATION_MS = 520;
export const JUMP_HEIGHT_PX = 130;
/** Player counts as "airborne enough" to clear a jump obstacle above this offset. */
export const JUMP_CLEAR_THRESHOLD_PX = 40;

export const SLIDE_DURATION_MS = 480;
/** Slide progress above this counts as "low enough" to clear an overhead obstacle. */
export const SLIDE_CLEAR_THRESHOLD = 0.4;

export const LANE_CHANGE_DURATION_MS = 150;

/** Minimum finger travel (px) before a swipe registers, so taps don't misfire. */
export const SWIPE_THRESHOLD_PX = 28;

export const COIN_SCORE = 10;
export const OBSTACLE_AVOID_SCORE = 5;
/** Score awarded per world-unit travelled, before the speed multiplier. */
export const DISTANCE_SCORE_RATE = 2;

/** How often (seconds) the worklet loop pushes score/coin updates back to React. */
export const HUD_SYNC_INTERVAL_SEC = 0.1;

export const BEST_SCORE_STORAGE_KEY = "faith-run:best-score";

// --- Combo system (spec section 13) ---
/** Combo multiplier increases by this much per successful avoid/coin. */
export const COMBO_STEP = 0.5;
/** Combo multiplier is uncapped in principle, but clamp for HUD sanity. */
export const COMBO_MAX = 20;

// --- Power-ups (spec section 10) ---
export const POWER_UP_POOL_SIZE = 3;
/** Base world-distance gap between power-up spawns — deliberately rarer than coins. */
export const POWER_UP_SPAWN_GAP = 28;
export const POWER_UP_SPAWN_CHANCE = 0.7;

export const SHIELD_DURATION_SEC = 12;
export const MAGNET_DURATION_SEC = 8;
export const MAGNET_CAPTURE_BAND_PX = 60;
export const BOOST_DURATION_SEC = 4;
export const BOOST_SPEED_MULTIPLIER = 1.6;
/** Brief invulnerability window granted right after a Second Chance save. */
export const SECOND_CHANCE_GRACE_SEC = 1.5;

// --- Visual polish (spec section 15 / Phase 3) ---
export const PARTICLE_POOL_SIZE = 24;
export const PARTICLES_PER_BURST = 6;
export const PARTICLE_LIFETIME_SEC = 0.45;
export const PARTICLE_SPEED_MIN = 60;
export const PARTICLE_SPEED_MAX = 160;
export const PARTICLE_GRAVITY = 220;

/** Crash screen-shake: initial offset (px) and how long it takes to settle. */
export const SHAKE_MAGNITUDE_PX = 14;
export const SHAKE_SETTLE_MS = 320;

/** Parallax layer scroll speeds, relative to the main world scroll. */
export const PARALLAX_FAR_FACTOR = 0.25;
export const PARALLAX_NEAR_FACTOR = 0.6;

/** Score count-up duration on the Game Over screen. */
export const SCORE_COUNT_UP_MS = 900;
