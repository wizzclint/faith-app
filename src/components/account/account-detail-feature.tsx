import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { useRewards } from "../../services/competition/hooks";
import { useAuthorization } from "../../utils/useAuthorization";
import { RewardsPanel } from "../compete/RewardsPanel";
import { WalletSummary } from "./account-ui";
import { WalletHistory } from "./transaction-history";

/** The wallet block on Home: balances with Deposit and Withdraw, rewards waiting, and history. */
export function AccountDetailFeature() {
  const { selectedAccount } = useAuthorization();
  const { data: rewards } = useRewards();

  if (!selectedAccount) {
    return null;
  }

  const waiting = (rewards?.rewards ?? []).some((reward) => reward.status !== "PAID");

  return (
    <View style={styles.stack}>
      <WalletSummary address={selectedAccount.publicKey} />
      {waiting && (
        <View>
          <Text style={styles.sectionLabel}>PENDING REWARDS</Text>
          <RewardsPanel unpaidOnly />
        </View>
      )}
      <WalletHistory address={selectedAccount.publicKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
});
