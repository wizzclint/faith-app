import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AchievementBadge } from "../components/ui/AchievementBadge";
import { FaithCard } from "../components/ui/FaithCard";
import { GameStat } from "../components/ui/GameStat";
import { LevelBadge } from "../components/ui/LevelBadge";
import { XPBar } from "../components/ui/XPBar";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";
import { ACHIEVEMENTS, xpRequiredForLevel } from "../game/progression";
import { useGameStore } from "../store/gameStore";
import { useProfileStore } from "../store/profileStore";

export function ProfileScreen() {
  const load = useProfileStore((s) => s.load);
  const loaded = useProfileStore((s) => s.loaded);
  const level = useProfileStore((s) => s.level);
  const xp = useProfileStore((s) => s.xp);
  const totalRuns = useProfileStore((s) => s.totalRuns);
  const totalCoins = useProfileStore((s) => s.totalCoins);
  const currentStreak = useProfileStore((s) => s.currentStreak);
  const achievementsUnlocked = useProfileStore((s) => s.achievementsUnlocked);
  const bestScore = useGameStore((s) => s.bestScore);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>F</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.username}>PLAYER</Text>
          <LevelBadge level={level} />
        </View>
      </View>

      <FaithCard style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>LEVEL {level}</Text>
          <Text style={styles.xpValue}>
            {xp} / {xpRequiredForLevel(level)} XP
          </Text>
        </View>
        <XPBar current={xp} required={xpRequiredForLevel(level)} height={10} />
      </FaithCard>

      <FaithCard style={styles.statsCard}>
        <GameStat label="BEST SCORE" value={bestScore} />
        <GameStat label={"🔥 STREAK"} value={`${currentStreak}d`} />
        <GameStat label="RUNS" value={totalRuns} />
      </FaithCard>

      <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
      <View style={styles.achievementGrid}>
        {ACHIEVEMENTS.map((a) => (
          <AchievementBadge
            key={a.id}
            icon={a.icon}
            label={a.label}
            unlocked={achievementsUnlocked.includes(a.id)}
          />
        ))}
      </View>

      <Text style={styles.footnote}>Lifetime coins collected: {totalCoins.toLocaleString()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  avatarInitial: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: "800",
  },
  identityText: {
    gap: spacing.sm,
  },
  username: {
    color: colors.textPrimary,
    ...typography.heading,
  },
  xpCard: {
    marginBottom: spacing.lg,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  xpLabel: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  xpValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.md,
  },
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
});
