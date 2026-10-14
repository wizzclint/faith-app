import React from "react";
import { Rect } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { PIXELS_PER_UNIT } from "../../game/constants";

interface FloorGridProps {
  distance: SharedValue<number>;
  width: number;
  height: number;
  topY: number;
}

const LINE_COUNT = 7;
const LINE_COLOR = "rgba(64,251,201,0.16)";

/**
 * Horizontal neon lines that scroll down the road at exactly the speed the
 * obstacles do, so the floor reads as moving under the player. Flat
 * semi-transparent fills only — the same primitives already proven on device.
 */
export function FloorGrid({ distance, width, height, topY }: FloorGridProps) {
  const range = height - topY;
  const spacing = range / LINE_COUNT;

  return (
    <>
      {Array.from({ length: LINE_COUNT }).map((_, i) => (
        <GridLine
          key={i}
          offset={i * spacing}
          distance={distance}
          width={width}
          topY={topY}
          range={range}
        />
      ))}
    </>
  );
}

interface GridLineProps {
  distance: SharedValue<number>;
  offset: number;
  width: number;
  topY: number;
  range: number;
}

function GridLine({ distance, offset, width, topY, range }: GridLineProps) {
  const y = useDerivedValue(() => topY + ((distance.value * PIXELS_PER_UNIT + offset) % range));
  return <Rect x={0} y={y} width={width} height={1.5} color={LINE_COLOR} />;
}
