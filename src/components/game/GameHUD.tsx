import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { useGameStore } from "../../store/gameStore";
import { ComboDisplay } from "./ComboDisplay";

const POWER_UP_ICONS: Array<{ key: "shield" | "magnet" | "boost"; icon: string }> = [
  { key: "shield", icon: "🛡" },
  { key: "magnet", icon: "🧲" },
  { key: "boost", icon: "⚡" },
];

interface GameHUDProps {
  onPause: () => void;
}

export function GameHUD({ onPause }: GameHUDProps) {
  const score = useGameStore((s) => s.score);
  const coins = useGameStore((s) => s.coins);
  const combo = useGameStore((s) => s.combo);
  const powerUps = useGameStore((s) => s.powerUps);

  const activeTimers = POWER_UP_ICONS.filter(({ key }) => powerUps[key] > 0);

  return (
    <View style={styles.hud} pointerEvents="box-none">
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{score.toLocaleString()}</Text>
        </View>
        <Pressable style={styles.pauseButton} onPress={onPause} hitSlop={12}>
          <MaterialCommunityIcon name="pause" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.coinsBlock}>
          <Text style={styles.label}>COINS</Text>
          <Text style={styles.value}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      <ComboDisplay combo={combo} />

      {(activeTimers.length > 0 || powerUps.secondChance === 1) && (
        <View style={styles.powerUpRow}>
          {activeTimers.map(({ key, icon }) => (
            <View key={key} style={styles.powerUpBadge}>
              <Text style={styles.powerUpIcon}>{icon}</Text>
              <Text style={styles.powerUpTimer}>{powerUps[key]}s</Text>
            </View>
          ))}
          {powerUps.secondChance === 1 && (
            <View style={styles.powerUpBadge}>
              <Text style={styles.powerUpIcon}>💫</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  pauseButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  coinsBlock: {
    alignItems: "flex-end",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  powerUpRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  powerUpBadge: {
    alignItems: "center",
  },
  powerUpIcon: {
    fontSize: 20,
  },
  powerUpTimer: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
});
