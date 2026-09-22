import { Circle, Group } from "@shopify/react-native-skia";
import React from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { PIXELS_PER_UNIT } from "../../game/constants";
import { CoinSlot } from "../../game/types";

const COIN_RADIUS = 14;
const OFFSCREEN = -2000;

interface CoinSpriteProps {
  coins: SharedValue<CoinSlot[]>;
  distance: SharedValue<number>;
  index: number;
  laneX: number[];
  topY: number;
}

/**
 * Flat solid fills, hidden by moving off-screen when inactive — the earlier
 * version used a radial gradient + blur + Group opacity to fake a glowing
 * orb, which turned out invisible on a real device (confirmed: score still
 * climbed normally, so spawning/collision were always fine — only that
 * render path was broken). This uses only the same plain Circle+color
 * primitives already proven to render correctly (player sprite, ground
 * line). Can revisit the glow effect later once this baseline is confirmed.
 */
export function CoinSprite({ coins, distance, index, laneX, topY }: CoinSpriteProps) {
  const cy = useDerivedValue(() => {
    const slot = coins.value[index];
    if (slot.active !== 1) return OFFSCREEN;
    return topY + (distance.value - slot.spawnDistance) * PIXELS_PER_UNIT;
  });
  const cx = useDerivedValue(() => laneX[coins.value[index].lane] ?? laneX[1]);

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={COIN_RADIUS} color={colors.accent} />
      <Circle cx={cx} cy={cy} r={COIN_RADIUS * 0.55} color={colors.textPrimary} />
    </Group>
  );
}
