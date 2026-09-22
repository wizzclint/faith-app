import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";

interface XPBarProps {
  current: number;
  required: number;
  height?: number;
}

export function XPBar({ current, required, height = 8 }: XPBarProps) {
  const pct = required > 0 ? Math.min(1, Math.max(0, current / required)) : 0;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct * 100}%`, height, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: radius.smallCard,
  },
});
