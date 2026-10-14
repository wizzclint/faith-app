import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import {
  countdownTarget,
  formatSol,
  runLabel,
  stateLabel,
} from "../../services/competition/format";
import { CompetitionDetail, CompetitionPlayer } from "../../services/competition/types";
import { Countdown } from "./Countdown";
import { PlayerAvatar, PlayerName } from "./Player";

const AVATAR_SIZE = 56;

function isOver(detail: CompetitionDetail): boolean {
  return detail.competition.state === "COMPLETED" || detail.competition.state === "CANCELLED";
}

/** What a player is doing right now: mid-run, runs still to play, or done. */
function progressLabel(player: CompetitionPlayer, attemptsAllowed: number): string {
  const playing = player.runs.find((run) => run.status === "ACTIVE");
  if (playing) return `PLAYING RUN ${playing.attempt}`;
  const left = attemptsAllowed - player.runs.length;
  if (left <= 0) return "FINISHED";
  return `${left} ${left === 1 ? "RUN" : "RUNS"} LEFT`;
}

function PlayerColumn({
  player,
  detail,
  leading,
}: {
  player: CompetitionPlayer | undefined;
  detail: CompetitionDetail;
  leading: boolean;
}) {
  if (!player) {
    // A match against the house: the house is coming, just not seated until the stake is in.
    if (detail.competition.vsHouse) {
      return (
        <View style={styles.column}>
          <PlayerAvatar pubkey="house" size={AVATAR_SIZE} isHouse />
          <PlayerName pubkey="house" isHouse />
          <Text style={styles.waiting}>SITS DOWN WHEN{"\n"}YOUR STAKE IS IN</Text>
        </View>
      );
    }
    return (
      <View style={styles.column}>
        <View style={styles.emptyAvatar}>
          <MaterialCommunityIcon name="help" size={26} color={colors.textMuted} />
        </View>
        <Text style={styles.waiting}>WAITING FOR{"\n"}AN OPPONENT</Text>
      </View>
    );
  }

  const won = detail.settlement?.winnerPubkey === player.pubkey;
  return (
    <View style={styles.column}>
      <PlayerAvatar pubkey={player.pubkey} size={AVATAR_SIZE} isHouse={player.isHouse} />
      <PlayerName pubkey={player.pubkey} isMe={player.isMe} isHouse={player.isHouse} />
      <Text
        style={[styles.total, (leading || won) && styles.totalLeading]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {player.totalScore.toLocaleString()}
      </Text>
      <Text style={[styles.progress, won && styles.progressWon]}>
        {won ? "WINNER" : isOver(detail) ? "TOTAL" : progressLabel(player, detail.attemptsAllowed)}
      </Text>
    </View>
  );
}

/** One run's cell. A run still being played has no score to show — the server withholds it. */
function RunCell({ player, attempt }: { player: CompetitionPlayer | undefined; attempt: number }) {
  const run = player?.runs.find((candidate) => candidate.attempt === attempt);
  if (!run) return <Text style={[styles.cell, styles.cellEmpty]}>—</Text>;
  if (run.status === "ACTIVE") return <Text style={[styles.cell, styles.cellPlaying]}>PLAYING…</Text>;
  if (run.status === "VOID") return <Text style={[styles.cell, styles.cellVoid]}>0 · VOID</Text>;
  return <Text style={styles.cell}>{(run.score ?? 0).toLocaleString()}</Text>;
}

/**
 * The head-to-head scoreboard: both players, their totals, and every run side
 * by side. Sudden-death rounds appear as extra rows once they're unlocked.
 */
export function MatchBoard({ detail }: { detail: CompetitionDetail }) {
  const { competition, players, attemptsAllowed } = detail;
  // Nobody is seated until the challenger's stake is paid in; show them anyway.
  const seated: Array<CompetitionPlayer | undefined> =
    players.length > 0
      ? players
      : [
          {
            rank: null,
            pubkey: competition.creatorPubkey,
            isMe: competition.createdByMe,
            isHouse: false,
            totalScore: 0,
            runsCompleted: 0,
            runs: [],
          },
        ];
  const [left, right] = seated;
  const target = countdownTarget(competition);
  const staked = competition.entryFeeLamports > 0;
  const attempts = Array.from({ length: attemptsAllowed }, (_, index) => index + 1);
  const leftLeads = !!left && !!right && left.totalScore > right.totalScore;
  const rightLeads = !!left && !!right && right.totalScore > left.totalScore;

  return (
    <View style={styles.board}>
      <View style={styles.topRow}>
        <View style={[styles.statePill, target !== null && styles.statePillHot]}>
          <Text style={[styles.stateText, target !== null && styles.stateTextHot]}>
            {stateLabel(competition)}
          </Text>
        </View>
        {target && <Countdown to={target} suffix=" LEFT" style={styles.countdown} />}
      </View>

      <View style={styles.players}>
        <PlayerColumn player={left} detail={detail} leading={leftLeads} />
        <Text style={styles.vs}>VS</Text>
        <PlayerColumn player={right} detail={detail} leading={rightLeads} />
      </View>

      <View style={styles.runs}>
        {attempts.map((attempt) => (
          <View key={attempt} style={styles.runRow}>
            <RunCell player={left} attempt={attempt} />
            <Text
              style={[
                styles.runLabel,
                attempt > competition.attemptsPerPlayer && styles.runLabelSuddenDeath,
              ]}
            >
              {runLabel(attempt, competition.attemptsPerPlayer)}
            </Text>
            <RunCell player={right} attempt={attempt} />
          </View>
        ))}
      </View>

      <View style={styles.money}>
        <Money label="STAKE EACH" value={staked ? formatSol(competition.entryFeeLamports) : "FREE"} />
        <Money
          label="WINNER TAKES"
          value={staked ? formatSol(competition.prizePoolLamports) : "THE WIN"}
        />
        <Money label="PLATFORM FEE" value={`${competition.feeBps / 100}%`} />
      </View>
    </View>
  );
}

function Money({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.moneyItem}>
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={styles.moneyValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statePill: {
    backgroundColor: colors.track,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statePillHot: {
    backgroundColor: colors.accentDeep,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  stateTextHot: {
    color: colors.accentBright,
  },
  countdown: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  players: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.xl,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  vs: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: AVATAR_SIZE / 2 - 8,
  },
  emptyAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  waiting: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 16,
  },
  total: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  totalLeading: {
    color: colors.accent,
  },
  progress: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  progressWon: {
    color: colors.accent,
  },
  runs: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  runRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  runLabel: {
    width: 116,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  runLabelSuddenDeath: {
    color: colors.fire,
  },
  cell: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  cellEmpty: {
    color: colors.textMuted,
  },
  cellPlaying: {
    color: colors.accent,
    fontSize: 11,
    letterSpacing: 1,
  },
  cellVoid: {
    color: colors.textMuted,
    fontSize: 13,
  },
  money: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  moneyItem: {
    flex: 1,
    alignItems: "center",
  },
  moneyLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  moneyValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
});
