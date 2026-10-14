import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { XPBar } from "./XPBar";

type MissionMetric = "runsPlayed" | "bestScore" | "coinsToday" | "survivalSec";
type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

const METRIC_ICONS: Record<MissionMetric, IconName> = {
  runsPlayed: "run-fast",
  bestScore: "trophy-variant",
  coinsToday: "circle-multiple",
  survivalSec: "timer-outline",
};

interface MissionCardProps {
  title: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
  metric?: MissionMetric;
}

export function MissionCard({ title, progress, target, xpReward, completed, metric }: MissionCardProps) {
  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <View style={[styles.iconTile, completed && styles.iconTileCompleted]}>
        <MaterialCommunityIcon
          name={metric ? METRIC_ICONS[metric] : "flag-checkered"}
          size={22}
          color={colors.accent}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.progressText, completed && styles.progressTextCompleted]}>
            {Math.min(progress, target)}/{target}
          </Text>
        </View>
        <XPBar current={progress} required={target} />
        <Text style={[styles.reward, completed && styles.rewardCompleted]}>
          {completed ? "✓  COMPLETED" : `+${xpReward} XP`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardCompleted: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: "#06211D",
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.accentDeep,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTileCompleted: {
    borderColor: colors.borderStrong,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  progressTextCompleted: {
    color: colors.accent,
  },
  reward: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.sm,
    letterSpacing: 1.5,
  },
  rewardCompleted: {
    color: colors.accent,
    letterSpacing: 3,
  },
});
