import React, { useEffect } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import ClusterPickerFeature from "../components/cluster/cluster-picker-feature";
import { LinkRow } from "../components/ui/LinkRow";
import { ToggleRow } from "../components/ui/ToggleRow";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";
import { useSettingsStore } from "../store/settingsStore";

const COMING_SOON = (title: string) =>
  Alert.alert(title, "Not written yet — this will hold the real content before launch.");

export function SettingsScreen() {
  const loaded = useSettingsStore((s) => s.loaded);
  const load = useSettingsStore((s) => s.load);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggle = useSettingsStore((s) => s.toggle);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>GAME</Text>
      <View style={styles.section}>
        <ToggleRow label="Sound Effects" value={soundEnabled} onValueChange={() => toggle("soundEnabled")} />
        <ToggleRow label="Music" value={musicEnabled} onValueChange={() => toggle("musicEnabled")} />
        <ToggleRow
          label="Vibration"
          value={vibrationEnabled}
          onValueChange={() => toggle("vibrationEnabled")}
        />
        <ToggleRow
          label="Notifications"
          value={notificationsEnabled}
          onValueChange={() => toggle("notificationsEnabled")}
        />
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.section}>
        <ClusterPickerFeature />
      </View>

      <Text style={styles.sectionTitle}>SUPPORT</Text>
      <View style={styles.section}>
        <LinkRow label="Help" onPress={() => COMING_SOON("Help")} />
        <LinkRow label="Terms & Conditions" onPress={() => COMING_SOON("Terms & Conditions")} />
        <LinkRow label="Privacy Policy" onPress={() => COMING_SOON("Privacy Policy")} />
        <LinkRow label="Responsible Gaming" onPress={() => COMING_SOON("Responsible Gaming")} />
        <LinkRow label="About FAITH" onPress={() => COMING_SOON("About FAITH")} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.giant,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.caption,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
});
