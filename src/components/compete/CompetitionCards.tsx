import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import {
  countdownTarget,
  formatSol,
  playersLabel,
  shortAddress,
  stateLabel,
} from "../../services/competition/format";
import { isJoinable, runsLeft } from "../../services/competition/hooks";
import { Competition } from "../../services/competition/types";
import { useAuthStore } from "../../store/authStore";
import { Countdown } from "./Countdown";
import { PlayerAvatar, PlayerName } from "./Player";

interface CardProps {
  competition: Competition;
  onPress: () => void;
}

const IN_PLAY = ["MATCHED", "IN_PROGRESS", "LIVE"];

/** Open and running competitions get the brighter treatment; finished ones sit back. */
function StateRow({ competition }: { competition: Competition }) {
  const target = countdownTarget(competition);
  const hot = target !== null;
  return (
    <View style={styles.topRow}>
      <View style={[styles.statePill, hot && styles.statePillHot]}>
        <Text style={[styles.stateText, hot && styles.stateTextHot]}>{stateLabel(competition)}</Text>
      </View>
      {target && (
        <Countdown
          to={target}
          prefix={competition.state === "UPCOMING" ? "STARTS IN " : ""}
          suffix={competition.state === "UPCOMING" ? "" : " LEFT"}
          style={styles.countdown}
        />
      )}
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

function Action({ label, primary }: { label: string; primary: boolean }) {
  return (
    <View style={[styles.action, primary && styles.actionPrimary]}>
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
      <MaterialCommunityIcon
        name="chevron-right"
        size={16}
        color={primary ? colors.accentInk : colors.textSecondary}
      />
    </View>
  );
}

function challengeAction(competition: Competition): { label: string; primary: boolean } {
  if (competition.state === "AWAITING_FUNDING") return { label: "PAY STAKE", primary: true };
  if (isJoinable(competition)) return { label: "ACCEPT", primary: true };
  if (IN_PLAY.includes(competition.state) && runsLeft(competition) > 0) {
    return { label: "PLAY", primary: true };
  }
  return { label: "VIEW", primary: false };
}

/** What a finished head-to-head came to, from the viewer's side. */
function challengeOutcome(competition: Competition, myPubkey: string | null): string | null {
  if (competition.state === "CANCELLED") {
    switch (competition.cancelReason) {
      case "draw":
        return "DRAW";
      case "no_opponent":
        return "NO OPPONENT";
      case "never_funded":
        return "NEVER PAID";
      default:
        return "CALLED OFF";
    }
  }
  if (competition.state !== "COMPLETED" || !competition.winnerPubkey) return null;
  if (competition.winnerPubkey === myPubkey) return "YOU WON";
  if (competition.me) return "YOU LOST";
  return competition.winnerPubkey === competition.housePubkey
    ? "WON BY THE HOUSE"
    : `WON BY ${shortAddress(competition.winnerPubkey)}`;
}

/** One head-to-head on the challenge board: who, for how much, and what you can do about it. */
export function ChallengeCard({ competition, onPress }: CardProps) {
  const myPubkey = useAuthStore((s) => s.pubkey);
  // A draft has nobody seated yet, so the challenger comes from the competition itself.
  const challenger = competition.playerPubkeys[0] ?? competition.creatorPubkey;
  const opponent = competition.playerPubkeys[1];
  const staked = competition.entryFeeLamports > 0;
  const action = challengeAction(competition);
  const outcome = challengeOutcome(competition, myPubkey);
  const inPlay = IN_PLAY.includes(competition.state);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, action.primary && styles.cardHot, pressed && styles.pressed]}
      onPress={onPress}
    >
      <StateRow competition={competition} />

      <View style={styles.versus}>
        <View style={styles.side}>
          <PlayerAvatar pubkey={challenger} isHouse={challenger === competition.housePubkey} />
          <PlayerName
            pubkey={challenger}
            isMe={challenger === myPubkey}
            isHouse={challenger === competition.housePubkey}
          />
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={[styles.side, styles.sideRight]}>
          {opponent ? (
            <>
              <PlayerName
                pubkey={opponent}
                isMe={opponent === myPubkey}
                isHouse={opponent === competition.housePubkey}
              />
              <PlayerAvatar pubkey={opponent} isHouse={opponent === competition.housePubkey} />
            </>
          ) : (
            <>
              <Text style={styles.openSeat}>{competition.houseAllowed ? "PLAYER OR HOUSE" : "OPEN SEAT"}</Text>
              <View style={styles.emptyAvatar}>
                <MaterialCommunityIcon name="help" size={20} color={colors.textMuted} />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Stat label="STAKE" value={staked ? formatSol(competition.entryFeeLamports) : "FREE"} />
        <Stat
          label="WINNER TAKES"
          value={staked ? formatSol(competition.prizePoolLamports) : "THE WIN"}
        />
        <Action {...action} />
      </View>

      {outcome ? (
        <Text style={[styles.footer, outcome === "YOU WON" && styles.footerWin]}>{outcome}</Text>
      ) : (
        competition.me &&
        inPlay && (
          <Text style={styles.footer}>
            YOUR TOTAL {competition.me.totalScore.toLocaleString()} · {runsLeft(competition)}{" "}
            {runsLeft(competition) === 1 ? "RUN" : "RUNS"} LEFT
          </Text>
        )
      )}
    </Pressable>
  );
}

function tournamentAction(competition: Competition): { label: string; primary: boolean } {
  if (competition.state === "AWAITING_FUNDING") return { label: "PAY PRIZE", primary: true };
  if (competition.state === "LIVE" && runsLeft(competition) > 0) return { label: "PLAY", primary: true };
  if (isJoinable(competition)) return { label: "JOIN", primary: true };
  return { label: "VIEW", primary: false };
}

function tournamentFooter(competition: Competition, myPubkey: string | null): string | null {
  if (competition.state === "COMPLETED" && competition.winnerPubkey) {
    return competition.winnerPubkey === myPubkey
      ? "YOU WON"
      : `WON BY ${shortAddress(competition.winnerPubkey)}`;
  }
  const me = competition.me;
  if (!me) return null;
  const rank = me.rank !== null ? ` · RANK #${me.rank}` : "";
  return `YOU'RE IN${rank} · ${me.runsCompleted}/${me.attemptsAllowed} RUNS · TOTAL ${me.totalScore.toLocaleString()}`;
}

/** One tournament as an event: name, host, entry, prize, field size and time left. */
export function TournamentCard({ competition, onPress }: CardProps) {
  const myPubkey = useAuthStore((s) => s.pubkey);
  const action = tournamentAction(competition);
  const footer = tournamentFooter(competition, myPubkey);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, action.primary && styles.cardHot, pressed && styles.pressed]}
      onPress={onPress}
    >
      <StateRow competition={competition} />

      <View style={styles.titleRow}>
        <View style={styles.trophy}>
          <MaterialCommunityIcon name="trophy-variant" size={22} color={colors.warning} />
        </View>
        <View style={styles.titleBody}>
          <Text style={styles.name} numberOfLines={2}>
            {competition.name}
          </Text>
          <Text style={styles.host} numberOfLines={1}>
            Hosted by {competition.createdByMe ? "you" : shortAddress(competition.creatorPubkey)}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Stat
          label="ENTRY"
          value={competition.entryFeeLamports === 0 ? "FREE" : formatSol(competition.entryFeeLamports)}
        />
        <Stat
          label="PRIZE POOL"
          value={competition.prizePoolLamports > 0 ? formatSol(competition.prizePoolLamports) : "—"}
        />
        <Stat label="PLAYERS" value={playersLabel(competition)} />
        <Action {...action} />
      </View>

      {footer && (
        <Text style={[styles.footer, footer === "YOU WON" && styles.footerWin]}>{footer}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHot: {
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statePill: {
    backgroundColor: colors.track,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statePillHot: {
    backgroundColor: colors.accentDeep,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  stateTextHot: {
    color: colors.accentBright,
  },
  countdown: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  versus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  vs: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  openSeat: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  trophy: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2B2006",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBody: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  host: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 7,
  },
  actionPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionTextPrimary: {
    color: colors.accentInk,
  },
  footer: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  footerWin: {
    color: colors.accent,
  },
});
