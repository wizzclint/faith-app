import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { StackActions, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { formatSol, shortAddress, solToLamports } from "../../services/competition/format";
import {
  errorText,
  PayStage,
  useCreateCompetition,
  useRefreshCompetitive,
  useServerConfig,
} from "../../services/competition/hooks";
import { useAuthStore } from "../../store/authStore";
import { BulletList, houseDisclosure } from "./CompetitionInfo";
import { HouseBadge } from "./Player";
import { Chips, formStyles, Submit, SummaryRow } from "./formParts";

type StakePick = number | "custom";
export type Opponent = "HOUSE" | "PLAYER";

/**
 * Starting a head-to-head: against the house right now, or posted on the
 * board for any player to accept. Then a stake, and go. Everything else about
 * the match is fixed by the server.
 */
export function ChallengeForm({ initialOpponent }: { initialOpponent: Opponent }) {
  const navigation = useNavigation();
  const pubkey = useAuthStore((s) => s.pubkey);
  const refresh = useRefreshCompetitive();
  const create = useCreateCompetition();
  const { data: config } = useServerConfig();

  const [opponent, setOpponent] = useState<Opponent>(initialOpponent);
  const [pick, setPick] = useState<StakePick>(0);
  const [customSol, setCustomSol] = useState("");
  /** Null until the player touches the switch; until then it follows the stake. */
  const [houseChoice, setHouseChoice] = useState<boolean | null>(null);
  const [stage, setStage] = useState<PayStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const h2h = config?.h2h;
  const paidEnabled = config?.paidEnabled ?? false;
  const houseOffered = config?.house.enabled ?? false;
  const vsHouse = opponent === "HOUSE" && houseOffered;
  const quickPicks = (h2h?.stakeQuickPicksLamports ?? [0]).filter(
    (lamports) => lamports === 0 || paidEnabled
  );

  const stake = pick === "custom" ? solToLamports(customSol) : pick;
  let stakeProblem: string | null = null;
  if (stake === null) {
    stakeProblem = "Enter the stake in SOL, like 0.05.";
  } else if (h2h && stake !== 0 && (stake < h2h.minStakeLamports || stake > h2h.maxStakeLamports)) {
    stakeProblem = `A stake is between ${formatSol(h2h.minStakeLamports)} and ${formatSol(h2h.maxStakeLamports)}, or free.`;
  }
  const validStake = stakeProblem === null && stake !== null ? stake : null;
  const staked = (validStake ?? 0) > 0;

  // For a posted challenge: with nothing staked the house costs nothing to
  // face, so it's on unless switched off; with SOL at stake it's off unless
  // the player turns it on.
  const allowHouse = houseOffered && (houseChoice ?? !staked);

  const pool = (validStake ?? 0) * 2;
  const fee = Math.floor((pool * (h2h?.feeBps ?? 0)) / 10000);
  const runs = config?.attemptsPerPlayer ?? 3;
  const minutes = h2h?.matchDurationMin ?? 10;

  const handleCreate = async () => {
    if (!config || validStake === null) {
      setError(stakeProblem ?? "Still loading — try again in a moment.");
      return;
    }
    setError(null);
    try {
      const { id, notice } = await create(
        {
          kind: "HEAD_TO_HEAD",
          name: vsHouse
            ? `${shortAddress(pubkey ?? "")} vs the house`
            : `${shortAddress(pubkey ?? "")}'s challenge`,
          entryFeeLamports: validStake,
          allowHouse: vsHouse || allowHouse,
          vsHouse,
        },
        config,
        validStake > 0,
        setStage
      );
      await refresh();
      navigation.dispatch(StackActions.replace("Competition", { id, notice }));
    } catch (err) {
      setError(errorText(err));
      setStage(null);
    }
  };

  return (
    <>
      <Text style={formStyles.title}>{vsHouse ? "PLAY THE HOUSE" : "NEW CHALLENGE"}</Text>
      <Text style={formStyles.lead}>
        {vsHouse
          ? `The match starts as soon as you create it${staked ? " and pay your stake" : ""}. No waiting for an opponent.`
          : "Your challenge goes on the public board. The first player to accept locks the match."}
      </Text>

      {houseOffered && (
        <>
          <Text style={formStyles.label}>OPPONENT</Text>
          <View style={styles.opponents}>
            <OpponentCard
              selected={vsHouse}
              onPress={() => setOpponent("HOUSE")}
              icon="robot"
              title="THE HOUSE"
              badge
              detail="Starts now"
            />
            <OpponentCard
              selected={!vsHouse}
              onPress={() => setOpponent("PLAYER")}
              icon="account-multiple"
              title="ANY PLAYER"
              detail={`Waits up to ${h2h?.matchmakingWindowMin ?? 10} min`}
            />
          </View>
        </>
      )}

      <Text style={formStyles.label}>STAKE</Text>
      <Chips<StakePick>
        options={[
          ...quickPicks.map((lamports) => ({
            key: lamports as StakePick,
            label: lamports === 0 ? "Free" : formatSol(lamports),
          })),
          ...(paidEnabled ? [{ key: "custom" as StakePick, label: "Custom" }] : []),
        ]}
        selected={pick}
        onSelect={setPick}
      />
      {pick === "custom" && (
        <TextInput
          style={[formStyles.input, styles.customInput]}
          value={customSol}
          onChangeText={setCustomSol}
          keyboardType="decimal-pad"
          placeholder="0.05"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />
      )}
      {pick === "custom" && stakeProblem && customSol.trim() !== "" && (
        <Text style={[formStyles.help, styles.problem]}>{stakeProblem}</Text>
      )}
      {!paidEnabled && config && (
        <Text style={formStyles.help}>Staked matches are unavailable right now.</Text>
      )}

      <View style={formStyles.card}>
        <SummaryRow label="You stake" value={staked ? formatSol(validStake ?? 0) : "Nothing"} />
        <SummaryRow
          label={vsHouse ? "The house stakes" : "Your opponent stakes"}
          value={staked ? formatSol(validStake ?? 0) : "Nothing"}
        />
        <SummaryRow label="Platform fee" value={`${(h2h?.feeBps ?? 0) / 100}%`} />
        <SummaryRow label="Winner takes" value={staked ? formatSol(pool - fee) : "The win"} strong />
      </View>

      {vsHouse ? (
        <>
          <Text style={formStyles.label}>ABOUT THE HOUSE</Text>
          <BulletList lines={houseDisclosure(config, staked, true)} />
        </>
      ) : (
        houseOffered && (
          <>
            <Text style={formStyles.label}>IF NOBODY ACCEPTS</Text>
            <View style={styles.houseRow}>
              <View style={styles.houseText}>
                <View style={styles.houseTitleRow}>
                  <Text style={styles.houseTitle}>Let the</Text>
                  <HouseBadge />
                  <Text style={styles.houseTitle}>take the match</Text>
                </View>
                <Text style={styles.houseSub}>
                  {allowHouse
                    ? `After ${h2h?.matchmakingWindowMin ?? 10} minutes without a taker, you play the house, as long as you still have the app open.`
                    : `After ${h2h?.matchmakingWindowMin ?? 10} minutes without a taker, it closes${staked ? " and your stake is refunded" : ""}.`}
                </Text>
              </View>
              <Switch
                value={allowHouse}
                onValueChange={setHouseChoice}
                trackColor={{ false: colors.track, true: colors.accentDeep }}
                thumbColor={allowHouse ? colors.accent : colors.textMuted}
              />
            </View>
            <View style={styles.disclosure}>
              <BulletList lines={houseDisclosure(config, staked)} />
            </View>
          </>
        )
      )}

      <Text style={formStyles.label}>HOW IT WORKS</Text>
      <BulletList
        lines={[
          `${runs} runs each. The higher total wins.`,
          vsHouse
            ? `You have ${minutes} minutes from the start to play your runs. Runs not played by then count as 0.`
            : `Once someone accepts, you both have ${minutes} minutes to finish. Runs not played by then count as 0.`,
          "Starting a run uses it, even if you close the app.",
          `Level totals go to sudden death. Still level is a draw${staked ? " and both stakes are refunded" : ""}.`,
          ...(vsHouse ? [] : ["You can withdraw the challenge any time before it's accepted."]),
        ]}
      />

      <Submit
        label={
          vsHouse
            ? staked
              ? `PLAY THE HOUSE · PAY ${formatSol(validStake ?? 0)}`
              : "PLAY THE HOUSE"
            : staked
              ? `CREATE · PAY ${formatSol(validStake ?? 0)}`
              : "CREATE CHALLENGE"
        }
        onPress={handleCreate}
        stage={stage}
        disabled={!config || validStake === null}
        error={error}
      />
      {config && staked && (
        <Text style={formStyles.footnote}>
          Your wallet will open to approve the stake. This is {config.cluster} test SOL with no
          real-world value. Winning is not guaranteed.
        </Text>
      )}
    </>
  );
}

function OpponentCard({
  selected,
  onPress,
  icon,
  title,
  detail,
  badge = false,
}: {
  selected: boolean;
  onPress: () => void;
  icon: React.ComponentProps<typeof MaterialCommunityIcon>["name"];
  title: string;
  detail: string;
  badge?: boolean;
}) {
  return (
    <Pressable
      style={[styles.opponent, selected && styles.opponentSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={selected ? { selected: true } : {}}
    >
      <MaterialCommunityIcon
        name={icon}
        size={28}
        color={selected ? (badge ? colors.warning : colors.accent) : colors.textMuted}
      />
      <View style={styles.opponentTitleRow}>
        <Text style={[styles.opponentTitle, selected && styles.opponentTitleSelected]}>{title}</Text>
        {badge && <HouseBadge />}
      </View>
      <Text style={styles.opponentDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opponents: {
    flexDirection: "row",
    gap: spacing.md,
  },
  opponent: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  opponentSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDeep,
  },
  opponentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  opponentTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  opponentTitleSelected: {
    color: colors.textPrimary,
  },
  opponentDetail: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  customInput: {
    marginTop: spacing.md,
  },
  problem: {
    color: colors.warning,
  },
  houseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  houseText: {
    flex: 1,
  },
  houseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  houseTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  houseSub: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  disclosure: {
    marginTop: spacing.md,
  },
});
