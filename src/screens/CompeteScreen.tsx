import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";

/**
 * Honest placeholder: head-to-head, tournaments, and competitive entries all
 * need the backend + Solana layers (spec Phases 5–6) to mean anything real.
 * Rather than fabricate fake opponents or prize pools, this says what's
 * coming and points back to what already works today.
 */
export function CompeteScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.icon}>🏆</Text>
      <Text style={styles.title}>COMPETITIVE MODE</Text>
      <Text style={styles.body}>
        Head-to-head challenges and tournaments land once the backend and Solana
        layers are wired up. For now, chase your own best score in Free Run.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    ...typography.heading,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
});
