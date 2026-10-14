import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { Menu } from "react-native-paper";
import { Account, useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { useNavigation } from "@react-navigation/native";
import { ellipsify } from "../../utils/ellipsify";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../design/colors";
import { useCluster } from "../cluster/cluster-data-access";
import { useConnectWallet } from "../sign-in/sign-in-ui";

export function TopBarWalletButton({
  selectedAccount,
  openMenu,
}: {
  selectedAccount: Account | null;
  openMenu: () => void;
}) {
  const { connect } = useConnectWallet();
  return (
    <Pressable
      style={({ pressed }) => [styles.walletPill, pressed && styles.pressed]}
      onPress={selectedAccount ? openMenu : connect}
    >
      <MaterialCommunityIcon name="wallet" size={18} color={colors.textPrimary} />
      <Text style={styles.walletLabel}>
        {selectedAccount
          ? ellipsify(selectedAccount.publicKey.toBase58())
          : "Connect"}
      </Text>
    </Pressable>
  );
}

export function TopBarSettingsButton() {
  const navigation = useNavigation();
  return (
    <Pressable
      style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
      hitSlop={6}
      onPress={() => {
        navigation.navigate("Settings");
      }}
    >
      <MaterialCommunityIcon name="cog" size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});

export function TopBarWalletMenu() {
  const { selectedAccount } = useAuthorization();
  const { getExplorerUrl } = useCluster();
  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { disconnect } = useMobileWallet();

  const copyAddressToClipboard = async () => {
    if (selectedAccount) {
      await Clipboard.setStringAsync(selectedAccount.publicKey.toBase58());
    }
    closeMenu();
  };

  const viewExplorer = () => {
    if (selectedAccount) {
      const explorerUrl = getExplorerUrl(
        `account/${selectedAccount.publicKey.toBase58()}`
      );
      Linking.openURL(explorerUrl);
    }
    closeMenu();
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <TopBarWalletButton
          selectedAccount={selectedAccount}
          openMenu={openMenu}
        />
      }
    >
      <Menu.Item
        onPress={copyAddressToClipboard}
        title="Copy address"
        leadingIcon="content-copy"
      />
      <Menu.Item
        onPress={viewExplorer}
        title="View Explorer"
        leadingIcon="open-in-new"
      />
      <Menu.Item
        onPress={async () => {
          closeMenu();
          // Backing out in the wallet just leaves it connected.
          await disconnect().catch(() => {});
        }}
        title="Disconnect"
        leadingIcon="link-off"
      />
    </Menu>
  );
}
