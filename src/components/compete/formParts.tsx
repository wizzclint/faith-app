import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { PAY_STAGE_LABELS, PayStage } from "../../services/competition/hooks";
import { GlowButton } from "../ui/GlowButton";

interface ChipsProps<T extends string | number> {
  options: Array<{ key: T; label: string }>;
  selected: T | null;
  onSelect: (key: T) => void;
}

export function Chips<T extends string | number>({ options, selected, onSelect }: ChipsProps<T>) {
  return (
    <View style={formStyles.chips}>
      {options.map((option) => {
        const active = option.key === selected;
        return (
          <Pressable
            key={option.key}
            style={[formStyles.chip, active && formStyles.chipActive]}
            onPress={() => onSelect(option.key)}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
          >
            <Text style={[formStyles.chipText, active && formStyles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A "label ........ value" line in a money summary. */
export function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={formStyles.summaryRow}>
      <Text style={formStyles.summaryLabel}>{label}</Text>
      <Text style={[formStyles.summaryValue, strong && formStyles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

interface SubmitProps {
  label: string;
  onPress: () => void;
  /** Set while creating or paying; replaces the button with what's happening. */
  stage: PayStage | null;
  disabled?: boolean;
  error: string | null;
}

/** The form's one button, its progress while a payment is under way, and any error. */
export function Submit({ label, onPress, stage, disabled = false, error }: SubmitProps) {
  return (
    <View style={formStyles.submit}>
      {error && <Text style={formStyles.error}>{error}</Text>}
      {stage ? (
        <View style={formStyles.stage}>
          <ActivityIndicator color={colors.accent} />
          <Text style={formStyles.stageText}>{PAY_STAGE_LABELS[stage]}</Text>
        </View>
      ) : (
        <GlowButton label={label} onPress={onPress} disabled={disabled} />
      )}
    </View>
  );
}

export const formStyles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  lead: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  help: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.accentBright,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryValueStrong: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "900",
  },
  submit: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  stage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    height: 56,
  },
  stageText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
