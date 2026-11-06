import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { ChallengeForm } from "../components/compete/ChallengeForm";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";

/** Players create challenges. Tournament hosting belongs to the admin dashboard. */
export function CreateCompetitionScreen() {
  const navigation = useNavigation();
  const { kind, opponent } =
    useRoute<RouteProp<ReactNavigation.RootParamList, "CreateCompetition">>().params;
  const headToHead = kind === "HEAD_TO_HEAD";

  useEffect(() => {
    navigation.setOptions({ title: headToHead ? "Head to head" : "Tournament" });
  }, [headToHead, navigation]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {headToHead ? <ChallengeForm initialOpponent={opponent ?? "PLAYER"} /> : (
        <Text style={{ color: colors.textSecondary }}>Tournaments are hosted by FAITH. Join an event from the Tournaments tab.</Text>
      )}
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
    paddingBottom: spacing.massive,
  },
});
