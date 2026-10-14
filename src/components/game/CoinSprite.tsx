import { Circle, Group } from "@shopify/react-native-skia";
import React from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { PIXELS_PER_UNIT } from "../../game/constants";
import { CoinSlot } from "../../game/types";

const OFFSCREEN = -2000;

interface CoinSpriteProps {
  coins: SharedValue<CoinSlot[]>;
  distance: SharedValue<number>;
  index: number;
  laneX: number[];
  topY: number;
}

/**
 * A glowing orb built from stacked flat circles — no gradient, blur or Group
 * opacity, all of which rendered invisible on a real device. Hidden by
 * translating off-screen when inactive. Lane and y are read together in one
 * distance-driven worklet so the sprite always sits where the engine has it.
 */
export function CoinSprite({ coins, distance, index, laneX, topY }: CoinSpriteProps) {
  const transform = useDerivedValue(() => {
    const slot = coins.value[index];
    if (slot.active !== 1) return [{ translateX: OFFSCREEN }, { translateY: OFFSCREEN }];
    return [
      { translateX: laneX[slot.lane] ?? laneX[1] },
      { translateY: topY + (distance.value - slot.spawnDistance) * PIXELS_PER_UNIT },
    ];
  });

  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={23} color="rgba(0,226,174,0.14)" />
      <Circle cx={0} cy={0} r={18} color="rgba(0,226,174,0.26)" />
      <Circle cx={0} cy={0} r={14} color={colors.accent} />
      <Circle cx={0} cy={0} r={10} color="#0B5A4B" />
      <Circle cx={0} cy={0} r={7} color={colors.accentBright} />
      <Circle cx={0} cy={0} r={3.5} color={colors.textPrimary} />
    </Group>
  );
}
