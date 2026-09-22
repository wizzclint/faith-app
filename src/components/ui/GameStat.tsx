import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";

interface GameStatProps {
  label: string;
  value: string | number;
}

export function GameStat({ label, value }: GameStatProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.value}>{typeof value === "number" ? value.toLocaleString() : value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: "center",
  },
  value: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
