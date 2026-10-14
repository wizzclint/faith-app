import { StyleSheet, View } from "react-native";
import { colors } from "../../design/colors";
import { TopBarSettingsButton, TopBarWalletMenu } from "./top-bar-ui";

export function TopBar() {
  return (
    <View style={styles.topBar}>
      <TopBarWalletMenu />
      <TopBarSettingsButton />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
});
