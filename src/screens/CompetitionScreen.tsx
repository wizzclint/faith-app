import { RouteProp, useFocusEffect, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BulletList,
  challengeRules,
  houseDisclosure,
  HouseCard,
  ResultBanner,
  SettlementCard,
  tournamentRules,
} from "../components/compete/CompetitionInfo";
import { MatchBoard } from "../components/compete/MatchBoard";
import { RewardsPanel } from "../components/compete/RewardsPanel";
import {
  MyTournamentRuns,
  TournamentHeader,
  TournamentLeaderboard,
} from "../components/compete/TournamentBoard";
import { FaithButton } from "../components/ui/FaithButton";
import { GlowButton } from "../components/ui/GlowButton";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { api } from "../services/api/client";
import { formatSol } from "../services/competition/format";
import {
  errorText,
  isJoinable,
  needsPrizeFunding,
  PAY_STAGE_LABELS,
  PayStage,
  useCompetition,
  useCompetitionPayments,
  useIsAdmin,
  useRefreshCompetitive,
  useServerConfig,
} from "../services/competition/hooks";
import { PaymentPurpose, pendingEntries } from "../services/competition/pendingEntries";
import { useAuthStore } from "../store/authStore";

type Message = { text: string; tone: "error" | "info" };

/**
 * One competition in full. A head-to-head shows as a match (both players,
 * every run side by side); a tournament shows as an event with a leaderboard.
 * Everything a player can do to it — pay in, accept, play, withdraw, claim —
 * starts here.
 */
