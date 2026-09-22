import { useCallback, useEffect, useMemo } from "react";
import {
  Easing,
  runOnJS,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { soundManager } from "../audio/soundManager";
import { useGameStore } from "../../store/gameStore";
import {
  BASE_SPAWN_GAP,
  BASE_SPEED,
  BOOST_DURATION_SEC,
  BOOST_SPEED_MULTIPLIER,
  COIN_POOL_SIZE,
  COIN_SCORE,
  COIN_SPAWN_GAP,
  COMBO_MAX,
  COMBO_STEP,
  DISTANCE_SCORE_RATE,
  HUD_SYNC_INTERVAL_SEC,
  JUMP_CLEAR_THRESHOLD_PX,
  JUMP_DURATION_MS,
  JUMP_HEIGHT_PX,
  LANE_CHANGE_DURATION_MS,
  LANE_COUNT,
  MAGNET_CAPTURE_BAND_PX,
  MAGNET_DURATION_SEC,
  MIN_SPAWN_GAP,
  OBSTACLE_AVOID_SCORE,
  OBSTACLE_POOL_SIZE,
  PARTICLE_GRAVITY,
  PARTICLE_LIFETIME_SEC,
  PARTICLE_POOL_SIZE,
  PARTICLE_SPEED_MAX,
  PARTICLE_SPEED_MIN,
  PARTICLES_PER_BURST,
  PIXELS_PER_UNIT,
  POST_STAGE_SPEED_GROWTH_PER_SEC,
  POWER_UP_POOL_SIZE,
  POWER_UP_SPAWN_CHANCE,
  POWER_UP_SPAWN_GAP,
  SECOND_CHANCE_GRACE_SEC,
  SHAKE_MAGNITUDE_PX,
  SHAKE_SETTLE_MS,
  SHIELD_DURATION_SEC,
  SLIDE_CLEAR_THRESHOLD,
  SLIDE_DURATION_MS,
  SPEED_STAGES,
  STAGE_DURATION_SEC,
  TWO_LANE_PATTERN_CHANCE,
} from "../constants";
import {
  ActivePowerUps,
  CoinSlot,
  Lane,
  ObstacleKind,
  ObstacleSlot,
  ParticleSlot,
  PowerUpKind,
  PowerUpSlot,
} from "../types";

/** Player counts as "hit" only within this many px of the ground/collision line. */
const HIT_BAND_PX = 26;
/** Once a resolved slot has scrolled this far past the player, it's freed back to the pool. */
const RELEASE_BAND_PX = HIT_BAND_PX * 3;

function makeObstaclePool(): ObstacleSlot[] {
  return Array.from({ length: OBSTACLE_POOL_SIZE }, () => ({
    active: 0,
    lane: 1 as Lane,
    kind: ObstacleKind.Jump,
    spawnDistance: 0,
    resolved: 0,
  }));
}

function makeCoinPool(): CoinSlot[] {
  return Array.from({ length: COIN_POOL_SIZE }, () => ({
    active: 0,
    lane: 1 as Lane,
    spawnDistance: 0,
  }));
}

function makePowerUpPool(): PowerUpSlot[] {
  return Array.from({ length: POWER_UP_POOL_SIZE }, () => ({
    active: 0,
    lane: 1 as Lane,
    kind: PowerUpKind.Shield,
    spawnDistance: 0,
  }));
}

function makeParticlePool(): ParticleSlot[] {
  return Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
    active: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: PARTICLE_LIFETIME_SEC,
    colorIndex: 0 as const,
  }));
}

export interface RunnerEngineConfig {
  /** Screen x-center for each lane, length === LANE_COUNT. */
  laneX: number[];
  /** Y where obstacles/coins first become visible (far away). */
  topY: number;
  /** Y of the player's row / the collision line. */
  groundY: number;
}

/**
 * The FAITH RUN core loop.
 *
 * Everything gameplay-related (position, spawning, collision, scoring, combo,
 * power-ups) lives in Reanimated shared values and runs inside a single
 * UI-thread frame callback — React never re-renders per frame. React only
 * finds out about the game via a throttled HUD sync (~10x/sec) and a single
 * "game over" event when a run ends.
 */
