import { Group, Path, Rect, RoundedRect, Skia } from "@shopify/react-native-skia";
import React from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { PIXELS_PER_UNIT } from "../../game/constants";
import { PowerUpKind, PowerUpSlot } from "../../game/types";

const OFFSCREEN = 2000;

interface PowerUpSpriteProps {
  powerUps: SharedValue<PowerUpSlot[]>;
  distance: SharedValue<number>;
  index: number;
  laneX: number[];
  topY: number;
}

/**
 * Hand-drawn Skia vector icons for the four power-ups. Visibility is driven
 * by translating off-screen rather than opacity — the earlier Group-opacity
 * + Blur version rendered invisible on a real device (confirmed the engine
 * itself was always fine: scoring/collision never depended on this). This
 * uses only Group `transform`, the same mechanism already proven to work
 * for the crash screen-shake effect, plus plain flat-color fills.
 */
function buildShieldPath() {
  const path = Skia.Path.Make();
  path.moveTo(-14, -16);
  path.lineTo(14, -16);
  path.lineTo(14, 2);
  path.lineTo(0, 16);
  path.lineTo(-14, 2);
  path.close();
  return path;
}

function buildBoltPath() {
  const path = Skia.Path.Make();
  path.moveTo(4, -16);
  path.lineTo(-8, 2);
  path.lineTo(0, 2);
  path.lineTo(-4, 16);
  path.lineTo(8, -2);
  path.lineTo(0, -2);
  path.close();
  return path;
}

/** 4-pointed sparkle: 8 vertices alternating outer/inner radius every 45°. */
function buildSparklePath() {
  const path = Skia.Path.Make();
  const outerR = 16;
  const innerR = 6;
  for (let i = 0; i < 8; i += 1) {
    const angle = ((-90 + i * 45) * Math.PI) / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.close();
  return path;
}

const SHIELD_PATH = buildShieldPath();
const BOLT_PATH = buildBoltPath();
const SPARKLE_PATH = buildSparklePath();

export function PowerUpSprite({ powerUps, distance, index, laneX, topY }: PowerUpSpriteProps) {
  const transform = useDerivedValue(() => {
    const slot = powerUps.value[index];
    if (slot.active !== 1) return [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
    const screenY = topY + (distance.value - slot.spawnDistance) * PIXELS_PER_UNIT;
    const cx = laneX[slot.lane] ?? laneX[1];
    return [{ translateX: cx }, { translateY: screenY }];
  });

  const shieldLocal = useDerivedValue(() => {
    const show = powerUps.value[index].kind === PowerUpKind.Shield;
    return show ? [{ translateX: 0 }, { translateY: 0 }] : [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
  });
  const boostLocal = useDerivedValue(() => {
    const show = powerUps.value[index].kind === PowerUpKind.Boost;
    return show ? [{ translateX: 0 }, { translateY: 0 }] : [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
  });
  const magnetLocal = useDerivedValue(() => {
    const show = powerUps.value[index].kind === PowerUpKind.Magnet;
    return show ? [{ translateX: 0 }, { translateY: 0 }] : [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
  });
  const secondChanceLocal = useDerivedValue(() => {
    const show = powerUps.value[index].kind === PowerUpKind.SecondChance;
    return show ? [{ translateX: 0 }, { translateY: 0 }] : [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
  });

  return (
    <Group transform={transform}>
      <Group transform={shieldLocal}>
        <Path path={SHIELD_PATH} color={colors.accentSecondary} />
        <Path path={SHIELD_PATH} color={colors.accent} style="stroke" strokeWidth={1.5} />
      </Group>

      <Group transform={boostLocal}>
        <Path path={BOLT_PATH} color={colors.warning} />
      </Group>

      <Group transform={magnetLocal}>
        <RoundedRect x={-14} y={-16} width={8} height={24} r={3} color={colors.textSecondary} />
        <RoundedRect x={6} y={-16} width={8} height={24} r={3} color={colors.textSecondary} />
        <RoundedRect x={-14} y={4} width={28} height={10} r={4} color={colors.textSecondary} />
        <Rect x={-14} y={-16} width={8} height={6} color={colors.danger} />
        <Rect x={6} y={-16} width={8} height={6} color={colors.accentSecondary} />
      </Group>

      <Group transform={secondChanceLocal}>
        <Path path={SPARKLE_PATH} color={colors.success} />
      </Group>
    </Group>
  );
}
