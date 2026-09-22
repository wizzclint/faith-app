import React from "react";
import { Rect } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { PARALLAX_FAR_FACTOR, PARALLAX_NEAR_FACTOR } from "../../game/constants";

interface ParallaxBackgroundProps {
  distance: SharedValue<number>;
  width: number;
  topY: number;
  groundY: number;
}

const FAR_SEGMENTS = 5;
const NEAR_SEGMENTS = 4;

/**
 * A cheap placeholder sense of depth: two bands of horizontal streaks
 * scrolling toward the player at different rates. Not the "FAITH CITY"
 * skyline described in the spec — a swap-in target once real environment
 * art exists — but it reads as forward motion and speed today.
 */
export function ParallaxBackground({ distance, width, topY, groundY }: ParallaxBackgroundProps) {
  const range = groundY - topY;
  const farSpacing = range / FAR_SEGMENTS;
  const nearSpacing = range / NEAR_SEGMENTS;

  return (
    <>
      {Array.from({ length: FAR_SEGMENTS }).map((_, i) => (
        <FarStreak
          key={`far-${i}`}
          index={i}
          distance={distance}
          width={width}
          topY={topY}
          range={range}
          spacing={farSpacing}
        />
      ))}
      {Array.from({ length: NEAR_SEGMENTS }).map((_, i) => (
        <NearStreak
          key={`near-${i}`}
          index={i}
          distance={distance}
          width={width}
          topY={topY}
          range={range}
          spacing={nearSpacing}
        />
      ))}
    </>
  );
}

interface StreakProps {
  distance: SharedValue<number>;
  index: number;
  width: number;
  topY: number;
  range: number;
  spacing: number;
}

function FarStreak({ distance, index, width, topY, range, spacing }: StreakProps) {
  const y = useDerivedValue(() => {
    const offset = (distance.value * PARALLAX_FAR_FACTOR + index * spacing) % range;
    return topY + offset;
  });
  return <Rect x={0} y={y} width={width} height={1} color={colors.surfaceElevated} opacity={0.6} />;
}

function NearStreak({ distance, index, width, topY, range, spacing }: StreakProps) {
  const y = useDerivedValue(() => {
    const offset = (distance.value * PARALLAX_NEAR_FACTOR + index * spacing) % range;
    return topY + offset;
  });
  return <Rect x={0} y={y} width={width} height={2} color={colors.surfaceElevated} opacity={0.9} />;
}
