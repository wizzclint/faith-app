import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";
import { spacing } from "../../design/spacing";
import { XPBar } from "./XPBar";

interface MissionCardProps {
  title: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

export function MissionCard({ title, progress, target, xpReward, completed }: MissionCardProps) {
  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.progressText}>
          {Math.min(progress, target)}/{target}
        </Text>
      </View>
      <XPBar current={progress} required={target} />
      <Text style={styles.reward}>{completed ? "✓ COMPLETED" : `+${xpReward} XP`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardCompleted: {
    borderColor: colors.accent,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  reward: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
});
