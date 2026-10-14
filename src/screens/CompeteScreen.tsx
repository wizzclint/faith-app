import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChallengeCard, TournamentCard } from "../components/compete/CompetitionCards";
import { HouseBadge } from "../components/compete/Player";
import { Segmented, TabStrip } from "../components/compete/Tabs";
import { FaithButton } from "../components/ui/FaithButton";
import { GlowButton } from "../components/ui/GlowButton";
import { featureFlags } from "../config/featureFlags";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import {
  isJoinable,
  useCompetitions,
  useMe,
  useRefreshCompetitive,
  useServerConfig,
} from "../services/competition/hooks";
import { Competition } from "../services/competition/types";
import { useAuthStore } from "../store/authStore";

type Mode = "h2h" | "tournaments";
type DuelTab = "open" | "mine" | "results";
type TournamentTab = "live" | "upcoming" | "mine" | "results";

const isMine = (competition: Competition) => competition.createdByMe || competition.me !== null;
const isFinished = (competition: Competition) =>
  competition.state === "COMPLETED" || competition.state === "CANCELLED";

/**
 * Two separate experiences: Head to Head is a board of challenges to take or
 * post, Tournaments are events with a leaderboard. Everything listed is real
 * and comes from faith-server; empty and offline states say so plainly.
 */
