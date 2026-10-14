import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { api, ApiError } from "../../services/api/client";
import { formatSol } from "../../services/competition/format";
import { useRefreshCompetitive, useRewards } from "../../services/competition/hooks";
import { Reward } from "../../services/competition/types";
import { FaithButton } from "../ui/FaithButton";

interface RewardsPanelProps {
  /** Limit the list to one competition; otherwise every reward is shown. */
  competitionId?: string;
  /** Leave out rewards already paid out (they're in the transaction history instead). */
  unpaidOnly?: boolean;
}

/**
 * The player's prizes and refunds, each with a Claim button that pays it to
 * their wallet. Every amount and status comes from the server's records.
 */
export function RewardsPanel({ competitionId, unpaidOnly = false }: RewardsPanelProps) {
  const { data } = useRewards();
  const refresh = useRefreshCompetitive();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rewards = (data?.rewards ?? []).filter(
    (reward) =>
      (!competitionId || reward.competitionId === competitionId) &&
      (!unpaidOnly || reward.status !== "PAID")
  );
  if (rewards.length === 0) return null;

  const handleClaim = async (reward: Reward) => {
    setBusyId(reward.id);
    setError(null);
    try {
      await api.claimReward(reward.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the FAITH servers. Try again.");
    } finally {
      await refresh();
      setBusyId(null);
    }
  };

  return (
    <View style={styles.panel}>
      {rewards.map((reward) => {
        const paid = reward.status === "PAID";
        const sending = reward.status === "SENDING";
        const busy = busyId === reward.id;
        return (
          <View key={reward.id} style={styles.row}>
            <MaterialCommunityIcon
              name={reward.kind === "PRIZE" ? "gift-outline" : "cash-refund"}
              size={22}
              color={paid ? colors.textMuted : colors.accent}
            />
            <View style={styles.body}>
              <Text style={styles.title}>
                {reward.kind === "PRIZE"
                  ? `Prize${reward.rank !== null ? ` · rank #${reward.rank}` : ""}`
                  : "Entry refund"}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {reward.competitionName}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, paid && styles.amountPaid]}>{formatSol(reward.lamports)}</Text>
              {paid ? (
                <Text style={styles.paid}>PAID</Text>
              ) : (
                <FaithButton
                  label={busy ? "…" : sending ? "CHECK" : "CLAIM"}
                  onPress={() => handleClaim(reward)}
                  disabled={busy}
                  style={styles.claimButton}
                />
              )}
            </View>
          </View>
        );
      })}
      {rewards.some((reward) => reward.status === "SENDING") && (
        <Text style={styles.note}>A payout is on its way to your wallet. Tap CHECK to update it.</Text>
      )}
      {rewards.some((reward) => reward.status !== "PAID") && (
        <Text style={styles.note}>
          Solana's network fee ({(rewards[0].networkFeeLamports / 1_000_000_000).toFixed(6)} SOL) comes
          out of each payout.
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: "stretch",
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
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "800",
  },
  amountPaid: {
    color: colors.textSecondary,
  },
  paid: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  claimButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    paddingBottom: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    paddingBottom: spacing.md,
  },
});
