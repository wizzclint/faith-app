import { StackActions, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput } from "react-native";
import { colors } from "../../design/colors";
import { spacing } from "../../design/spacing";
import { durationOptionLabel, formatSol, solToLamports } from "../../services/competition/format";
import {
  errorText,
  PayStage,
  useCreateCompetition,
  useMe,
  useRefreshCompetitive,
  useServerConfig,
} from "../../services/competition/hooks";
import { CreateCompetitionInput } from "../../services/competition/types";
import { Chips, formStyles, Submit } from "./formParts";

const PRIZE_SPLITS = [
  { label: "Winner takes all", bps: [10000] },
  { label: "60 / 30 / 10", bps: [6000, 3000, 1000] },
  { label: "50 / 30 / 20", bps: [5000, 3000, 2000] },
];
const ADMIN_FEES_BPS = [0, 500, 1000];
const PLAYER_CAPS = [5, 10, 20];
const MAX_DAYS = 30;

/**
 * Opening a tournament. Players get a short, bounded form (a few a month, a
 * capped field, set durations, and any prize they promise paid in up front);
 * admins get every field. The server enforces all of it — this only offers
 * what it will accept.
 */
export function TournamentForm() {
  const navigation = useNavigation();
  const refresh = useRefreshCompetitive();
  const create = useCreateCompetition();
  const { data: config } = useServerConfig();
  const { data: me } = useMe();

  const [name, setName] = useState("");
  const [entrySol, setEntrySol] = useState("0");
  const [prizeSol, setPrizeSol] = useState("0");
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [playerCap, setPlayerCap] = useState<number | null>(null);
  const [split, setSplit] = useState(0);
  // Admin-only fields.
  const [hours, setHours] = useState("24");
  const [startsInMin, setStartsInMin] = useState("0");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [minPlayers, setMinPlayers] = useState("2");
  const [feeBps, setFeeBps] = useState(0);

  const [stage, setStage] = useState<PayStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!config || !me) {
    return <ActivityIndicator color={colors.accent} style={styles.loader} />;
  }

  const admin = me.isAdmin;
  const limits = config.tournament;
  const limit = me.tournamentMonthlyLimit;
  const limitReached = limit !== null && me.tournamentsCreatedThisMonth >= limit;
  const durations = limits.userDurationsMin;
  const selectedDuration = durationMin ?? durations[Math.min(2, durations.length - 1)] ?? null;
  const caps = PLAYER_CAPS.filter((cap) => cap <= limits.userMaxPlayers);
  const selectedCap = playerCap ?? limits.userMaxPlayers;
  const prizeLamports = solToLamports(prizeSol);

  const buildInput = (): CreateCompetitionInput | string => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return "Give it a name of at least 3 characters.";

    const entryFeeLamports = solToLamports(entrySol);
    if (entryFeeLamports === null || prizeLamports === null) return "Enter amounts in SOL, like 0.05.";
    if ((entryFeeLamports > 0 || prizeLamports > 0) && !config.paidEnabled) {
      return "Paid tournaments are unavailable right now. Set the entry fee and prize to 0.";
    }
    const base = {
      kind: "TOURNAMENT" as const,
      name: trimmed,
      entryFeeLamports,
      prizeLamports,
      prizeSplitBps: PRIZE_SPLITS[split].bps,
    };

    if (!admin) {
      if (entryFeeLamports > limits.maxEntryFeeLamports) {
        return `The entry fee can be at most ${formatSol(limits.maxEntryFeeLamports)}.`;
      }
      if (prizeLamports > limits.userMaxPrizeLamports) {
        return `The prize can be at most ${formatSol(limits.userMaxPrizeLamports)}.`;
      }
      if (selectedDuration === null) return "Pick how long it runs.";
      return { ...base, durationMin: selectedDuration, maxEntrants: selectedCap };
    }

    const runHours = Number(hours.replace(",", "."));
    if (!Number.isFinite(runHours) || runHours <= 0 || runHours > MAX_DAYS * 24) {
      return `Enter how many hours it runs, up to ${MAX_DAYS} days.`;
    }
    const delay = Number(startsInMin.trim() === "" ? "0" : startsInMin);
    if (!Number.isInteger(delay) || delay < 0) return "Enter the start delay in whole minutes.";
    const max = maxPlayers.trim() === "" ? null : Number(maxPlayers);
    const min = Number(minPlayers.trim() === "" ? "2" : minPlayers);
    if (!Number.isInteger(min) || min < 2) return "Minimum players must be 2 or more.";
    if (max !== null && (!Number.isInteger(max) || max < min)) {
      return "Maximum players can't be below the minimum.";
    }
    return {
      ...base,
      durationMin: Math.max(1, Math.round(runHours * 60)),
      startsInMin: delay,
      maxEntrants: max,
      minEntrants: min,
      feeBps,
    };
  };

  // A player's promised prize is paid in from their own wallet; an admin's comes from the treasury.
  const paysPrize = !admin && (prizeLamports ?? 0) > 0;

  const handleCreate = async () => {
    const input = buildInput();
    if (typeof input === "string") {
      setError(input);
      return;
    }
    setError(null);
    try {
      const { id, notice } = await create(input, config, paysPrize, setStage);
      await refresh();
      navigation.dispatch(StackActions.replace("Competition", { id, notice }));
    } catch (err) {
      setError(errorText(err));
      setStage(null);
    }
  };

  return (
    <>
      <Text style={formStyles.title}>NEW TOURNAMENT</Text>
      <Text style={formStyles.lead}>
        An event with a leaderboard. Every player gets {config.attemptsPerPlayer} runs and the
        highest total wins.
      </Text>
      {limit !== null && (
        <Text style={[formStyles.help, limitReached && styles.limitReached]}>
          {limitReached
            ? `You've created ${limit} tournaments this month.`
            : `You've created ${me.tournamentsCreatedThisMonth} of ${limit} tournaments this month.`}
        </Text>
      )}

      <Text style={formStyles.label}>NAME</Text>
      <TextInput
        style={formStyles.input}
        value={name}
        onChangeText={setName}
        maxLength={40}
        placeholder="Weekend Cup"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={formStyles.label}>ENTRY FEE (SOL, 0 FOR FREE)</Text>
      <TextInput
        style={formStyles.input}
        value={entrySol}
        onChangeText={setEntrySol}
        keyboardType="decimal-pad"
      />
      {!admin && (
        <Text style={formStyles.help}>
          Up to {formatSol(limits.maxEntryFeeLamports)}. Entry fees go into the prize pool
          {limits.userFeeBps > 0 ? ` after a ${limits.userFeeBps / 100}% platform fee` : ""}.
        </Text>
      )}

      <Text style={formStyles.label}>
        {admin ? "SPONSORED PRIZE (SOL, FROM THE FAITH TREASURY)" : "GUARANTEED PRIZE (SOL, 0 FOR NONE)"}
      </Text>
      <TextInput
        style={formStyles.input}
        value={prizeSol}
        onChangeText={setPrizeSol}
        keyboardType="decimal-pad"
      />
      {!admin && (
        <Text style={formStyles.help}>
          You pay this in from your wallet when you create the tournament, and it's added to the
          prize pool. If the tournament is canceled it's refunded to you. Up to{" "}
          {formatSol(limits.userMaxPrizeLamports)}.
        </Text>
      )}

      {admin ? (
        <>
          <Text style={formStyles.label}>STARTS IN (MINUTES, 0 FOR NOW)</Text>
          <TextInput
            style={formStyles.input}
            value={startsInMin}
            onChangeText={setStartsInMin}
            keyboardType="number-pad"
          />
          <Text style={formStyles.label}>RUNS FOR (HOURS)</Text>
          <TextInput
            style={formStyles.input}
            value={hours}
            onChangeText={setHours}
            keyboardType="decimal-pad"
          />
          <Text style={formStyles.label}>MAX PLAYERS (BLANK FOR NO LIMIT)</Text>
          <TextInput
            style={formStyles.input}
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            keyboardType="number-pad"
          />
          <Text style={formStyles.label}>MIN PLAYERS (FEWER MEANS A REFUND)</Text>
          <TextInput
            style={formStyles.input}
            value={minPlayers}
            onChangeText={setMinPlayers}
            keyboardType="number-pad"
          />
        </>
      ) : (
        <>
          <Text style={formStyles.label}>RUNS FOR</Text>
          <Chips
            options={durations.map((minutes) => ({ key: minutes, label: durationOptionLabel(minutes) }))}
            selected={selectedDuration}
            onSelect={setDurationMin}
          />
          <Text style={formStyles.label}>MAX PLAYERS</Text>
          <Chips
            options={caps.map((cap) => ({ key: cap, label: String(cap) }))}
            selected={selectedCap}
            onSelect={setPlayerCap}
          />
        </>
      )}

      <Text style={formStyles.label}>PRIZE SPLIT</Text>
      <Chips
        options={PRIZE_SPLITS.map((option, index) => ({ key: index, label: option.label }))}
        selected={split}
        onSelect={setSplit}
      />

      {admin && (
        <>
          <Text style={formStyles.label}>PLATFORM FEE</Text>
          <Chips
            options={ADMIN_FEES_BPS.map((bps) => ({ key: bps, label: `${bps / 100}%` }))}
            selected={feeBps}
            onSelect={setFeeBps}
          />
        </>
      )}

      <Submit
        label={paysPrize ? `CREATE · PAY IN ${formatSol(prizeLamports ?? 0)}` : "CREATE TOURNAMENT"}
        onPress={handleCreate}
        stage={stage}
        disabled={limitReached}
        error={error}
      />
      <Text style={formStyles.footnote}>
        Fees and prizes use {config.cluster} test SOL, which has no real-world value.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.massive,
  },
  limitReached: {
    color: colors.warning,
    fontWeight: "700",
  },
});
