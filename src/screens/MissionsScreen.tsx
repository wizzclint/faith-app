import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FaithCard } from "../components/ui/FaithCard";
import { MissionCard } from "../components/ui/MissionCard";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";
import { challengeForDate, missionsForDate, todayKey } from "../game/progression";
import { useProfileStore } from "../store/profileStore";

export function MissionsScreen() {
  const load = useProfileStore((s) => s.load);
  const loaded = useProfileStore((s) => s.loaded);
  const daily = useProfileStore((s) => s.daily);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const today = todayKey();
  const missions = missionsForDate(today);
  const challenge = challengeForDate(today);
  const challengeProgress = challenge.metric === "survivalSec" ? daily.longestSurvivalSec : daily.bestScore;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>DAILY CHALLENGE</Text>
      <FaithCard style={styles.challengeCard} elevated>
        <Text style={styles.challengeLabel}>{challenge.label}</Text>
        <Text style={styles.challengeReward}>
          {daily.challengeCompleted ? "✓ COMPLETED TODAY" : `+${challenge.xpReward} XP`}
        </Text>
        {!daily.challengeCompleted && (
          <Text style={styles.challengeProgress}>
            {Math.min(challengeProgress, challenge.target).toLocaleString()} / {challenge.target.toLocaleString()}
          </Text>
        )}
      </FaithCard>

      <Text style={styles.sectionTitle}>TODAY'S MISSIONS</Text>
      <View>
        {missions.map((mission) => {
          const progress =
            mission.metric === "runsPlayed"
              ? daily.runsPlayed
              : mission.metric === "bestScore"
                ? daily.bestScore
                : mission.metric === "coinsToday"
                  ? daily.coinsToday
                  : daily.longestSurvivalSec;
          return (
            <MissionCard
              key={mission.id}
              title={mission.label}
              progress={progress}
              target={mission.target}
              xpReward={mission.xpReward}
              completed={daily.missionsCompleted.includes(mission.id)}
            />
          );
        })}
      </View>

      <Text style={styles.footnote}>Missions and the daily challenge reset at midnight, local time.</Text>
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
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  challengeCard: {
    marginBottom: spacing.sm,
  },
  challengeLabel: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  challengeReward: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  challengeProgress: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xxl,
    textAlign: "center",
  },
});
