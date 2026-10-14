import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { PublicKey } from "@solana/web3.js";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";
import { spacing } from "../../design/spacing";
import { explorerUrl, formatSol } from "../../services/competition/format";
import { useServerConfig, useWalletHistory } from "../../services/competition/hooks";
import { WalletHistoryItem } from "../../services/competition/types";
import { useAuthStore } from "../../store/authStore";

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

const KINDS: Record<WalletHistoryItem["type"], { icon: IconName; title: (item: WalletHistoryItem) => string }> = {
  ENTRY: {
    icon: "tray-arrow-up",
    title: (item) => (item.competitionKind === "TOURNAMENT" ? "Tournament entry" : "Head-to-head stake"),
  },
  PRIZE_FUNDED: { icon: "trophy-outline", title: () => "Tournament prize paid in" },
  PRIZE_PAID: { icon: "gift-outline", title: () => "Prize withdrawn to wallet" },
  REFUND_PAID: { icon: "cash-refund", title: () => "Refund withdrawn to wallet" },
};

/**
 * Every SOL movement between this wallet and FAITH (spec section 6): stakes
 * and entry fees paid in, prizes and refunds paid out. Each row opens its
 * transaction on Solana Explorer, and the footer opens the whole wallet there,
 * which also shows deposits from anywhere else.
 */
export function WalletHistory({ address }: { address: PublicKey }) {
  const synced = useAuthStore((s) => s.status === "authenticated");
  const { data: config } = useServerConfig();
  const { data, isLoading, isError, refetch } = useWalletHistory();
  const cluster = config?.cluster;

  return (
    <View>
      <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>

      {!synced ? (
        <Text style={styles.muted}>Sync with FAITH to see your stakes, entries and payouts here.</Text>
      ) : isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : isError ? (
        <Pressable onPress={() => refetch()}>
          <Text style={styles.error}>Couldn't load your history. Tap to try again.</Text>
        </Pressable>
      ) : !data || data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>
            No SOL has moved between your wallet and FAITH yet. Free matches and free tournaments
            don't appear here.
          </Text>
        </View>
      ) : (
        data.map((item) => {
          const kind = KINDS[item.type];
          const incoming = item.direction === "IN";
          return (
            <Pressable
              key={`${item.type}-${item.id}`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              disabled={!item.signature}
              onPress={() => item.signature && Linking.openURL(explorerUrl(`tx/${item.signature}`, cluster))}
            >
              <MaterialCommunityIcon
                name={kind.icon}
                size={22}
                color={incoming ? colors.accent : colors.textSecondary}
              />
              <View style={styles.rowBody}>
                <Text style={styles.title}>{kind.title(item)}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {[item.competitionName, new Date(item.at).toLocaleString()].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.amount, incoming && styles.amountIn]}>
                  {incoming ? "+" : "−"} {formatSol(item.lamports)}
                </Text>
                {item.signature && <Text style={styles.view}>VIEW ↗</Text>}
              </View>
            </Pressable>
          );
        })
      )}

      <Pressable
        style={({ pressed }) => [styles.explorer, pressed && styles.pressed]}
        onPress={() => Linking.openURL(explorerUrl(`address/${address.toBase58()}`, cluster))}
      >
        <MaterialCommunityIcon name="open-in-new" size={16} color={colors.accent} />
        <Text style={styles.explorerText}>All activity for this wallet on Solana Explorer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  rowBody: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  amountIn: {
    color: colors.accent,
  },
  view: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  explorer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
  },
  explorerText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
});
