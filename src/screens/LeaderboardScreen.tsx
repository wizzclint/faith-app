import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { FaithButton } from "../components/ui/FaithButton";
import { FaithCard } from "../components/ui/FaithCard";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";
import { api, ApiError, LeaderboardEntry } from "../services/api/client";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";
import { ellipsify } from "../utils/ellipsify";

type LoadState = "loading" | "error" | "empty" | "ready";

/**
 * Real leaderboard data from faith-server — never fabricated rows. If the
 * backend isn't reachable (not deployed yet, wrong LAN IP in api/config.ts,
 * no live database behind it) this shows an honest error/empty state
 * instead of inventing rankings to fill the screen.
 */
export function LeaderboardScreen() {
  const navigation = useNavigation();
  const bestScore = useGameStore((s) => s.bestScore);
  const authStatus = useAuthStore((s) => s.status);

  const [state, setState] = useState<LoadState>("loading");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setErrorMessage(null);
    try {
      const { leaderboard } = await api.leaderboard();
      setRows(leaderboard);
      setState(leaderboard.length === 0 ? "empty" : "ready");
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Can't reach the FAITH servers right now."
      );
      setState("error");
    }

    if (authStatus === "authenticated") {
      api
        .myRank()
        .then(({ rank }) => setMyRank(rank))
        .catch(() => setMyRank(null));
    }
  }, [authStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>YOUR RANK</Text>
      <FaithCard style={styles.card} elevated>
        <Text style={styles.scoreLabel}>LOCAL BEST</Text>
        <Text style={styles.scoreValue}>{bestScore.toLocaleString()}</Text>
        {myRank !== null && <Text style={styles.rankLine}>Global rank #{myRank}</Text>}
      </FaithCard>

      <Text style={styles.sectionTitle}>GLOBAL</Text>

      {state === "loading" && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {state === "error" && (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>CONNECTION LOST</Text>
          <Text style={styles.emptyBody}>{errorMessage}</Text>
          <FaithButton label="RETRY" onPress={load} variant="secondary" style={styles.retryButton} />
        </View>
      )}

      {state === "empty" && (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>NO RANKINGS YET</Text>
          <Text style={styles.emptyBody}>
            Complete your first run to appear on the leaderboard.
          </Text>
          <FaithButton
            label="RUN NOW"
            onPress={() => navigation.navigate("Game")}
            style={styles.runButton}
          />
        </View>
      )}

      {state === "ready" && (
        <FlatList
          data={rows}
          keyExtractor={(item) => `${item.rank}-${item.pubkey}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <Text style={styles.pubkey}>{ellipsify(item.pubkey)}</Text>
              <Text style={styles.rowScore}>{item.score.toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  rankLine: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  centered: {
    alignItems: "center",
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  runButton: {
    minWidth: 200,
  },
  retryButton: {
    minWidth: 160,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rank: {
    color: colors.textMuted,
    fontWeight: "800",
    fontSize: 13,
    width: 40,
  },
  pubkey: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
  },
  rowScore: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 14,
  },
});
