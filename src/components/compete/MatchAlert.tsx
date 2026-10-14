import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { runsLeft, useMatchesToPlay } from "../../services/competition/hooks";
import { Countdown } from "./Countdown";

/**
 * A bar under the top bar whenever the player has a matched head-to-head with
 * runs still to play. The match clock starts the moment an opponent accepts,
 * which can happen while the player is on another tab — this is how they find out.
 */
export function MatchAlert() {
  const navigation = useNavigation();
  const [match] = useMatchesToPlay();
  if (!match) return null;

  const left = runsLeft(match);
  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
        onPress={() => navigation.navigate("Competition", { id: match.id })}
        accessibilityRole="button"
        accessibilityLabel="Open your match"
      >
        <MaterialCommunityIcon name="sword-cross" size={20} color={colors.accentInk} />
        <View style={styles.body}>
          <Text style={styles.title}>YOUR MATCH IS ON</Text>
          <Text style={styles.detail}>
            {left} {left === 1 ? "run" : "runs"} to play
          </Text>
        </View>
        <Countdown to={match.endsAt} suffix=" LEFT" style={styles.clock} />
        <MaterialCommunityIcon name="chevron-right" size={22} color={colors.accentInk} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.accentInk,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  detail: {
    color: colors.accentInk,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  clock: {
    color: colors.accentInk,
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
