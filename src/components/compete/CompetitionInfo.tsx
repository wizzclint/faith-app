import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import {
  cancelReasonText,
  formatSol,
  prizeSplitLabel,
  shortAddress,
} from "../../services/competition/format";
import { Competition, CompetitionDetail, ServerConfig } from "../../services/competition/types";
import { HouseBadge } from "./Player";

/**
 * What the house is, said the same way everywhere it's offered or appears.
 * `seated` is whether it has already taken the match (versus being offered
 * as a fallback), which drops the lines about how it comes to take one.
 */
export function houseDisclosure(
  config: ServerConfig | undefined,
  staked: boolean,
  seated = false
): string[] {
  const winRate = config?.house.targetWinRatePct ?? 75;
  const lines = [
    "The HOUSE is FAITH's own automated player, not another person. It is always marked HOUSE.",
    `It's tuned to win about ${winRate}% of its matches. Its level is set from your recent scores, or from everyone's if you've played fewer than five runs.`,
    "Its three runs are set when it takes the seat, before you play yours, so your score can't change them.",
  ];
  if (!seated) {
    lines.push(
      `It only takes the seat while you have FAITH RUN open, because your match clock starts when it does. If you're away when the wait ends, the challenge closes${staked ? " and your stake is refunded" : ""} instead.`
    );
  }
  if (config && config.house.played > 0) {
    lines.push(`Its record so far: won ${config.house.won} of ${config.house.played}.`);
  }
  if (staked) {
    lines.push(
      seated
        ? "If it wins, your stake goes to FAITH. If you win, you take the whole pool."
        : "If it wins, your stake goes to FAITH. If it can't cover the stake, you're refunded instead."
    );
  }
  return lines;
}

export function challengeRules(competition: Competition, config: ServerConfig | undefined): string[] {
  const runs = competition.attemptsPerPlayer;
  const staked = competition.entryFeeLamports > 0;
  const lines = [
    `${runs} runs each. Your total across all ${runs} is your score, and the higher total wins.`,
    "Starting a run uses it, even if you close the app. A run you don't finish scores 0.",
  ];
  if (config) {
    lines.push(
      competition.vsHouse
        ? `A match against the house starts at once. You have ${config.h2h.matchDurationMin} minutes to finish; runs not played by then count as 0.`
        : `An open challenge waits ${config.h2h.matchmakingWindowMin} minutes for an opponent. Once matched, both players have ${config.h2h.matchDurationMin} minutes to finish; runs not played by then count as 0.`
    );
    lines.push(
      `Level totals mean one sudden-death run each, up to ${config.h2h.maxSuddenDeathRounds} rounds. Still level then, or level at the deadline, is a draw${staked ? " and both stakes are refunded" : ""}.`
    );
  }
  lines.push("You see your opponent's score for a run as soon as that run is finished, never during it.");
  if (staked) {
    lines.push(
      `Each player stakes ${formatSol(competition.entryFeeLamports)}. The winner takes ${formatSol(competition.prizePoolLamports)}${
        competition.feeBps > 0
          ? ` after a ${competition.feeBps / 100}% platform fee`
          : " — there is no platform fee"
      }.`
    );
    lines.push(
      "Prizes and refunds are claimed to your wallet. Solana's small network fee comes out of each payout."
    );
  }
  return lines;
}

export function tournamentRules(competition: Competition): string[] {
  const runs = competition.attemptsPerPlayer;
  const paid = competition.entryFeeLamports > 0;
  const hasPrize = competition.prizePoolLamports > 0 || paid;
  const lines = [
    `${runs} runs each. Your total across all ${runs} is your score, and the highest total wins.`,
    "Starting a run uses it, even if you close the app. A run you don't finish scores 0.",
    "On equal totals, whoever finished their runs first ranks higher.",
  ];
  if (hasPrize) lines.push(`Prize split: ${prizeSplitLabel(competition.prizeSplitBps)}.`);
  if (paid) {
    lines.push(
      competition.feeBps > 0
        ? `A ${competition.feeBps / 100}% platform fee comes out of the entry fees.`
        : "There is no platform fee."
    );
  }
  if (hasPrize) {
    lines.push(
      `If fewer than ${competition.minEntrants} players join, or nobody posts a score, everything paid in is refunded.`
    );
    lines.push(
      "Prizes and refunds are claimed to your wallet. Solana's small network fee comes out of each payout."
    );
  }
  return lines;
}

