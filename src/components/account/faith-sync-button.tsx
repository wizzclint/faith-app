import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { FaithButton } from "../ui/FaithButton";
import { useAuthStore } from "../../store/authStore";
import { useAuthorization } from "../../utils/useAuthorization";
import { useConnectWallet } from "../sign-in/sign-in-ui";

/** Connection signs the player in automatically; only show progress or recovery. */
export function FaithSyncButton() {
  const { selectedAccount } = useAuthorization();
  const { connect, connecting } = useConnectWallet();
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  if (!selectedAccount || status === "authenticated") return null;
  const busy = connecting || status === "signing";
  return (
    <View style={styles.row}>
      <FaithButton label={busy ? "CONNECTING…" : "FINISH CONNECTING"}
        onPress={connect} disabled={busy} variant="secondary" />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { marginTop: 12 },
  error: { color: colors.danger, fontSize: 12, marginTop: 8, textAlign: "center" },
});
