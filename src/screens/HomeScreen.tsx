import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AccountDetailFeature } from "../components/account/account-detail-feature";
import { FaithSyncButton } from "../components/account/faith-sync-button";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { FaithCard } from "../components/ui/FaithCard";
import { GameStat } from "../components/ui/GameStat";
import { LevelBadge } from "../components/ui/LevelBadge";
import { MissionCard } from "../components/ui/MissionCard";
import { XPBar } from "../components/ui/XPBar";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";
import { challengeForDate, missionsForDate, todayKey, xpRequiredForLevel } from "../game/progression";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import { useProfileStore } from "../store/profileStore";
import { useAuthorization } from "../utils/useAuthorization";

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();
  const navigation = useNavigation();

  const bestScore = useGameStore((s) => s.bestScore);
  const loadBestScore = useGameStore((s) => s.loadBestScore);

  const profileLoaded = useProfileStore((s) => s.loaded);
  const loadProfile = useProfileStore((s) => s.load);
  const level = useProfileStore((s) => s.level);
  const xp = useProfileStore((s) => s.xp);
  const currentStreak = useProfileStore((s) => s.currentStreak);
  const totalRuns = useProfileStore((s) => s.totalRuns);
  const daily = useProfileStore((s) => s.daily);

  const loadAuth = useAuthStore((s) => s.load);

  useEffect(() => {
    loadBestScore();
    if (!profileLoaded) loadProfile();
    loadAuth();
  }, [loadBestScore, loadProfile, profileLoaded, loadAuth]);

  const today = todayKey();
  const challenge = challengeForDate(today);
  const missions = missionsForDate(today).slice(0, 2);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>FAITH RUN</Text>
        <LevelBadge level={level} />
      </View>

      <View style={styles.xpRow}>
        <XPBar current={xp} required={xpRequiredForLevel(level)} />
      </View>

      <Pressable style={styles.runHero} onPress={() => navigation.navigate("Game")}>
        <Text style={styles.runHeroLabel}>RUN NOW</Text>
        {bestScore > 0 && <Text style={styles.runHeroBest}>BEST {bestScore.toLocaleString()}</Text>}
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Missions")}>
        <FaithCard style={styles.challengeCard} elevated>
          <Text style={styles.cardLabel}>DAILY CHALLENGE</Text>
          <Text style={styles.challengeTitle}>{challenge.label}</Text>
          <Text style={styles.challengeReward}>
            {daily.challengeCompleted ? "✓ Completed today" : `+${challenge.xpReward} XP`}
          </Text>
        </FaithCard>
      </Pressable>

      <FaithCard style={styles.progressCard}>
        <GameStat label="BEST SCORE" value={bestScore} />
        <GameStat label={"STREAK"} value={`🔥 ${currentStreak}d`} />
        <GameStat label="RUNS" value={totalRuns} />
      </FaithCard>

      <View style={styles.missionsHeader}>
        <Text style={styles.cardLabel}>MISSIONS</Text>
        <Pressable onPress={() => navigation.navigate("Missions")}>
          <Text style={styles.seeAll}>SEE ALL</Text>
        </Pressable>
      </View>
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

      {/* Wallet stays a secondary, lower-priority block — the game is the product. */}
      <View style={styles.walletBlock}>
        <Text style={styles.cardLabel}>WALLET</Text>
        {selectedAccount ? <AccountDetailFeature /> : <SignInFeature />}
        <FaithSyncButton />
      </View>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  wordmark: {
    color: colors.textPrimary,
    ...typography.displaySmall,
  },
  xpRow: {
    marginBottom: spacing.xl,
  },
  runHero: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  runHeroLabel: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 1,
  },
  runHeroBest: {
    color: colors.background,
    opacity: 0.7,
    fontWeight: "700",
    fontSize: 12,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  challengeCard: {
    marginBottom: spacing.lg,
  },
  cardLabel: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  challengeTitle: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  challengeReward: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  progressCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
  },
  missionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  seeAll: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  walletBlock: {
    marginTop: spacing.xxxl,
  },
});
