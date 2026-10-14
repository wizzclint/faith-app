/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 */
import { DarkTheme as NavigationDarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import * as Screens from "../screens";
import { HomeNavigator } from "./HomeNavigator";
import { StatusBar } from "expo-status-bar";
import { MD3DarkTheme, adaptNavigationTheme } from "react-native-paper";
import { colors } from "../design/colors";

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 *
 */

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  /** With a competitionId, the run is one of the player's attempts in that competition. */
  Game: { competitionId: string; competitionName: string; attemptsPerPlayer: number } | undefined;
  Missions: undefined;
  /** `notice` is shown once on arrival, e.g. why a payment made while creating it didn't go through. */
  Competition: { id: string; notice?: string };
  /** `opponent` preselects who a head-to-head is against: the house right away, or any player. */
  CreateCompetition: { kind: "HEAD_TO_HEAD" | "TOURNAMENT"; opponent?: "HOUSE" | "PLAYER" };
  /** In-app reading: help, responsible gaming, about. */
  Info: { topic: "help" | "responsible" | "about" };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName={"Home"}>
      <Stack.Screen
        name="HomeStack"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Settings" component={Screens.SettingsScreen} />
      <Stack.Screen
        name="Game"
        component={Screens.GameScreen}
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="Missions"
        component={Screens.MissionsScreen}
        options={{ title: "Missions" }}
      />
      <Stack.Screen
        name="Competition"
        component={Screens.CompetitionScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="CreateCompetition"
        component={Screens.CreateCompetitionScreen}
        options={{ title: "" }}
      />
      <Stack.Screen name="Info" component={Screens.InfoScreen} options={{ title: "" }} />
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

// Dark-only, with the FAITH background so screen transitions never flash a different shade.
const { DarkTheme } = adaptNavigationTheme({ reactNavigationDark: NavigationDarkTheme });
const navigationTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
  },
};

export const AppNavigator = (props: NavigationProps) => {
  return (
    <NavigationContainer theme={navigationTheme} {...props}>
      <StatusBar style="light" />
      <AppStack />
    </NavigationContainer>
  );
};
