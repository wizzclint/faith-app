import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ChallengeForm } from "../components/compete/ChallengeForm";
import { TournamentForm } from "../components/compete/TournamentForm";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";

/** Starting a head-to-head (against the house or posted for players), or opening a tournament. */
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
      {headToHead ? <ChallengeForm initialOpponent={opponent ?? "PLAYER"} /> : <TournamentForm />}
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
