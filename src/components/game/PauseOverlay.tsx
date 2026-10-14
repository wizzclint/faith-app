import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { FramedCard } from "../ui/FramedCard";
import { GlowButton } from "../ui/GlowButton";

interface PauseOverlayProps {
  onResume: () => void;
  /** Left out for a competition run, which can't be replayed. */
  onRestart?: () => void;
  onSettings: () => void;
  onExit: () => void;
  exitLabel?: string;
  /** A line under the title, e.g. which competition run this is. */
  note?: string;
}

/**
 * Translucent — gameplay stays faintly visible behind it (spec section 20),
 * unlike Game Over which is a hard stop. Shares the Game Over card frame.
 */
export function PauseOverlay({
  onResume,
  onRestart,
  onSettings,
  onExit,
  exitLabel = "EXIT",
  note,
}: PauseOverlayProps) {
  return (
    <View style={styles.overlay}>
      <FramedCard style={styles.card}>
        <Text style={[styles.title, !!note && styles.titleWithNote]}>PAUSED</Text>
        {note && <Text style={styles.note}>{note}</Text>}

        <GlowButton label="RESUME" icon="play" onPress={onResume} style={styles.resume} />
        {onRestart && (
          <Pressable style={styles.secondaryButton} onPress={onRestart}>
            <Text style={styles.secondaryButtonText}>RESTART</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={onSettings}>
          <Text style={styles.secondaryButtonText}>SETTINGS</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onExit}>
          <Text style={styles.secondaryButtonText}>{exitLabel}</Text>
        </Pressable>
      </FramedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,8,11,0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: spacing.xxl,
  },
  titleWithNote: {
    marginBottom: spacing.sm,
  },
  note: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  resume: {
    marginBottom: spacing.md,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignSelf: "stretch",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 2,
  },
});
