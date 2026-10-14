import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinkRow } from "../components/ui/LinkRow";
import { ToggleRow } from "../components/ui/ToggleRow";
import { links } from "../config/links";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { typography } from "../design/typography";
import { useServerConfig } from "../services/competition/hooks";
import { useSettingsStore } from "../store/settingsStore";

export function SettingsScreen() {
  const navigation = useNavigation();
  const { data: config } = useServerConfig();
  const cluster = config?.cluster ?? "devnet";
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
        {/* The network is set by the FAITH server, not chosen here: stakes and payouts only work on its cluster. */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Network</Text>
          <Text style={styles.infoValue}>
            Solana {cluster}
            {cluster !== "mainnet-beta" ? " · test SOL" : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>SUPPORT</Text>
      <View style={styles.section}>
        <LinkRow label="Help" onPress={() => navigation.navigate("Info", { topic: "help" })} />
        <LinkRow label="Terms & Conditions" onPress={() => Linking.openURL(links.terms)} />
        <LinkRow label="Privacy Policy" onPress={() => Linking.openURL(links.privacy)} />
        <LinkRow
          label="Responsible Gaming"
          onPress={() => navigation.navigate("Info", { topic: "responsible" })}
        />
        <LinkRow label="About FAITH" onPress={() => navigation.navigate("Info", { topic: "about" })} />
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  infoLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
