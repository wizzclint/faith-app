import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { useGameStore } from "../../store/gameStore";
import { ComboDisplay } from "./ComboDisplay";

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

// Icons and colors mirror the in-game power-up sprites (PowerUpSprite).
const POWER_UP_ICONS: Array<{ key: "shield" | "magnet" | "boost"; icon: IconName; color: string }> = [
  { key: "shield", icon: "shield", color: colors.accentSecondary },
  { key: "magnet", icon: "magnet", color: colors.textSecondary },
  { key: "boost", icon: "flash", color: colors.warning },
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
      <View style={styles.frame} pointerEvents="box-none">
        <Image
          source={require("../../../assets/ui/hud-frame.png")}
          style={styles.frameImage}
          resizeMode="stretch"
          fadeDuration={0}
        />
        <View style={styles.panel}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {score.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.panel, styles.panelRight]}>
          <View style={styles.coinLabelRow}>
            <View style={styles.coinDot} />
            <Text style={styles.label}>COINS</Text>
          </View>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {coins.toLocaleString()}
          </Text>
        </View>
        <Pressable style={styles.pauseRing} onPress={onPause} hitSlop={12}>
          <MaterialCommunityIcon name="pause" size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ComboDisplay combo={combo} />

      {(activeTimers.length > 0 || powerUps.secondChance === 1) && (
        <View style={styles.powerUpRow}>
          {activeTimers.map(({ key, icon, color }) => (
            <View key={key} style={styles.powerUpBadge}>
              <MaterialCommunityIcon name={icon} size={18} color={color} />
              <Text style={styles.powerUpTimer}>{powerUps[key]}s</Text>
            </View>
          ))}
          {powerUps.secondChance === 1 && (
            <View style={styles.powerUpBadge}>
              <MaterialCommunityIcon name="star-four-points" size={18} color={colors.success} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const FRAME_HEIGHT = 76;
const PAUSE_SIZE = 56;

const styles = StyleSheet.create({
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  frame: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: FRAME_HEIGHT,
  },
  frameImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  // The frame art's flat panel area is the outer third on each side.
  panel: {
    width: "33%",
    paddingLeft: 16,
  },
  panelRight: {
    alignItems: "flex-end",
    paddingLeft: 0,
    paddingRight: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
  },
  coinLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
  },
  pauseRing: {
    position: "absolute",
    left: "50%",
    marginLeft: -PAUSE_SIZE / 2,
    top: (FRAME_HEIGHT - PAUSE_SIZE) / 2,
    width: PAUSE_SIZE,
    height: PAUSE_SIZE,
    borderRadius: PAUSE_SIZE / 2,
    backgroundColor: "#03161B",
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  powerUpRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  powerUpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  powerUpTimer: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
