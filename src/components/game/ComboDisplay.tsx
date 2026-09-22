import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { soundManager } from "../../game/audio/soundManager";

interface ComboDisplayProps {
  combo: number;
}

/** Pulses whenever the combo crosses a new whole number, then settles. */
export function ComboDisplay({ combo }: ComboDisplayProps) {
  const scale = useSharedValue(1);
  const lastWhole = useRef(Math.floor(combo));

  useEffect(() => {
    const whole = Math.floor(combo);
    if (whole > lastWhole.current) {
      lastWhole.current = whole;
      soundManager.playCombo();
      scale.value = withSequence(
        withTiming(1.35, { duration: 90 }),
        withTiming(1, { duration: 160 })
      );
    }
  }, [combo, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (combo < 1.5) return null;

  return (
    <Animated.Text style={[styles.combo, animatedStyle]}>
      ×{combo.toFixed(1)} COMBO
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  combo: {
    marginTop: 8,
    color: colors.accent,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