export function CompetitionScreen() {
  const navigation = useNavigation();
  const { id, notice } = useRoute<RouteProp<ReactNavigation.RootParamList, "Competition">>().params;
  const focused = useIsFocused();
  const synced = useAuthStore((s) => s.status === "authenticated");
  const isAdmin = useIsAdmin();
  const refresh = useRefreshCompetitive();
  const { data: config } = useServerConfig();
  const { data, isLoading, isError, isRefetching } = useCompetition(id, focused);
  const { payIn, submit } = useCompetitionPayments();

  const [stage, setStage] = useState<PayStage | null>(null);
  const [message, setMessage] = useState<Message | null>(
    notice ? { text: notice, tone: "error" } : null
  );
  const [busy, setBusy] = useState(false);

  const competition = data?.competition;
  const kind = competition?.kind;
  const entered = !!competition?.me;

  useEffect(() => {
    if (kind) navigation.setOptions({ title: kind === "HEAD_TO_HEAD" ? "Head to head" : "Tournament" });
  }, [kind, navigation]);

  // Coming back from a run: show its result straight away rather than on the next poll.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // A payment can leave the wallet without the server hearing about it (app
  // closed, signal lost). Its signature was saved first, so it is finished
  // here the next time this screen opens — as a seat, or as a refund.
  const resumed = useRef(false);
  useEffect(() => {
    if (!synced || !competition || resumed.current) return;
    resumed.current = true;
    (async () => {
      const purposes: PaymentPurpose[] = entered ? ["prize"] : ["entry", "prize"];
      for (const purpose of purposes) {
        const signature = await pendingEntries.get(id, purpose);
        if (!signature) continue;
        setStage("confirming");
        try {
          await submit(id, purpose, signature);
          setMessage({ text: "Your payment is confirmed.", tone: "info" });
        } catch (err) {
          setMessage({ text: errorText(err), tone: "error" });
        } finally {
          setStage(null);
          refresh();
        }
      }
    })();
  }, [synced, competition, entered, id, submit, refresh]);

  if (isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (isError || !data || !competition) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.emptyTitle}>CONNECTION LOST</Text>
        <Text style={styles.emptyBody}>Can't load this right now.</Text>
        <FaithButton label="RETRY" onPress={refresh} variant="secondary" />
      </View>
    );
  }

  const headToHead = competition.kind === "HEAD_TO_HEAD";
  const cluster = config?.cluster ?? "devnet";
  const me = data.players.find((player) => player.isMe);
  const runsStarted = me?.runs.length ?? 0;
  const unfinishedRun = me?.runs.find((run) => run.status === "ACTIVE");
  const inPlay =
    competition.state === "MATCHED" ||
    competition.state === "IN_PROGRESS" ||
    competition.state === "LIVE";
  const stillOpen = inPlay || competition.state === "OPEN" || competition.state === "UPCOMING";
  const finished = competition.state === "COMPLETED" || competition.state === "CANCELLED";
  const waitingForOpponent = headToHead && competition.state === "OPEN";
  const canPlay = entered && inPlay && runsStarted < data.attemptsAllowed;
  const nextAttempt = runsStarted + 1;
  const othersJoined = competition.entrants - (entered ? 1 : 0) > 0;
  const canWithdraw =
    competition.createdByMe &&
    (competition.state === "AWAITING_FUNDING" ||
      (headToHead ? competition.state === "OPEN" : stillOpen && !othersJoined));

  const runPayment = async (purpose: PaymentPurpose, success: string) => {
    setMessage(null);
    try {
      await payIn(competition, purpose, config, setStage);
      setMessage({ text: success, tone: "info" });
    } catch (err) {
      setMessage({ text: errorText(err), tone: "error" });
    } finally {
      setStage(null);
      refresh();
    }
  };

  const matchMinutes = config?.h2h.matchDurationMin ?? 10;
  const joinSuccess = headToHead
    ? competition.vsHouse
      ? `The house is in. You have ${matchMinutes} minutes to play your runs.`
      : competition.createdByMe
        ? "Your challenge is live. Waiting for an opponent."
        : `Matched! You have ${matchMinutes} minutes to play your runs.`
    : "You're in. Good luck!";

  const handleJoin = () => {
    // The wallet's own approval screen is the confirmation when you're paying into your own challenge.
    if (competition.entryFeeLamports === 0 || competition.createdByMe) {
      runPayment("entry", joinSuccess);
      return;
    }
    Alert.alert(
      headToHead
        ? `Stake ${formatSol(competition.entryFeeLamports)} on this match?`
        : `Enter for ${formatSol(competition.entryFeeLamports)}?`,
      `Your wallet will open to approve the payment. This is ${cluster} test SOL with no real-world value. Winning is not guaranteed.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: headToHead ? "Pay and accept" : "Pay and join", onPress: () => runPayment("entry", joinSuccess) },
      ]
    );
  };

  const confirmThen = (title: string, detail: string, action: () => Promise<unknown>) => {
    Alert.alert(title, detail, [
      { text: "Back", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          setMessage(null);
          try {
            await action();
          } catch (err) {
            setMessage({ text: errorText(err), tone: "error" });
          } finally {
            setBusy(false);
            refresh();
          }
        },
      },
    ]);
  };

  const play = () =>
    navigation.navigate("Game", {
      competitionId: id,
      competitionName: competition.name,
      attemptsPerPlayer: competition.attemptsPerPlayer,
    });

  const syncHint = (
    <Text style={styles.hint}>
      Connect your wallet and tap SYNC WITH FAITH in the Wallet section of the Home screen to take
      part.
    </Text>
  );

  const action = () => {
    if (stage) {
      return (
        <View style={styles.stage}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.stageText}>{PAY_STAGE_LABELS[stage]}</Text>
        </View>
      );
    }
    if (finished) return null;

    if (needsPrizeFunding(competition)) {
      return (
        <>
          <GlowButton
            label={`PAY IN PRIZE · ${formatSol(competition.fundingDueLamports ?? 0)}`}
            onPress={() => runPayment("prize", "Your tournament is open.")}
          />
          <Text style={styles.hint}>
            Your tournament opens as soon as its prize is paid in. A draft left unpaid is removed
            after a few minutes.
          </Text>
        </>
      );
    }
    if (headToHead && competition.state === "AWAITING_FUNDING") {
      return (
        <>
          <GlowButton
            label={`PAY STAKE · ${formatSol(competition.entryFeeLamports)}`}
            onPress={handleJoin}
          />
          <Text style={styles.hint}>
            {competition.vsHouse
              ? "The house sits down as soon as your stake is paid in, and your runs open straight away."
              : "Your challenge goes public as soon as your stake is paid in."}{" "}
            A draft left unpaid is removed after a few minutes.
          </Text>
        </>
      );
    }
    if (competition.state === "SETTLING") {
      const unmatched = headToHead && competition.entrants < 2;
      return (
        <Text style={styles.hint}>
          {unmatched
            ? competition.houseAllowed && competition.createdByMe
              ? "Nobody accepted in time. Bringing in the HOUSE…"
              : "Nobody accepted in time. Closing this challenge…"
            : "Time's up. Settling the result…"}
        </Text>
      );
    }
    if (canPlay) {
      return (
        <>
          <GlowButton
            label={
              nextAttempt > competition.attemptsPerPlayer
                ? "PLAY SUDDEN-DEATH RUN"
                : `PLAY RUN ${nextAttempt} OF ${competition.attemptsPerPlayer}`
            }
            icon="play"
            onPress={play}
          />
          <Text style={styles.hint}>
            {unfinishedRun
              ? `Run ${unfinishedRun.attempt} was left unfinished. Starting the next one scores it 0.`
              : "Starting a run uses it, even if you close the app."}
          </Text>
        </>
      );
    }
    if (entered && inPlay) {
      return (
        <Text style={styles.hint}>
          {unfinishedRun
            ? "Your last run is still being recorded…"
            : headToHead
              ? "You've played all your runs. Waiting for your opponent to finish."
              : "You've played all your runs. Final standings come when the timer ends."}
        </Text>
      );
    }
    if (entered && competition.state === "OPEN") {
      return (
        <Text style={styles.hint}>
          Waiting for an opponent.{" "}
          {competition.houseAllowed
            ? `If nobody accepts before the timer runs out, the HOUSE takes the match. Keep the app open: if you're away then, it closes${competition.entryFeeLamports > 0 ? " and your stake is refunded" : ""} instead.`
            : competition.entryFeeLamports > 0
              ? "If nobody accepts before the timer runs out, your stake is refunded."
              : "If nobody accepts before the timer runs out, it closes."}
        </Text>
      );
    }
    if (entered && competition.state === "UPCOMING") {
      return <Text style={styles.hint}>You're in. Your runs open when it starts.</Text>;
    }
    if (isJoinable(competition)) {
      if (!synced) return syncHint;
      const price =
        competition.entryFeeLamports === 0 ? "FREE" : formatSol(competition.entryFeeLamports);
      return (
        <>
          <GlowButton
            label={headToHead ? `ACCEPT · ${price}` : `JOIN · ${price}`}
            icon={headToHead ? "sword-cross" : undefined}
            onPress={handleJoin}
          />
          {headToHead && (
            <Text style={styles.hint}>
              Accepting locks the match and starts its {config?.h2h.matchDurationMin ?? 10}-minute
              clock for both players.
            </Text>
          )}
        </>
      );
    }
    if (headToHead && inPlay) {
      return <Text style={styles.hint}>You're watching. Each run's score appears once it's finished.</Text>;
    }
    if (!headToHead && stillOpen) {
      return <Text style={styles.hint}>This tournament is full.</Text>;
    }
    return null;
  };

  const rules = headToHead ? challengeRules(competition, config) : tournamentRules(competition);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={colors.accent} />
      }
    >
      {headToHead ? <MatchBoard detail={data} /> : <TournamentHeader detail={data} />}

      <ResultBanner detail={data} />

      <View style={styles.actions}>
        {action()}
        {message && (
          <Text style={[styles.message, message.tone === "error" && styles.messageError]}>
            {message.text}
          </Text>
        )}
        {canWithdraw && !stage && (
          <FaithButton
            label={headToHead ? "WITHDRAW CHALLENGE" : "CANCEL TOURNAMENT"}
            variant="secondary"
            disabled={busy}
            onPress={() =>
              confirmThen(
                headToHead ? "Withdraw this challenge?" : "Cancel this tournament?",
                "Anything you paid in will be waiting as a refund in your wallet section.",
                () => api.cancelCompetition(id)
              )
            }
          />
        )}
      </View>

      {!headToHead && <MyTournamentRuns detail={data} />}

      <HouseCard detail={data} config={config} />

      {finished && (
        <>
          <Text style={styles.sectionTitle}>SETTLEMENT</Text>
          <SettlementCard detail={data} />
        </>
      )}
      {synced && <RewardsPanel competitionId={id} />}

      {!headToHead && (
        <>
          <Text style={styles.sectionTitle}>LEADERBOARD</Text>
          <TournamentLeaderboard detail={data} />
        </>
      )}

      <Text style={styles.sectionTitle}>RULES</Text>
      <BulletList lines={rules} />

      {headToHead && competition.houseAllowed && !data.house && !finished && (
        <>
          <Text style={styles.sectionTitle}>
            {competition.vsHouse ? "ABOUT THE HOUSE" : "IF NOBODY ACCEPTS"}
          </Text>
          <BulletList
            lines={houseDisclosure(config, competition.entryFeeLamports > 0, competition.vsHouse)}
          />
        </>
      )}

      <Text style={styles.footnote}>
        {cluster === "mainnet-beta"
          ? "Paid competitions are disabled."
          : `This uses ${cluster} test SOL, which has no real-world value.`}
      </Text>

      {isAdmin && (stillOpen || competition.state === "AWAITING_FUNDING") && (
        <View style={styles.admin}>
          <Text style={styles.sectionTitle}>ADMIN</Text>
          {stillOpen && (
            <FaithButton
              label={waitingForOpponent ? "END THE WAIT NOW" : "END NOW AND SETTLE"}
              variant="secondary"
              disabled={busy}
              onPress={() =>
                confirmThen(
                  waitingForOpponent ? "Close matchmaking now?" : "End this now?",
                  waitingForOpponent
                    ? competition.houseAllowed
                      ? competition.createdByMe
                        ? "The HOUSE takes the match straight away if it can cover the stake. Otherwise the challenge closes and anything staked is refunded."
                        : "The HOUSE takes the match if the challenger's app is open in the next minute and it can cover the stake. Otherwise the challenge closes and anything staked is refunded."
                      : "The challenge closes and anything staked is refunded."
                    : "It will be settled on the runs finished so far.",
                  () => api.endCompetition(id)
                )
              }
            />
          )}
          <FaithButton
            label="CANCEL AND REFUND"
            variant="danger"
            disabled={busy}
            onPress={() =>
              confirmThen("Cancel this?", "Everything paid in will be refunded.", () =>
                api.cancelCompetition(id)
              )
            }
          />
        </View>
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
    gap: spacing.md,
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  stage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    height: 56,
  },
  stageText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  message: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  messageError: {
    color: colors.danger,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4,
    marginTop: spacing.md,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: spacing.md,
  },
  admin: {
    gap: spacing.md,
  },
});