export function BulletList({ lines }: { lines: string[] }) {
  return (
    <View style={styles.bullets}>
      {lines.map((line) => (
        <View key={line} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

/** Shown on every match the house is in: what it is and how strong it was set this time. */
export function HouseCard({
  detail,
  config,
}: {
  detail: CompetitionDetail;
  config: ServerConfig | undefined;
}) {
  if (!detail.house) return null;
  const staked = detail.competition.entryFeeLamports > 0;
  return (
    <View style={styles.house}>
      <View style={styles.houseTitleRow}>
        <MaterialCommunityIcon name="robot" size={20} color={colors.warning} />
        <Text style={styles.houseTitle}>YOUR OPPONENT IS THE</Text>
        <HouseBadge />
      </View>
      <View style={styles.houseStats}>
        <HouseStat label="LEVEL" value={`${detail.house.level} of 10`} />
        <HouseStat label="TYPICAL RUN" value={`~${detail.house.typicalRunScore.toLocaleString()}`} />
        <HouseStat label="TUNED TO WIN" value={`${detail.house.targetWinRatePct}%`} />
      </View>
      <BulletList lines={houseDisclosure(config, staked, true)} />
    </View>
  );
}

function HouseStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.houseStat}>
      <Text style={styles.houseStatLabel}>{label}</Text>
      <Text style={styles.houseStatValue}>{value}</Text>
    </View>
  );
}

/** The headline once it's over: who won, from the viewer's side. */
export function ResultBanner({ detail }: { detail: CompetitionDetail }) {
  const { competition, settlement, players } = detail;
  if (competition.state === "CANCELLED") {
    return (
      <View style={styles.result}>
        <Text style={styles.resultTitle}>
          {competition.cancelReason === "draw" ? "DRAW" : "CALLED OFF"}
        </Text>
        <Text style={styles.resultBody}>{cancelReasonText(competition)}</Text>
      </View>
    );
  }
  if (competition.state !== "COMPLETED" || !settlement) return null;

  const me = players.find((player) => player.isMe);
  const winner = players.find((player) => player.pubkey === settlement.winnerPubkey);
  const winnerName = winner?.isHouse
    ? "The HOUSE"
    : settlement.winnerPubkey
      ? shortAddress(settlement.winnerPubkey)
      : "Nobody";
  const prize = settlement.payouts.find(
    (payout) => payout.kind === "PRIZE" && payout.pubkey === settlement.winnerPubkey
  );
  const iWon = !!me && me.pubkey === settlement.winnerPubkey;
  const myPayout = settlement.payouts.find((payout) => payout.pubkey === me?.pubkey);

  let title = `${winnerName.toUpperCase()} WON`;
  let body = prize ? `${winnerName} takes ${formatSol(prize.lamports)}.` : "";
  if (iWon) {
    title = "YOU WON";
    body = prize ? `${formatSol(prize.lamports)} is yours to claim below.` : "Well played.";
  } else if (me && competition.kind === "HEAD_TO_HEAD") {
    title = "YOU LOST";
    body = winner?.isHouse
      ? competition.entryFeeLamports > 0
        ? "The HOUSE took this one, so your stake goes to FAITH."
        : "The HOUSE took this one."
      : `${winnerName} took this one${prize ? ` and ${formatSol(prize.lamports)}` : ""}.`;
  } else if (me) {
    title = me.rank !== null ? `YOU FINISHED #${me.rank}` : "FINISHED";
    body = myPayout
      ? `${formatSol(myPayout.lamports)} is yours to claim below.`
      : `${winnerName} won it.`;
  }

  return (
    <View style={[styles.result, iWon && styles.resultWin]}>
      <Text style={[styles.resultTitle, iWon && styles.resultTitleWin]}>{title}</Text>
      {!!body && <Text style={styles.resultBody}>{body}</Text>}
    </View>
  );
}

/** Exactly who was paid what, straight from the server's settlement record. */
export function SettlementCard({ detail }: { detail: CompetitionDetail }) {
  const { competition, settlement, players } = detail;
  if (!settlement) return null;
  const nameOf = (pubkey: string) => {
    const player = players.find((candidate) => candidate.pubkey === pubkey);
    if (player?.isMe) return "You";
    return player?.isHouse ? "The HOUSE" : shortAddress(pubkey);
  };
  const winner = players.find((player) => player.pubkey === settlement.winnerPubkey);
  const moneyInvolved = competition.entryFeeLamports > 0 || competition.prizePoolLamports > 0;

  return (
    <View style={styles.settlement}>
      <Row
        label="Result"
        value={
          settlement.winnerPubkey
            ? `${nameOf(settlement.winnerPubkey)} won`
            : competition.cancelReason === "draw"
              ? "Draw"
              : "No winner"
        }
      />
      {moneyInvolved && <Row label="Platform fee" value={formatSol(settlement.feeLamports)} />}
      {settlement.payouts.map((payout, index) => (
        <Row
          key={`${payout.pubkey}-${payout.kind}-${index}`}
          label={`${nameOf(payout.pubkey)} · ${
            payout.kind === "REFUND"
              ? "refund"
              : payout.rank !== null && competition.kind === "TOURNAMENT"
                ? `prize, rank #${payout.rank}`
                : "prize"
          }`}
          value={formatSol(payout.lamports)}
          strong
        />
      ))}
      {winner?.isHouse && competition.entryFeeLamports > 0 && (
        <Text style={styles.settlementNote}>
          The HOUSE won, so the pool stays with FAITH. Nothing is paid out.
        </Text>
      )}
      {!moneyInvolved && (
        <Text style={styles.settlementNote}>Nothing was staked, so there is nothing to pay out.</Text>
      )}
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bullets: {
    gap: 8,
  },
  bullet: {
    flexDirection: "row",
    gap: 8,
  },
  bulletDot: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  house: {
    backgroundColor: "#171204",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.lg,
    gap: spacing.md,
  },
  houseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  houseTitle: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  houseStats: {
    flexDirection: "row",
  },
  houseStat: {
    flex: 1,
  },
  houseStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  houseStatValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  result: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  resultWin: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDeep,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  resultTitleWin: {
    color: colors.accentBright,
  },
  resultBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 4,
  },
  settlement: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 10,
  },
  rowLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  rowValueStrong: {
    color: colors.accent,
    fontWeight: "800",
  },
  settlementNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingBottom: 10,
  },
});
