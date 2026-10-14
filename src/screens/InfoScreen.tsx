import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinkRow } from "../components/ui/LinkRow";
import { links } from "../config/links";
import { colors } from "../design/colors";
import { spacing } from "../design/spacing";
import { useServerConfig } from "../services/competition/hooks";
import { ServerConfig } from "../services/competition/types";

const APP_VERSION: string = require("../../app.json").expo.version;

type Topic = "help" | "responsible" | "about";
interface Section {
  heading: string;
  body: string[];
}

function helpSections(config: ServerConfig | undefined): Section[] {
  const runs = config?.attemptsPerPlayer ?? 3;
  const wait = config?.h2h.matchmakingWindowMin ?? 10;
  const play = config?.h2h.matchDurationMin ?? 10;
  const winRate = config?.house.targetWinRatePct ?? 75;
  const cluster = config?.cluster ?? "devnet";
  return [
    {
      heading: "How to play",
      body: [
        "Swipe left or right to change lanes, up to jump, and down to slide. Hit an obstacle and the run is over.",
        "Coins and distance build your score. Power-ups help: a shield takes one hit, a magnet pulls in coins, a boost speeds you up, and a second chance saves one crash.",
      ],
    },
    {
      heading: "XP, levels and missions",
      body: [
        "Every run earns XP, and daily missions and the daily challenge earn more. XP raises your level. All of this is free and needs no wallet.",
      ],
    },
    {
      heading: "Wallet and syncing",
      body: [
        "Connect a Solana wallet app, then tap SYNC WITH FAITH. Syncing asks your wallet to sign a short message that proves the wallet is yours. It is not a transaction and costs nothing.",
        "Syncing puts your scores on the leaderboard and unlocks head-to-heads, tournaments and rewards. If you cancel in your wallet, nothing happens and you can try again.",
      ],
    },
    {
      heading: "Head-to-head",
      body: [
        `Play the house straight away, or post a challenge for any player, who has ${wait} minutes to accept it. Either way you each get ${runs} runs and the higher total wins.`,
        `Once a match starts you have ${play} minutes to play your runs. Starting a run uses it even if you close the app, and runs not played in time count as 0. Level totals go to sudden death; a draw refunds both stakes.`,
      ],
    },
    {
      heading: "The house",
      body: [
        `The house is FAITH's own automated player, always marked HOUSE. It is tuned to win about ${winRate}% of its matches, its level is set from your recent scores, and its runs are fixed before you play yours. Its real record is shown when you choose it.`,
      ],
    },
    {
      heading: "Tournaments",
      body: [
        `Everyone gets ${runs} runs and the leaderboard ranks total scores. Prizes are split as shown on each tournament. Players can open up to 3 tournaments a month for up to 20 players each.`,
      ],
    },
    {
      heading: "SOL and your wallet section",
      body: [
        "Available balance is the SOL in your connected wallet. Game balance is SOL you've staked in matches that haven't finished. Pending rewards are prizes and refunds waiting for you.",
        "Deposit shows your wallet address. Withdraw sends your pending rewards to your wallet; Solana's small network fee comes out of each payout. Every payment and payout is listed in your transaction history with a link to it on Solana Explorer.",
        cluster === "mainnet-beta"
          ? "Paid competitions are switched off."
          : `FAITH RUN currently runs on Solana ${cluster}, where SOL is free test money with no real-world value.`,
      ],
    },
  ];
}

const RESPONSIBLE: Section[] = [
  {
    heading: "Play for fun",
    body: [
      "Everything in FAITH RUN can be played for free. Staked matches and paid tournaments are optional.",
      "FAITH RUN currently uses Solana devnet, where SOL has no real-world value. Real-money play will only be switched on after a legal review, with its own rules and limits.",
    ],
  },
  {
    heading: "Know the odds",
    body: [
      "The house is tuned to win about three matches in four. Over many staked matches against it, you should expect to lose more than you win.",
      "Only ever stake what you can afford to lose, and never stake to win back a loss.",
    ],
  },
  {
    heading: "Take breaks",
    body: [
      "Set yourself a time and a spending limit before you play, and stop when you reach either.",
      "If playing for SOL stops feeling like a game, stop, and talk to someone you trust or a gambling support service where you live.",
    ],
  },
];

function aboutSections(config: ServerConfig | undefined): Section[] {
  return [
    {
      heading: "FAITH RUN",
      body: [
        "An endless runner you can play free, with optional Solana features: a wallet-linked profile on the leaderboard, head-to-head matches, and tournaments with SOL prizes.",
        "Your wallet is your account. FAITH never sees or stores your private key or seed phrase; every payment is approved in your own wallet app.",
      ],
    },
    {
      heading: "This build",
      body: [
        `Version ${APP_VERSION}. Network: Solana ${config?.cluster ?? "devnet"}.`,
      ],
    },
  ];
}

const TITLES: Record<Topic, string> = {
  help: "Help",
  responsible: "Responsible gaming",
  about: "About FAITH",
};

/** In-app reading for Settings: how everything works, responsible gaming, and about. */
export function InfoScreen() {
  const navigation = useNavigation();
  const { topic } = useRoute<RouteProp<ReactNavigation.RootParamList, "Info">>().params;
  const { data: config } = useServerConfig();

  useEffect(() => {
    navigation.setOptions({ title: TITLES[topic] });
  }, [navigation, topic]);

  const sections =
    topic === "help" ? helpSections(config) : topic === "responsible" ? RESPONSIBLE : aboutSections(config);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading.toUpperCase()}</Text>
          {section.body.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}

      {topic !== "responsible" && (
        <View style={styles.links}>
          <LinkRow label="Terms & Conditions" onPress={() => Linking.openURL(links.terms)} />
          <LinkRow label="Privacy Policy" onPress={() => Linking.openURL(links.privacy)} />
        </View>
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
    paddingBottom: spacing.giant,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  links: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
});
