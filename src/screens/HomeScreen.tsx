import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AccountDetailFeature } from "../components/account/account-detail-feature";
import { FaithSyncButton } from "../components/account/faith-sync-button";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { GameStat } from "../components/ui/GameStat";
import { GlowButton } from "../components/ui/GlowButton";
import { LevelBadge } from "../components/ui/LevelBadge";
import { MissionCard } from "../components/ui/MissionCard";
import { XPBar } from "../components/ui/XPBar";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
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
      <View style={styles.titleRow}>
        <Text style={styles.wordmark}>
          FAITH <Text style={styles.wordmarkAccent}>RUN</Text>
        </Text>
        <LevelBadge level={level} />
      </View>

      <View style={styles.xpRow}>
        <XPBar current={xp} required={xpRequiredForLevel(level)} />
      </View>

      <View style={styles.heroArt}>
        <Image
          source={require("../../assets/ui/home-hero.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
          fadeDuration={0}
        />
      </View>

      <GlowButton
        size="hero"
        label="RUN NOW"
        sublabel={bestScore > 0 ? `BEST ${bestScore.toLocaleString()}` : undefined}
        onPress={() => navigation.navigate("Game")}
        style={styles.runNow}
      />

      <Pressable style={styles.challengeCard} onPress={() => navigation.navigate("Missions")}>
        <View style={styles.challengeIcon}>
          <MaterialCommunityIcon name="crosshairs-gps" size={26} color={colors.accent} />
        </View>
        <View style={styles.challengeBody}>
          <Text style={styles.eyebrow}>DAILY CHALLENGE</Text>
          <Text style={styles.challengeTitle}>{challenge.label}</Text>
          <Text style={styles.challengeReward}>
            {daily.challengeCompleted ? "✓  COMPLETED TODAY" : `+${challenge.xpReward} XP`}
          </Text>
        </View>
        <View style={styles.hexBadge}>
          <MaterialCommunityIcon name="hexagon-outline" size={46} color={colors.accent} />
          <MaterialCommunityIcon
            name="star"
            size={18}
            color={colors.accentBright}
            style={styles.hexStar}
          />
        </View>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <GameStat icon="trophy" tint={colors.warning} label="BEST SCORE" value={bestScore} />
        </View>
        <View style={styles.statTile}>
          <GameStat icon="fire" tint={colors.fire} label="STREAK" value={`${currentStreak}d`} />
        </View>
        <View style={styles.statTile}>
          <GameStat icon="run-fast" tint={colors.accentSecondary} label="RUNS" value={totalRuns} />
        </View>
      </View>

      <View style={styles.missionsHeader}>
        <Text style={styles.sectionTitle}>MISSIONS</Text>
        <Pressable style={styles.seeAllButton} onPress={() => navigation.navigate("Missions")} hitSlop={10}>
          <Text style={styles.seeAll}>SEE ALL</Text>
          <MaterialCommunityIcon name="chevron-right" size={18} color={colors.accent} />
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
            metric={mission.metric}
          />
        );
      })}

      {/* Wallet stays a secondary, lower-priority block — the game is the product. */}
      <View style={styles.walletBlock}>
        <Text style={styles.eyebrow}>WALLET</Text>
        {/* Sync sits first: it unlocks the leaderboard, competitions and rewards. */}
        <FaithSyncButton />
        {selectedAccount ? <AccountDetailFeature /> : <SignInFeature />}
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.massive,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  wordmark: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  wordmarkAccent: {
    color: colors.accent,
  },
  xpRow: {
    marginBottom: spacing.lg,
  },
  heroArt: {
    aspectRatio: 1212 / 672,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  // Pulled up so the pill straddles the bottom edge of the art.
  runNow: {
    marginTop: -30,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  challengeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentDeep,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeBody: {
    flex: 1,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
  challengeTitle: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  challengeReward: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
  hexBadge: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  hexStar: {
    position: "absolute",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
  },
  missionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 4,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAll: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  walletBlock: {
    marginTop: spacing.xxl,
  },
});
