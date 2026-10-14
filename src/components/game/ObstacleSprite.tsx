import { Group, RoundedRect } from "@shopify/react-native-skia";
import React from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { PIXELS_PER_UNIT } from "../../game/constants";
import { ObstacleKind, ObstacleSlot } from "../../game/types";

const BARRIER_WIDTH = 54;
const BARRIER_HEIGHT = 46;
const OVERHEAD_WIDTH = 58;
const OVERHEAD_HEIGHT = 30;
/**
 * How far above its collision line the overhead bar is drawn. Tuned so that on
 * the first frame a hit can register (line 26px above the ground), the bar
 * overlaps a standing player's head but clears the shorter slide pose.
 */
const OVERHEAD_LIFT = 44;
const OFFSCREEN = -2000;
const GLOW = 5;
const RIM = 4;

interface ObstacleSpriteProps {
  obstacles: SharedValue<ObstacleSlot[]>;
  distance: SharedValue<number>;
  index: number;
  laneX: number[];
  topY: number;
}

/**
 * Neon-outlined blocks built from stacked flat fills (halo, rim, dark core) —
 * the earlier gradient+blur+Group-opacity version rendered invisible on a
 * real device. Each variant is a Group translated to the slot's lane and y,
 * or off-screen when the slot is inactive or the other kind. Local origin is
 * the lane centre on the obstacle's collision line.
 */
export function ObstacleSprite({ obstacles, distance, index, laneX, topY }: ObstacleSpriteProps) {
  const barrierTransform = useDerivedValue(() => {
    const slot = obstacles.value[index];
    if (slot.active !== 1 || slot.kind !== ObstacleKind.Jump) {
      return [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
    }
    return [
      { translateX: laneX[slot.lane] ?? laneX[1] },
      { translateY: topY + (distance.value - slot.spawnDistance) * PIXELS_PER_UNIT },
    ];
  });

  const overheadTransform = useDerivedValue(() => {
    const slot = obstacles.value[index];
    if (slot.active !== 1 || slot.kind !== ObstacleKind.Slide) {
      return [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
    }
    return [
      { translateX: laneX[slot.lane] ?? laneX[1] },
      { translateY: topY + (distance.value - slot.spawnDistance) * PIXELS_PER_UNIT },
    ];
  });

  const overheadTop = -OVERHEAD_LIFT - OVERHEAD_HEIGHT;

  return (
    <>
      {/* Jump barrier — low ground hazard, must jump over it. */}
      <Group transform={barrierTransform}>
        <RoundedRect
          x={-BARRIER_WIDTH / 2 - GLOW}
          y={-BARRIER_HEIGHT - GLOW}
          width={BARRIER_WIDTH + GLOW * 2}
          height={BARRIER_HEIGHT + GLOW * 2}
          r={10}
          color="rgba(255,77,103,0.22)"
        />
        <RoundedRect
          x={-BARRIER_WIDTH / 2}
          y={-BARRIER_HEIGHT}
          width={BARRIER_WIDTH}
          height={BARRIER_HEIGHT}
          r={7}
          color={colors.danger}
        />
        <RoundedRect
          x={-BARRIER_WIDTH / 2 + RIM}
          y={-BARRIER_HEIGHT + RIM}
          width={BARRIER_WIDTH - RIM * 2}
          height={BARRIER_HEIGHT - RIM * 2}
          r={4}
          color="#4A0F1C"
        />
        <RoundedRect
          x={-BARRIER_WIDTH / 2 + 12}
          y={-BARRIER_HEIGHT / 2 - 3}
          width={BARRIER_WIDTH - 24}
          height={6}
          r={3}
          color={colors.danger}
        />
      </Group>

      {/* Overhead bar — must slide under it. */}
      <Group transform={overheadTransform}>
        <RoundedRect
          x={-OVERHEAD_WIDTH / 2 - GLOW}
          y={overheadTop - GLOW}
          width={OVERHEAD_WIDTH + GLOW * 2}
          height={OVERHEAD_HEIGHT + GLOW * 2}
          r={OVERHEAD_HEIGHT / 2 + GLOW}
          color="rgba(255,200,87,0.22)"
        />
        <RoundedRect
          x={-OVERHEAD_WIDTH / 2}
          y={overheadTop}
          width={OVERHEAD_WIDTH}
          height={OVERHEAD_HEIGHT}
          r={OVERHEAD_HEIGHT / 2}
          color={colors.warning}
        />
        <RoundedRect
          x={-OVERHEAD_WIDTH / 2 + RIM}
          y={overheadTop + RIM}
          width={OVERHEAD_WIDTH - RIM * 2}
          height={OVERHEAD_HEIGHT - RIM * 2}
          r={(OVERHEAD_HEIGHT - RIM * 2) / 2}
          color="#4D390C"
        />
      </Group>
    </>
  );
}
