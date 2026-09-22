import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect } from "react";
import { useTheme } from "react-native-paper";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { colors } from "../design/colors";
import { CompeteScreen } from "../screens/CompeteScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

/**
 * "Run" isn't a real tab content area — the game is a full-screen, nav-free
 * experience (spec section 20). Its tabPress listener intercepts the switch
 * and pushes the root stack's Game screen instead; this component only
 * renders as a fallback if that interception is ever bypassed.
 */
function RunTabFallback({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  useEffect(() => {
    navigation.navigate("Game");
  }, [navigation]);
  return null;
}

/**
 * Main navigator with a bottom tab bar: HOME / RUN / COMPETE / RANK / PROFILE,
 * matching the FAITH RUN spec's nav (section 22) — RUN gets stronger visual
 * emphasis since it's the primary action.
 */
export function HomeNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <TopBar />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = route.name === "Run" ? size * 1.3 : size;
          const iconName = (() => {
            switch (route.name) {
              case "Home":
                return focused ? "home" : "home-outline";
              case "Run":
                return "lightning-bolt";
              case "Compete":
                return focused ? "trophy" : "trophy-outline";
              case "Rank":
                return "podium";
              case "Profile":
                return focused ? "account-circle" : "account-circle-outline";
              default:
                return "circle";
            }
          })();
          return (
            <MaterialCommunityIcon
              name={iconName as any}
              size={iconSize}
              color={route.name === "Run" ? colors.accent : color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Run"
        component={RunTabFallback}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Game");
          },
        })}
      />
      <Tab.Screen name="Compete" component={CompeteScreen} />
      <Tab.Screen name="Rank" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
