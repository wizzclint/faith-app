import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";
import { spacing } from "../../design/spacing";
import { soundManager } from "../../game/audio/soundManager";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

interface FaithButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function FaithButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
}: FaithButtonProps) {
  const handlePress = () => {
    soundManager.playUiTap();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, variantLabelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tertiary: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.danger },
});

const variantLabelStyles = StyleSheet.create({
  primary: { color: colors.background },
  secondary: { color: colors.textPrimary },
  tertiary: { color: colors.textSecondary },
  danger: { color: colors.textPrimary },
});
