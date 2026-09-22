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
/** How far above the ground line the overhead bar floats (must duck/slide under it). */
const OVERHEAD_LIFT = 78;
const OFFSCREEN = -2000;

interface ObstacleSpriteProps {
  obstacles: SharedValue<ObstacleSlot[]>;
  distance: SharedValue<number>;
  index: number;
  laneX: number[];
  topY: number;
  groundY: number;
}

/**
 * Flat solid fills, hidden off-screen when inactive/wrong-kind — the earlier
 * gradient+blur+Group-opacity version rendered invisible on a real device
 * (confirmed: score still climbed and collisions still registered normally,
 * so spawning/positioning were always correct — only that render path was
 * broken). This uses only plain RoundedRect+color, the same primitives
 * already proven to render (player sprite, ground line). The two variants
 * share one Y source but hide independently based on which kind is active.
 */
export function ObstacleSprite({
  obstacles,
  distance,
  index,
  laneX,
  topY,
  groundY,
}: ObstacleSpriteProps) {
  const screenY = useDerivedValue(() => {
    const slot = obstacles.value[index];
    return topY + (distance.value - slot.spawnDistance) * PIXELS_PER_UNIT;
  });
  const cx = useDerivedValue(() => laneX[obstacles.value[index].lane] ?? laneX[1]);

  const barrierX = useDerivedValue(() => cx.value - BARRIER_WIDTH / 2);
  const barrierY = useDerivedValue(() => {
    const slot = obstacles.value[index];
    if (slot.active !== 1 || slot.kind !== ObstacleKind.Jump) return OFFSCREEN;
    return screenY.value - BARRIER_HEIGHT;
  });

  const overheadX = useDerivedValue(() => cx.value - OVERHEAD_WIDTH / 2);
  const overheadY = useDerivedValue(() => {
    const slot = obstacles.value[index];
    if (slot.active !== 1 || slot.kind !== ObstacleKind.Slide) return OFFSCREEN;
    return screenY.value - OVERHEAD_LIFT - OVERHEAD_HEIGHT;
  });

  return (
    <Group>
      {/* Jump barrier — low ground hazard, must jump over it. */}
      <RoundedRect
        x={barrierX}
        y={barrierY}
        width={BARRIER_WIDTH}
        height={BARRIER_HEIGHT}
        r={6}
        color={colors.danger}
      />

      {/* Overhead bar — must slide under it. */}
      <RoundedRect
        x={overheadX}
        y={overheadY}
        width={OVERHEAD_WIDTH}
        height={OVERHEAD_HEIGHT}
        r={OVERHEAD_HEIGHT / 2}
        color={colors.warning}
      />
    </Group>
  );
}
