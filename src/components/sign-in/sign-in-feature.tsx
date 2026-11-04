import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { ConnectButton } from "./sign-in-ui";

/** Shown in the wallet block before any wallet is connected. */
export function SignInFeature() {
  return (
    <View style={styles.block}>
      <Text style={styles.body}>
        Play free, or connect your wallet to compete and save leaderboard scores.
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
