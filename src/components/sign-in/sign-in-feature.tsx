import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { ConnectButton } from "./sign-in-ui";

/** Shown in the wallet block before any wallet is connected. */
export function SignInFeature() {
  return (
    <View style={styles.block}>
      <Text style={styles.body}>
        Playing is free and needs no wallet. Connect a Solana wallet to put your scores on the
        leaderboard, play head-to-heads and tournaments, and collect what you win.
      </Text>
      <ConnectButton />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
