import { PublicKey } from "@solana/web3.js";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useCluster } from "../cluster/cluster-data-access";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";
import { spacing } from "../../design/spacing";
import { ellipsify } from "../../utils/ellipsify";
import { useGetSignatures } from "./account-data-access";

/**
 * Real devnet transaction history for the connected wallet — nothing here is
 * fabricated (spec section 33): if the list is empty, that's because the
 * wallet genuinely has no transactions on the selected cluster yet.
 */
export function TransactionHistoryList({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address });
  const { getExplorerUrl } = useCluster();

  return (
    <View>
      <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>

      {query.isLoading && <Text style={styles.muted}>Loading…</Text>}

      {query.isError && <Text style={styles.error}>Couldn't load transactions.</Text>}

      {query.isSuccess && query.data.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet on this cluster.</Text>
        </View>
      )}

      {query.isSuccess &&
        query.data.slice(0, 10).map((sig) => (
          <Pressable
            key={sig.signature}
            style={styles.row}
            onPress={() => Linking.openURL(getExplorerUrl(`tx/${sig.signature}`))}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.signature}>{ellipsify(sig.signature)}</Text>
              {sig.blockTime && (
                <Text style={styles.timestamp}>
                  {new Date(sig.blockTime * 1000).toLocaleString()}
                </Text>
              )}
            </View>
            <Text style={sig.err ? styles.statusError : styles.statusOk}>
              {sig.err ? "Failed" : "Confirmed"}
            </Text>
          </Pressable>
        ))}
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
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLeft: {
    flex: 1,
  },
  signature: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusOk: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  statusError: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "700",
  },
});
