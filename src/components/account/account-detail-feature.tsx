import { View } from "react-native";
import { useAuthorization } from "../../utils/useAuthorization";
import { TransactionHistoryList } from "./transaction-history";
import {
  AccountBalance,
  AccountButtonGroup,
  AccountTokens,
} from "./account-ui";

export function AccountDetailFeature() {
  const { selectedAccount } = useAuthorization();

  if (!selectedAccount) {
    return null;
  }

  return (
    <>
      <View style={{ marginTop: 24, alignItems: "center" }}>
        <AccountBalance address={selectedAccount.publicKey} />
        <AccountButtonGroup address={selectedAccount.publicKey} />
      </View>
      <View style={{ marginTop: 32 }}>
        <TransactionHistoryList address={selectedAccount.publicKey} />
      </View>
      <View style={{ marginTop: 32 }}>
        <AccountTokens address={selectedAccount.publicKey} />
      </View>
    </>
  );
}
