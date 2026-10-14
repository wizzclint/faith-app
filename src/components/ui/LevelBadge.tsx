import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";

interface LevelBadgeProps {
  level: number;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>LV {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentDeep,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    color: colors.accentBright,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
