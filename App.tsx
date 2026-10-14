// Polyfills
import "./src/polyfills";

import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { PaperProvider, MD3DarkTheme, adaptNavigationTheme } from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { colors } from "./src/design/colors";

const queryClient = new QueryClient();

// FAITH RUN is dark-only: every screen hardcodes the dark palette, so the
// Paper theme must not follow a phone that's set to light mode.
const { DarkTheme } = adaptNavigationTheme({ reactNavigationDark: NavigationDarkTheme });
const paperTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    // FAITH palette for the template's Paper components (wallet buttons, menus, modals).
    primary: colors.accent,
    onPrimary: colors.accentInk,
    secondaryContainer: colors.accentDeep,
    onSecondaryContainer: colors.accentBright,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceElevated,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: colors.surface,
      level2: colors.surfaceElevated,
      level3: colors.surfaceElevated,
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.shell}>
      <QueryClientProvider client={queryClient}>
        <ClusterProvider>
          <ConnectionProvider config={{ commitment: "processed" }}>
            <SafeAreaView style={styles.safeArea}>
              <PaperProvider theme={paperTheme}>
                <AppNavigator />
              </PaperProvider>
            </SafeAreaView>
          </ConnectionProvider>
        </ClusterProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
