import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";

interface GameStatProps {
  label: string;
  value: string | number;
  /** Adds a round tinted icon badge above the value. */
  icon?: React.ComponentProps<typeof MaterialCommunityIcon>["name"];
  /** Icon color; the badge behind it is a dark wash of the same color. */
  tint?: string;
}

export function GameStat({ label, value, icon, tint = colors.accent }: GameStatProps) {
  return (
    <View style={styles.block}>
      {icon && (
        <View style={[styles.badge, { borderColor: tint }]}>
          <MaterialCommunityIcon name={icon} size={22} color={tint} />
        </View>
      )}
      <Text style={styles.value}>{typeof value === "number" ? value.toLocaleString() : value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: "center",
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 2,
  },
});
