import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onExit: () => void;
}

/**
 * Translucent — gameplay stays faintly visible behind it (spec section 20),
 * unlike Game Over which is a hard stop. Reuses the same recolored glass
 * panel as Game Over for the card chrome.
 */
export function PauseOverlay({ onResume, onRestart, onSettings, onExit }: PauseOverlayProps) {
  return (
    <View style={styles.overlay}>
      <ImageBackground
        source={require("../../../assets/sprites/ui/panel_glass.png")}
        resizeMode="stretch"
        style={styles.card}
      >
        <Text style={styles.title}>PAUSED</Text>

        <Pressable style={styles.primaryButton} onPress={onResume}>
          <Text style={styles.primaryButtonText}>RESUME</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onRestart}>
          <Text style={styles.secondaryButtonText}>RESTART</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onSettings}>
          <Text style={styles.secondaryButtonText}>SETTINGS</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onExit}>
          <Text style={styles.secondaryButtonText}>EXIT</Text>
        </Pressable>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,9,13,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: spacing.xxl,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: spacing.md,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 1,
  },
});
