import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "../../design/colors";
import { SCORE_COUNT_UP_MS } from "../../game/constants";
import { useGameStore } from "../../store/gameStore";
import { FramedCard } from "../ui/FramedCard";
import { GlowButton } from "../ui/GlowButton";

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

interface GameOverOverlayProps {
  /** Left out when there is nothing to play next, e.g. a competition run with no runs remaining. */
  onPlayAgain?: () => void;
  playAgainLabel?: string;
  playAgainIcon?: IconName;
  onHome: () => void;
  /** Extra status line, e.g. how a competition run was recorded. */
  note?: string;
  homeLabel?: string;
  /** Holds the player here, e.g. while a competition score is still being sent. */
  homeDisabled?: boolean;
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

export function GameOverOverlay({
  onPlayAgain,
  playAgainLabel = "PLAY AGAIN",
  playAgainIcon = "restart",
  onHome,
  note,
  homeLabel = "HOME",
  homeDisabled = false,
}: GameOverOverlayProps) {
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
      <Animated.View style={[styles.cardWrap, entranceStyle]}>
        <FramedCard style={styles.card} contentStyle={styles.cardContent}>
          <Text style={styles.title}>
            RUN <Text style={styles.titleAccent}>COMPLETE</Text>
          </Text>

          {isNewBest && <Text style={styles.newBest}>NEW RECORD!</Text>}
          {note && <Text style={styles.note}>{note}</Text>}

          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue} numberOfLines={1} adjustsFontSizeToFit>
            {displayScore.toLocaleString()}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>BEST SCORE</Text>
              <Text style={styles.statValue}>{bestScore.toLocaleString()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>COINS</Text>
              <View style={styles.coinRow}>
                <View style={styles.coinDot} />
                <Text style={styles.statValue}>{coins.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {onPlayAgain && (
            <GlowButton
              label={playAgainLabel}
              icon={playAgainIcon}
              onPress={onPlayAgain}
              style={styles.playAgain}
            />
          )}
          <Pressable
            style={({ pressed }) => [
              styles.homeButton,
              pressed && styles.pressed,
              homeDisabled && styles.homeDisabled,
            ]}
            onPress={onHome}
            disabled={homeDisabled}
          >
            <MaterialCommunityIcon name="home" size={22} color={colors.textPrimary} />
            <Text style={styles.homeButtonText}>{homeLabel}</Text>
          </Pressable>
        </FramedCard>

        <View style={styles.trophy}>
          <MaterialCommunityIcon name="hexagon" size={TROPHY_SIZE} color="#2B2006" style={styles.trophyLayer} />
          <MaterialCommunityIcon
            name="hexagon-outline"
            size={TROPHY_SIZE}
            color={colors.warning}
            style={styles.trophyLayer}
          />
          <MaterialCommunityIcon name="trophy" size={34} color={colors.warning} />
        </View>
      </Animated.View>
    </View>
  );
}

const TROPHY_SIZE = 84;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,8,11,0.8)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  card: {
    width: "100%",
  },
  // Extra top padding leaves room for the trophy badge.
  cardContent: {
    paddingTop: 68,
  },
  // Sits on the frame's top edge, like the badge in the mockup.
  trophy: {
    position: "absolute",
    top: -26,
    width: TROPHY_SIZE,
    height: TROPHY_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  trophyLayer: {
    position: "absolute",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 14,
    textAlign: "center",
  },
  titleAccent: {
    color: colors.accent,
  },
  newBest: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: "center",
  },
  note: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
    textAlign: "center",
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
  },
  scoreValue: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: "900",
    marginBottom: 14,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 26,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.warning,
    marginTop: 2,
  },
  playAgain: {
    marginBottom: 14,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "stretch",
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  homeDisabled: {
    opacity: 0.35,
  },
  homeButtonText: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1.5,
  },
});
