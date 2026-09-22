import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { FaithButton } from "../ui/FaithButton";
import { useAuthStore } from "../../store/authStore";
import { useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";

/**
 * Runs the real challenge → wallet-sign → verify handshake against
 * faith-server (see src/store/authStore.ts). Separate from the template's
 * own Connect/Sign-in buttons — those authorize the wallet for on-chain
 * actions; this authenticates the player with FAITH's own backend so
 * scores/leaderboard can be tied to their wallet identity.
 */
export function FaithSyncButton() {
  const { selectedAccount } = useAuthorization();
  const { signMessage } = useMobileWallet();
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);

  if (!selectedAccount) return null;

  if (status === "authenticated") {
    return (
      <View style={styles.row}>
        <Text style={styles.synced}>✓ Synced with FAITH backend</Text>
      </View>
    );
  }

  const handlePress = () => {
    signIn(selectedAccount.publicKey.toBase58(), signMessage);
  };

  return (
    <View style={styles.row}>
      <FaithButton
        label={status === "signing" ? "SIGNING…" : "SYNC WITH FAITH"}
        onPress={handlePress}
        disabled={status === "signing"}
        variant="secondary"
      />
      {status === "error" && error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 12,
  },
  synced: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
