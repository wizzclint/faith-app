import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import {
  countdownTarget,
  formatSol,
  playersLabel,
  prizeSplitLabel,
  shortAddress,
  stateLabel,
} from "../../services/competition/format";
import { CompetitionDetail, CompetitionPlayer, CompetitionRun } from "../../services/competition/types";
import { Countdown } from "./Countdown";
import { PlayerAvatar, PlayerName } from "./Player";

/** A finished run's score, "…" while it's being played, "—" if it hasn't been started. */
function runScore(run: CompetitionRun | undefined): string {
  if (!run) return "—";
  if (run.status === "ACTIVE") return "…";
  if (run.status === "VOID") return "0";
  return (run.score ?? 0).toLocaleString();
}

function runsOf(player: CompetitionPlayer, attempts: number[]): string {
  return attempts
    .map((attempt) => runScore(player.runs.find((run) => run.attempt === attempt)))
    .join("  ·  ");
}

/** The event header: what it costs, what it pays, how full it is and how long is left. */
export function TournamentHeader({ detail }: { detail: CompetitionDetail }) {
  const { competition } = detail;
  const target = countdownTarget(competition);
  const upcoming = competition.state === "UPCOMING";

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={[styles.statePill, target !== null && styles.statePillHot]}>
          <Text style={[styles.stateText, target !== null && styles.stateTextHot]}>
            {stateLabel(competition)}
          </Text>
        </View>
        {target && (
          <Countdown
            to={target}
            prefix={upcoming ? "STARTS IN " : ""}
            suffix={upcoming ? "" : " LEFT"}
            style={styles.countdown}
          />
        )}
      </View>

      <View style={styles.titleRow}>
        <View style={styles.trophy}>
          <MaterialCommunityIcon name="trophy-variant" size={26} color={colors.warning} />
        </View>
        <View style={styles.titleBody}>
          <Text style={styles.name}>{competition.name}</Text>
          <Text style={styles.host}>
            Hosted by {competition.createdByMe ? "you" : shortAddress(competition.creatorPubkey)}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat
          label="ENTRY FEE"
          value={competition.entryFeeLamports === 0 ? "FREE" : formatSol(competition.entryFeeLamports)}
        />
        <Stat
          label="PRIZE POOL"
          value={competition.prizePoolLamports > 0 ? formatSol(competition.prizePoolLamports) : "—"}
        />
        <Stat label="PLAYERS" value={playersLabel(competition)} />
      </View>

      <View style={styles.split}>
        <Text style={styles.splitLabel}>PRIZE SPLIT</Text>
        <Text style={styles.splitValue}>{prizeSplitLabel(competition.prizeSplitBps)}</Text>
      </View>
    </View>
  );
}

/** The caller's own standing: position, each run, total, and how many runs are left. */
export function MyTournamentRuns({ detail }: { detail: CompetitionDetail }) {
  const me = detail.players.find((player) => player.isMe);
  if (!me) return null;
  const attempts = Array.from({ length: detail.attemptsAllowed }, (_, index) => index + 1);
  const started = me.runs.length;
  const left = Math.max(0, detail.attemptsAllowed - started);

  return (
    <View style={styles.mine}>
      <View style={styles.mineTop}>
        <View>
          <Text style={styles.mineLabel}>YOUR POSITION</Text>
          <Text style={styles.minePosition}>{me.rank !== null ? `#${me.rank}` : "—"}</Text>
        </View>
        <View style={styles.mineTotal}>
          <Text style={styles.mineLabel}>TOTAL SCORE</Text>
          <Text style={styles.mineScore}>{me.totalScore.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.mineRuns}>
        {attempts.map((attempt) => {
          const run = me.runs.find((candidate) => candidate.attempt === attempt);
          return (
            <View key={attempt} style={styles.mineRun}>
              <Text style={styles.mineLabel}>RUN {attempt}</Text>
              <Text style={[styles.mineRunScore, !run && styles.muted]}>{runScore(run)}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.mineFooter}>
        {me.runsCompleted} of {detail.attemptsAllowed} runs completed · {left} remaining
      </Text>
    </View>
  );
}

/** Every entrant ranked by total, with each of their runs. Updates as runs are validated. */
export function TournamentLeaderboard({ detail }: { detail: CompetitionDetail }) {
  const attempts = Array.from({ length: detail.attemptsAllowed }, (_, index) => index + 1);

  if (detail.players.length === 0) {
    return <Text style={styles.empty}>Nobody has joined yet.</Text>;
  }

  return (
    <View>
      {detail.players.map((player) => (
        <View key={player.pubkey} style={[styles.row, player.isMe && styles.rowMine]}>
          <Text style={[styles.rank, player.rank !== null && player.rank <= 3 && styles.rankTop]}>
            {player.rank !== null ? `#${player.rank}` : "—"}
          </Text>
          <PlayerAvatar pubkey={player.pubkey} size={32} />
          <View style={styles.rowBody}>
            <PlayerName pubkey={player.pubkey} isMe={player.isMe} />
            <Text style={styles.rowRuns} numberOfLines={1}>
              {runsOf(player, attempts)}
            </Text>
          </View>
          <Text style={styles.rowTotal}>{player.totalScore.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
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
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  trophy: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2B2006",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBody: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
  },
  host: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
  },
  split: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  splitLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  splitValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  mine: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  mineTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mineTotal: {
    alignItems: "flex-end",
  },
  mineLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  minePosition: {
    color: colors.accent,
    fontSize: 30,
    fontWeight: "900",
  },
  mineScore: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  mineRuns: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  mineRun: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  mineRunScore: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  muted: {
    color: colors.textMuted,
  },
  mineFooter: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.md,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMine: {
    borderColor: colors.borderStrong,
  },
  rank: {
    width: 34,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  rankTop: {
    color: colors.warning,
  },
  rowBody: {
    flex: 1,
  },
  rowRuns: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  rowTotal: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