export function CompeteScreen() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const synced = useAuthStore((s) => s.status === "authenticated");
  const refresh = useRefreshCompetitive();
  const { data: config } = useServerConfig();
  const { data: me } = useMe();
  const { data, isLoading, isError, isRefetching } = useCompetitions(focused);

  const [mode, setMode] = useState<Mode>("h2h");
  const [duelTab, setDuelTab] = useState<DuelTab>("open");
  const [tournamentTab, setTournamentTab] = useState<TournamentTab>("live");

  const enabled = featureFlags.ENABLE_COMPETITIVE_MODE && config?.competitiveEnabled !== false;
  const competitions = data ?? [];
  const duels = competitions.filter((c) => c.kind === "HEAD_TO_HEAD");
  const tournaments = competitions.filter((c) => c.kind === "TOURNAMENT");

  // The server lists soonest-to-close first; results read better newest first.
  const openDuels = duels.filter((c) => c.state === "OPEN");
  const otherMatches = duels.filter(
    (c) => !isMine(c) && !isFinished(c) && c.entrants === 2
  );
  const myDuels = duels.filter((c) => isMine(c) && !isFinished(c));
  const duelResults = duels.filter(isFinished).reverse();

  const liveTournaments = tournaments.filter((c) => c.state === "LIVE");
  const upcomingTournaments = tournaments.filter((c) => c.state === "UPCOMING");
  const myTournaments = [
    ...tournaments.filter((c) => isMine(c) && !isFinished(c)),
    ...tournaments.filter((c) => isMine(c) && isFinished(c)).reverse(),
  ];
  const tournamentResults = tournaments
    .filter((c) => isFinished(c) || c.state === "SETTLING")
    .reverse();

  const limit = me?.tournamentMonthlyLimit ?? null;
  const created = me?.tournamentsCreatedThisMonth ?? 0;
  const limitReached = limit !== null && created >= limit;

  const open = (competition: Competition) => navigation.navigate("Competition", { id: competition.id });

  const list = (
    items: Competition[],
    emptyTitle: string,
    emptyBody: string,
    heading?: string
  ) => {
    if (items.length === 0) {
      if (heading || isLoading || isError) return null;
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
        </View>
      );
    }
    return (
      <>
        {heading && <Text style={styles.sectionTitle}>{heading}</Text>}
        {items.map((competition) =>
          competition.kind === "HEAD_TO_HEAD" ? (
            <ChallengeCard key={competition.id} competition={competition} onPress={() => open(competition)} />
          ) : (
            <TournamentCard key={competition.id} competition={competition} onPress={() => open(competition)} />
          )
        )}
      </>
    );
  };

  const syncNotice = (
    <Text style={styles.notice}>
      To create or accept anything here, connect your wallet and tap SYNC WITH FAITH in the Wallet
      section of the Home screen.
    </Text>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.accent} />
      }
    >
      <Text style={styles.title}>COMPETE</Text>

      {!enabled ? (
        <Text style={styles.notice}>Head-to-head challenges and tournaments are switched off right now.</Text>
      ) : (
        <>
          <Segmented
            options={[
              { key: "h2h", label: "HEAD TO HEAD", icon: "sword-cross" },
              { key: "tournaments", label: "TOURNAMENTS", icon: "trophy-variant" },
            ]}
            selected={mode}
            onSelect={setMode}
          />

          {mode === "h2h" ? (
            <>
              <Text style={styles.lead}>
                Post a challenge or take one. {config?.attemptsPerPlayer ?? 3} runs each — the highest
                total wins the pool.
              </Text>
              {synced ? (
                <View style={styles.ctas}>
                  <GlowButton
                    label="CREATE CHALLENGE"
                    icon="sword-cross"
                    onPress={() =>
                      navigation.navigate("CreateCompetition", { kind: "HEAD_TO_HEAD", opponent: "PLAYER" })
                    }
                  />
                  {config?.house.enabled && (
                    <Pressable
                      style={({ pressed }) => [styles.houseButton, pressed && styles.pressed]}
                      onPress={() =>
                        navigation.navigate("CreateCompetition", { kind: "HEAD_TO_HEAD", opponent: "HOUSE" })
                      }
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcon name="robot" size={22} color={colors.warning} />
                      <View style={styles.houseButtonBody}>
                        <View style={styles.houseButtonTitleRow}>
                          <Text style={styles.houseButtonTitle}>PLAY THE</Text>
                          <HouseBadge />
                        </View>
                        <Text style={styles.houseButtonDetail}>Starts now. No waiting for an opponent.</Text>
                      </View>
                      <MaterialCommunityIcon name="chevron-right" size={22} color={colors.warning} />
                    </Pressable>
                  )}
                </View>
              ) : (
                syncNotice
              )}
              <TabStrip
                tabs={[
                  {
                    key: "open",
                    label: "OPEN CHALLENGES",
                    count: openDuels.filter(isJoinable).length,
                  },
                  { key: "mine", label: "MY MATCHES", count: myDuels.length },
                  { key: "results", label: "RESULTS" },
                ]}
                selected={duelTab}
                onSelect={setDuelTab}
              />
            </>
          ) : (
            <>
              <Text style={styles.lead}>
                Events with a live leaderboard. {config?.attemptsPerPlayer ?? 3} runs each — the highest
                total wins.
              </Text>
              {synced ? (
                <>
                  <GlowButton
                    label="CREATE TOURNAMENT"
                    icon="trophy"
                    disabled={limitReached}
                    onPress={() => navigation.navigate("CreateCompetition", { kind: "TOURNAMENT" })}
                  />
                  {limit !== null && (
                    <Text style={[styles.limit, limitReached && styles.limitReached]}>
                      {limitReached
                        ? `You've created ${limit} tournaments this month.`
                        : `${created} of ${limit} created this month`}
                    </Text>
                  )}
                </>
              ) : (
                syncNotice
              )}
              <TabStrip
                tabs={[
                  { key: "live", label: "LIVE", count: liveTournaments.length },
                  { key: "upcoming", label: "UPCOMING", count: upcomingTournaments.length },
                  {
                    key: "mine",
                    label: "MY TOURNAMENTS",
                    count: myTournaments.filter((c) => !isFinished(c)).length,
                  },
                  { key: "results", label: "RESULTS" },
                ]}
                selected={tournamentTab}
                onSelect={setTournamentTab}
              />
            </>
          )}

          <View style={styles.list}>
            {isLoading && <ActivityIndicator color={colors.accent} style={styles.loader} />}

            {isError && (
              <View style={styles.centered}>
                <Text style={styles.emptyTitle}>CONNECTION LOST</Text>
                <Text style={styles.emptyBody}>Can't reach the FAITH servers right now.</Text>
                <FaithButton label="RETRY" onPress={refresh} variant="secondary" />
              </View>
            )}

            {mode === "h2h" && duelTab === "open" && (
              <>
                {list(
                  openDuels,
                  "NO OPEN CHALLENGES",
                  synced
                    ? "Be the first — post one and it shows up here for everyone."
                    : "Nobody is waiting for an opponent right now."
                )}
                {list(otherMatches, "", "", "BEING PLAYED NOW")}
              </>
            )}
            {mode === "h2h" &&
              duelTab === "mine" &&
              list(
                myDuels,
                "NO MATCHES IN PLAY",
                synced
                  ? "Challenges you post or accept show up here until they're settled."
                  : "Sync your wallet to post or accept a challenge."
              )}
            {mode === "h2h" &&
              duelTab === "results" &&
              list(duelResults, "NO RESULTS YET", "Finished matches from the last 7 days show up here.")}

            {mode === "tournaments" &&
              tournamentTab === "live" &&
              list(liveTournaments, "NOTHING LIVE", "No tournament is running right now.")}
            {mode === "tournaments" &&
              tournamentTab === "upcoming" &&
              list(upcomingTournaments, "NOTHING SCHEDULED", "No tournament is waiting to start.")}
            {mode === "tournaments" &&
              tournamentTab === "mine" &&
              list(
                myTournaments,
                "NONE YET",
                synced
                  ? "Tournaments you create or enter show up here."
                  : "Sync your wallet to create or enter a tournament."
              )}
            {mode === "tournaments" &&
              tournamentTab === "results" &&
              list(
                tournamentResults,
                "NO RESULTS YET",
                "Finished tournaments from the last 7 days show up here."
              )}
          </View>

          {config && (
            <Text style={styles.footnote}>
              {config.cluster === "mainnet-beta"
                ? "Paid competitions are disabled."
                : `Stakes, entry fees and prizes use ${config.cluster} test SOL, which has no real-world value. Winning is never guaranteed.`}
            </Text>
          )}
        </>
      )}
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
    paddingBottom: spacing.massive,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  ctas: {
    gap: spacing.md,
  },
  houseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: "#171204",
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  houseButtonBody: {
    flex: 1,
  },
  houseButtonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  houseButtonTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  houseButtonDetail: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  limit: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  limitReached: {
    color: colors.warning,
    fontWeight: "700",
  },
  list: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  notice: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  centered: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
