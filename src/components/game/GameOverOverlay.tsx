import React, { useEffect, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { SCORE_COUNT_UP_MS } from "../../game/constants";
import { useGameStore } from "../../store/gameStore";

interface GameOverOverlayProps {
  onPlayAgain: () => void;
  onHome: () => void;
}

/** Counts 0 → target with an ease-out curve — a plain rAF loop is plenty for a one-shot UI animation. */
function useCountUp(target: number, durationMs: number) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const startTime = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return display;
}

export function GameOverOverlay({ onPlayAgain, onHome }: GameOverOverlayProps) {
  const score = useGameStore((s) => s.score);
  const coins = useGameStore((s) => s.coins);
  const bestScore = useGameStore((s) => s.bestScore);
  const isNewBest = score > 0 && score >= bestScore;
  const displayScore = useCountUp(score, SCORE_COUNT_UP_MS);

  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.value = withTiming(1, { duration: 260 });
  }, [entrance]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 0.92 + entrance.value * 0.08 }],
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={entranceStyle}>
        <ImageBackground
          source={require("../../../assets/sprites/ui/panel_glass.png")}
          resizeMode="stretch"
          style={styles.card}
        >
          <Text style={styles.title}>RUN COMPLETE</Text>

          {isNewBest && <Text style={styles.newBest}>NEW RECORD!</Text>}

          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{displayScore.toLocaleString()}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>BEST</Text>
              <Text style={styles.statValue}>{bestScore.toLocaleString()}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>COINS</Text>
              <Text style={styles.statValue}>{coins.toLocaleString()}</Text>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={onPlayAgain}>
            <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onHome}>
            <Text style={styles.secondaryButtonText}>HOME</Text>
          </Pressable>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,9,13,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  title: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: "center",
  },
  newBest: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textAlign: "center",
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 56,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 36,
  },
  statBlock: {
    alignItems: "center",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginBottom: 12,
    minWidth: 220,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    minWidth: 220,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
});
