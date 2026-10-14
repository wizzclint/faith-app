import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
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
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <View style={styles.row}>
        <MaterialCommunityIcon name="fire" size={20} color={colors.fire} />
        <Text style={styles.combo}>{combo.toFixed(1)} COMBO</Text>
      </View>
      <View style={styles.underline} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  combo: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1,
  },
  underline: {
    alignSelf: "stretch",
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.borderStrong,
    marginTop: 3,
  },
});
