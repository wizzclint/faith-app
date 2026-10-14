import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MatchAlert } from "../components/compete/MatchAlert";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { colors } from "../design/colors";
import { CompeteScreen } from "../screens/CompeteScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Home: { active: "home", inactive: "home-outline" },
  Run: { active: "lightning-bolt", inactive: "lightning-bolt" },
  Compete: { active: "trophy", inactive: "trophy-outline" },
  Rank: { active: "podium", inactive: "podium" },
  Profile: { active: "account-circle", inactive: "account-circle-outline" },
};

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

/** Rounded neon tab bar: icon + label per tab, with a glowing line under the active one. */
function FaithTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icons = TAB_ICONS[route.name];
          const color = focused ? colors.accent : colors.textSecondary;

          const onPress = () => {
            // Emitting tabPress keeps per-tab listeners working (the Run tab relies on it).
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={route.name}
            >
              <MaterialCommunityIcon
                name={icons ? (focused ? icons.active : icons.inactive) : "circle"}
                size={route.name === "Run" ? 30 : 26}
                color={color}
              />
              <Text style={[styles.tabLabel, { color }]}>{route.name}</Text>
              {focused && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Main navigator with a bottom tab bar: HOME / RUN / COMPETE / RANK / PROFILE,
 * matching the FAITH RUN spec's nav (section 22).
 */
export function HomeNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FaithTabBar {...props} />}
      screenOptions={{
        header: () => (
          <>
            <TopBar />
            <MatchAlert />
          </>
        ),
      }}
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

const styles = StyleSheet.create({
  // The root SafeAreaView already clears the system gesture area, so no bottom inset is added here.
  tabBarWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: "row",
    height: 68,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
