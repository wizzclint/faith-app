import React, { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";
import { spacing } from "../../design/spacing";

interface FaithCardProps {
  style?: ViewStyle;
  elevated?: boolean;
}

export function FaithCard({ children, style, elevated }: PropsWithChildren<FaithCardProps>) {
  return (
    <View style={[styles.base, elevated && styles.elevated, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.largeCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
});