export function useRunnerEngine({ laneX, topY, groundY }: RunnerEngineConfig) {
  /**
   * Collision uses actual on-screen X distance to playerX (the same value
   * that drives the rendered sprite), not a discrete lane-index match.
   * playerLane updates the instant a swipe is registered, but the sprite
   * takes LANE_CHANGE_DURATION_MS to visually glide there — comparing
   * against playerLane alone let a hit register for a lane the character
   * hadn't visually reached yet (or let one visually still overlapping be
   * dodged early). Tying collision to playerX guarantees it always matches
   * what's actually drawn.
   */
  const laneSpacing = laneX.length > 1 ? Math.abs(laneX[1] - laneX[0]) : 100;
  const LANE_HIT_TOLERANCE = laneSpacing * 0.42;

  const playerLane = useSharedValue<Lane>(1);
  const playerX = useSharedValue(laneX[1] ?? 0);
  /** 0 = grounded, >0 = airborne (px above ground). */
  const jumpOffset = useSharedValue(0);
  /** 0 = standing, >SLIDE_CLEAR_THRESHOLD = low enough to clear an overhead obstacle. */
  const slideProgress = useSharedValue(0);

  const distance = useSharedValue(0);
  const speed = useSharedValue(SPEED_STAGES[0]);
  const elapsed = useSharedValue(0);

  const obstacles = useSharedValue<ObstacleSlot[]>(makeObstaclePool());
  const coins = useSharedValue<CoinSlot[]>(makeCoinPool());
  const powerUpSlots = useSharedValue<PowerUpSlot[]>(makePowerUpPool());
  const particles = useSharedValue<ParticleSlot[]>(makeParticlePool());

  /** Screen-shake offset applied to the whole scene; decays to 0 after a crash. */
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  const lastObstacleSpawnDistance = useSharedValue(0);
  const lastCoinSpawnDistance = useSharedValue(0);
  const lastPowerUpSpawnDistance = useSharedValue(0);
  const spawnGap = useSharedValue(BASE_SPAWN_GAP);

  const scoreSV = useSharedValue(0);
  const coinsCollectedSV = useSharedValue(0);
  const comboSV = useSharedValue(1);
  const hudSyncTimer = useSharedValue(0);
  const isActive = useSharedValue(0);

  // --- active power-up timers (seconds remaining; 0 = inactive) ---
  const shieldTimer = useSharedValue(0);
  const magnetTimer = useSharedValue(0);
  const boostTimer = useSharedValue(0);
  const secondChanceAvailable = useSharedValue<0 | 1>(0);
  const graceTimer = useSharedValue(0);

  const tick = useGameStore((s) => s.tick);
  const endRun = useGameStore((s) => s.endRun);

  const handleHudSync = useCallback(
    (score: number, coinCount: number, combo: number, powerUps: ActivePowerUps, elapsedSec: number) => {
      tick(score, coinCount, combo, powerUps, elapsedSec);
    },
    [tick]
  );

  const handleCrash = useCallback(
    (finalScore: number, finalCoins: number, finalElapsedSec: number) => {
      soundManager.playCollision();
      endRun(finalScore, finalCoins, finalElapsedSec);
    },
    [endRun]
  );

  const frameCallback = useFrameCallback((frame) => {
    "worklet";
    if (isActive.value !== 1) return;
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;

    elapsed.value += dt;

    // --- power-up timers count down every frame regardless of anything else ---
    shieldTimer.value = Math.max(0, shieldTimer.value - dt);
    magnetTimer.value = Math.max(0, magnetTimer.value - dt);
    boostTimer.value = Math.max(0, boostTimer.value - dt);
    graceTimer.value = Math.max(0, graceTimer.value - dt);

    // --- difficulty ramp (matches the FAITH RUN stage table, then creeps on) ---
    const stageIndex = Math.min(
      Math.floor(elapsed.value / STAGE_DURATION_SEC),
      SPEED_STAGES.length - 1
    );
    const stagesElapsed = elapsed.value - SPEED_STAGES.length * STAGE_DURATION_SEC;
    speed.value =
      stagesElapsed > 0
        ? SPEED_STAGES[SPEED_STAGES.length - 1] + stagesElapsed * POST_STAGE_SPEED_GROWTH_PER_SEC
        : SPEED_STAGES[stageIndex];

    spawnGap.value = Math.max(MIN_SPAWN_GAP, BASE_SPAWN_GAP / speed.value);

    // --- world scroll (Boost temporarily multiplies effective speed) ---
    const effectiveSpeed = speed.value * (boostTimer.value > 0 ? BOOST_SPEED_MULTIPLIER : 1);
    distance.value += effectiveSpeed * BASE_SPEED * dt;

    // --- spawn obstacles — usually one lane, occasionally two (never all three) ---
    if (distance.value - lastObstacleSpawnDistance.value >= spawnGap.value) {
      lastObstacleSpawnDistance.value = distance.value;
      const primaryLane = Math.floor(Math.random() * LANE_COUNT) as Lane;
      const slot = obstacles.value.find((o) => o.active === 0);
      if (slot) {
        slot.active = 1;
        slot.resolved = 0;
        slot.lane = primaryLane;
        slot.kind = Math.random() < 0.5 ? ObstacleKind.Jump : ObstacleKind.Slide;
        slot.spawnDistance = distance.value;
      }

      if (Math.random() < TWO_LANE_PATTERN_CHANCE) {
        const otherLanes = ([0, 1, 2] as Lane[]).filter((l) => l !== primaryLane);
        const secondaryLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const secondSlot = obstacles.value.find((o) => o.active === 0);
        if (secondSlot) {
          secondSlot.active = 1;
          secondSlot.resolved = 0;
          secondSlot.lane = secondaryLane;
          secondSlot.kind = Math.random() < 0.5 ? ObstacleKind.Jump : ObstacleKind.Slide;
          secondSlot.spawnDistance = distance.value;
        }
      }
    }

    // --- spawn coins ---
    if (distance.value - lastCoinSpawnDistance.value >= COIN_SPAWN_GAP) {
      lastCoinSpawnDistance.value = distance.value;
      if (Math.random() < 0.8) {
        const slot = coins.value.find((c) => c.active === 0);
        if (slot) {
          slot.active = 1;
          slot.lane = Math.floor(Math.random() * LANE_COUNT) as Lane;
          slot.spawnDistance = distance.value;
        }
      }
    }

    // --- spawn power-ups (rare) ---
    if (distance.value - lastPowerUpSpawnDistance.value >= POWER_UP_SPAWN_GAP) {
      lastPowerUpSpawnDistance.value = distance.value;
      if (Math.random() < POWER_UP_SPAWN_CHANCE) {
        const slot = powerUpSlots.value.find((p) => p.active === 0);
        if (slot) {
          slot.active = 1;
          slot.lane = Math.floor(Math.random() * LANE_COUNT) as Lane;
          slot.kind = Math.floor(Math.random() * 4) as PowerUpKind;
          slot.spawnDistance = distance.value;
        }
      }
    }

    // --- advance + resolve obstacles ---
    for (const o of obstacles.value) {
      if (o.active !== 1) continue;
      const screenY = topY + (distance.value - o.spawnDistance) * PIXELS_PER_UNIT;
      const obstacleCx = laneX[o.lane] ?? laneX[1];
      const laneMatches = Math.abs(playerX.value - obstacleCx) < LANE_HIT_TOLERANCE;

      if (Math.abs(screenY - groundY) < HIT_BAND_PX && laneMatches) {
        const cleared =
          graceTimer.value > 0 ||
          (o.kind === ObstacleKind.Jump
            ? jumpOffset.value > JUMP_CLEAR_THRESHOLD_PX
            : slideProgress.value > SLIDE_CLEAR_THRESHOLD);

        if (!cleared) {
          if (shieldTimer.value > 0) {
            shieldTimer.value = 0;
            comboSV.value = 1;
            o.active = 0;
            continue;
          }
          if (secondChanceAvailable.value === 1) {
            secondChanceAvailable.value = 0;
            graceTimer.value = SECOND_CHANCE_GRACE_SEC;
            comboSV.value = 1;
            o.active = 0;
            continue;
          }

          isActive.value = 0;
          shakeX.value = withSequence(
            withTiming(SHAKE_MAGNITUDE_PX, { duration: SHAKE_SETTLE_MS * 0.15 }),
            withTiming(-SHAKE_MAGNITUDE_PX * 0.7, { duration: SHAKE_SETTLE_MS * 0.2 }),
            withTiming(SHAKE_MAGNITUDE_PX * 0.4, { duration: SHAKE_SETTLE_MS * 0.25 }),
            withTiming(0, { duration: SHAKE_SETTLE_MS * 0.4 })
          );
          shakeY.value = withSequence(
            withTiming(-SHAKE_MAGNITUDE_PX * 0.6, { duration: SHAKE_SETTLE_MS * 0.18 }),
            withTiming(SHAKE_MAGNITUDE_PX * 0.5, { duration: SHAKE_SETTLE_MS * 0.22 }),
            withTiming(0, { duration: SHAKE_SETTLE_MS * 0.6 })
          );
          runOnJS(handleCrash)(
            Math.floor(scoreSV.value),
            Math.floor(coinsCollectedSV.value),
            Math.floor(elapsed.value)
          );
          return;
        }
      }

      if (screenY > groundY + HIT_BAND_PX) {
        if (!o.resolved) {
          o.resolved = 1;
          comboSV.value = Math.min(COMBO_MAX, comboSV.value + COMBO_STEP);
          scoreSV.value += OBSTACLE_AVOID_SCORE * comboSV.value;
        }
        if (screenY > groundY + RELEASE_BAND_PX) {
          o.active = 0;
        }
      }
    }

    // --- advance + resolve coins (Magnet widens the catch band and ignores lane) ---
    for (const c of coins.value) {
      if (c.active !== 1) continue;
      const screenY = topY + (distance.value - c.spawnDistance) * PIXELS_PER_UNIT;
      const magnetActive = magnetTimer.value > 0;
      const coinCx = laneX[c.lane] ?? laneX[1];
      const laneMatches = magnetActive || Math.abs(playerX.value - coinCx) < LANE_HIT_TOLERANCE;
      const band = magnetActive ? MAGNET_CAPTURE_BAND_PX : HIT_BAND_PX;

      if (Math.abs(screenY - groundY) < band && laneMatches) {
        c.active = 0;
        coinsCollectedSV.value += 1;
        comboSV.value = Math.min(COMBO_MAX, comboSV.value + COMBO_STEP);
        scoreSV.value += COIN_SCORE * comboSV.value;
        runOnJS(soundManager.playCoin)();

        const coinX = laneX[c.lane] ?? laneX[1];
        let spawned = 0;
        for (const particle of particles.value) {
          if (spawned >= PARTICLES_PER_BURST) break;
          if (particle.active === 1) continue;
          const angle = Math.random() * Math.PI * 2;
          const spd = PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
          particle.active = 1;
          particle.x = coinX;
          particle.y = groundY;
          particle.vx = Math.cos(angle) * spd;
          particle.vy = Math.sin(angle) * spd;
          particle.life = PARTICLE_LIFETIME_SEC;
          particle.maxLife = PARTICLE_LIFETIME_SEC;
          particle.colorIndex = 1;
          spawned += 1;
        }
        continue;
      }
      if (screenY > groundY + RELEASE_BAND_PX) {
        c.active = 0;
      }
    }

    // --- advance + resolve power-ups ---
    for (const p of powerUpSlots.value) {
      if (p.active !== 1) continue;
      const screenY = topY + (distance.value - p.spawnDistance) * PIXELS_PER_UNIT;
      const powerUpCx = laneX[p.lane] ?? laneX[1];
      const laneMatches = Math.abs(playerX.value - powerUpCx) < LANE_HIT_TOLERANCE;

      if (Math.abs(screenY - groundY) < HIT_BAND_PX && laneMatches) {
        p.active = 0;
        if (p.kind === PowerUpKind.Shield) shieldTimer.value = SHIELD_DURATION_SEC;
        else if (p.kind === PowerUpKind.Magnet) magnetTimer.value = MAGNET_DURATION_SEC;
        else if (p.kind === PowerUpKind.Boost) boostTimer.value = BOOST_DURATION_SEC;
        else secondChanceAvailable.value = 1;
        runOnJS(soundManager.playPowerUp)();

        const pickupX = laneX[p.lane] ?? laneX[1];
        let spawnedPU = 0;
        for (const particle of particles.value) {
          if (spawnedPU >= PARTICLES_PER_BURST) break;
          if (particle.active === 1) continue;
          const angle = Math.random() * Math.PI * 2;
          const spd = PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
          particle.active = 1;
          particle.x = pickupX;
          particle.y = groundY;
          particle.vx = Math.cos(angle) * spd;
          particle.vy = Math.sin(angle) * spd;
          particle.life = PARTICLE_LIFETIME_SEC;
          particle.maxLife = PARTICLE_LIFETIME_SEC;
          particle.colorIndex = 2;
          spawnedPU += 1;
        }
        continue;
      }
      if (screenY > groundY + RELEASE_BAND_PX) {
        p.active = 0;
      }
    }

    // --- advance + cull particles ---
    for (const particle of particles.value) {
      if (particle.active !== 1) continue;
      particle.life -= dt;
      if (particle.life <= 0) {
        particle.active = 0;
        continue;
      }
      particle.vy += PARTICLE_GRAVITY * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }

    // --- continuous distance score (not combo-multiplied — a steady baseline) ---
    scoreSV.value += effectiveSpeed * dt * DISTANCE_SCORE_RATE;

    // --- throttled HUD sync (~10Hz, not every frame) ---
    hudSyncTimer.value += dt;
    if (hudSyncTimer.value >= HUD_SYNC_INTERVAL_SEC) {
      hudSyncTimer.value = 0;
      runOnJS(handleHudSync)(
        Math.floor(scoreSV.value),
        Math.floor(coinsCollectedSV.value),
        comboSV.value,
        {
          shield: Math.ceil(shieldTimer.value),
          magnet: Math.ceil(magnetTimer.value),
          boost: Math.ceil(boostTimer.value),
          secondChance: secondChanceAvailable.value,
        },
        Math.floor(elapsed.value)
      );
    }
  }, false);

  const start = useCallback(() => {
    playerLane.value = 1;
    playerX.value = laneX[1] ?? 0;
    jumpOffset.value = 0;
    slideProgress.value = 0;
    distance.value = 0;
    speed.value = SPEED_STAGES[0];
    elapsed.value = 0;
    obstacles.value = makeObstaclePool();
    coins.value = makeCoinPool();
    powerUpSlots.value = makePowerUpPool();
    particles.value = makeParticlePool();
    shakeX.value = 0;
    shakeY.value = 0;
    lastObstacleSpawnDistance.value = 0;
    lastCoinSpawnDistance.value = 0;
    lastPowerUpSpawnDistance.value = 0;
    spawnGap.value = BASE_SPAWN_GAP;
    scoreSV.value = 0;
    coinsCollectedSV.value = 0;
    comboSV.value = 1;
    hudSyncTimer.value = 0;
    shieldTimer.value = 0;
    magnetTimer.value = 0;
    boostTimer.value = 0;
    secondChanceAvailable.value = 0;
    graceTimer.value = 0;
    isActive.value = 1;
    frameCallback.setActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laneX]);

  const stop = useCallback(() => {
    isActive.value = 0;
    frameCallback.setActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Un-suspends the loop without resetting anything — unlike start(), which begins a fresh run. */
  const resume = useCallback(() => {
    isActive.value = 1;
    frameCallback.setActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => stop, [stop]);

  const moveLane = useMemo(
    () => ({
      left: () => {
        "worklet";
        const next = Math.max(0, playerLane.value - 1) as Lane;
        playerLane.value = next;
        playerX.value = withTiming(laneX[next], { duration: LANE_CHANGE_DURATION_MS });
      },
      right: () => {
        "worklet";
        const next = Math.min(LANE_COUNT - 1, playerLane.value + 1) as Lane;
        playerLane.value = next;
        playerX.value = withTiming(laneX[next], { duration: LANE_CHANGE_DURATION_MS });
      },
      jump: () => {
        "worklet";
        if (jumpOffset.value > 0 || slideProgress.value > 0) return;
        runOnJS(soundManager.playJump)();
        jumpOffset.value = withSequence(
          withTiming(JUMP_HEIGHT_PX, {
            duration: JUMP_DURATION_MS * 0.42,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, {
            duration: JUMP_DURATION_MS * 0.58,
            easing: Easing.in(Easing.quad),
          })
        );
      },
      slide: () => {
        "worklet";
        if (slideProgress.value > 0 || jumpOffset.value > 0) return;
        runOnJS(soundManager.playSlide)();
        const quick = SLIDE_DURATION_MS * 0.25;
        const hold = SLIDE_DURATION_MS * 0.5;
        slideProgress.value = withSequence(
          withTiming(1, { duration: quick }),
          withDelay(hold, withTiming(0, { duration: quick }))
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [laneX]
  );

  return {
    playerX,
    playerLane,
    jumpOffset,
    slideProgress,
    obstacles,
    coins,
    powerUpSlots,
    particles,
    shakeX,
    shakeY,
    distance,
    start,
    stop,
    resume,
    moveLane,
  };
}

export type RunnerEngine = ReturnType<typeof useRunnerEngine>;
