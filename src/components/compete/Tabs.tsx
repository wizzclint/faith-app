import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { soundManager } from "../../game/audio/soundManager";

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

interface SegmentedProps<T extends string> {
  options: Array<{ key: T; label: string; icon: IconName }>;
  selected: T;
  onSelect: (key: T) => void;
}

/** The big two-way switch at the top of Compete: Head to Head | Tournaments. */
export function Segmented<T extends string>({ options, selected, onSelect }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.key === selected;
        return (
          <Pressable
            key={option.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => {
              soundManager.playUiTap();
              onSelect(option.key);
            }}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
          >
            <MaterialCommunityIcon
              name={option.icon}
              size={18}
              color={active ? colors.accentInk : colors.textSecondary}
            />
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface TabStripProps<T extends string> {
  tabs: Array<{ key: T; label: string; count?: number }>;
  selected: T;
  onSelect: (key: T) => void;
}

/** The smaller row of tabs under the switch, each with an optional count. */
export function TabStrip<T extends string>({ tabs, selected, onSelect }: TabStripProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.stripContent}
    >
      {tabs.map((tab) => {
        const active = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
          >
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              {!!tab.count && (
                <View style={[styles.count, active && styles.countActive]}>
                  <Text style={[styles.countText, active && styles.countTextActive]}>{tab.count}</Text>
                </View>
              )}
            </View>
            <View style={[styles.underline, active && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 14,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  segmentTextActive: {
    color: colors.accentInk,
  },
  strip: {
    marginTop: spacing.lg,
    flexGrow: 0,
  },
  stripContent: {
    gap: spacing.xl,
    paddingRight: spacing.lg,
  },
  tab: {
    paddingTop: 4,
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.track,
    alignItems: "center",
    justifyContent: "center",
  },
  countActive: {
    backgroundColor: colors.accentDeep,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  countTextActive: {
    color: colors.accentBright,
  },
  underline: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    backgroundColor: "transparent",
  },
  underlineActive: {
    backgroundColor: colors.accent,
  },
});
