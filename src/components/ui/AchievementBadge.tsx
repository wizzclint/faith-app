import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";

interface AchievementBadgeProps {
  icon: string;
  label: string;
  unlocked: boolean;
}

export function AchievementBadge({ icon, label, unlocked }: AchievementBadgeProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, !unlocked && styles.locked]}>
        <Text style={[styles.icon, !unlocked && styles.lockedIcon]}>{icon}</Text>
      </View>
      <Text style={[styles.label, !unlocked && styles.lockedLabel]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const SIZE = 56;

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: 76,
  },
  badge: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.largeCard,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  locked: {
    borderColor: colors.border,
  },
  icon: {
    fontSize: 24,
  },
  lockedIcon: {
    opacity: 0.35,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  lockedLabel: {
    color: colors.textMuted,
  },
});
