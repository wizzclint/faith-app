import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { useCluster } from "../../components/cluster/cluster-data-access";
import { useAuthStore } from "../../store/authStore";
import { useAuthorization } from "../../utils/useAuthorization";
import { isWalletCancellation, walletErrorMessage } from "../../utils/walletErrors";
import { api, ApiError } from "../api/client";
import { useEntryPayment } from "../solana/entryPayment";
import { PaymentPurpose, pendingEntries } from "./pendingEntries";
import { Competition, CompetitionDetail, CreateCompetitionInput, ServerConfig } from "./types";

const ROOT = "faith";
const SUBMIT_ATTEMPTS = 4;
const SUBMIT_RETRY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useServerConfig() {
  return useQuery({ queryKey: [ROOT, "config"], queryFn: () => api.config(), staleTime: 60_000 });
}

/** The synced player's account: admin flag and how many tournaments they've opened this month. */
export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [ROOT, "me", token],
    queryFn: () => api.me(),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useIsAdmin(): boolean {
  return useMe().data?.isAdmin ?? false;
}

/** `active` is whether the screen showing them is in front; polling stops when it isn't. */
export function useCompetitions(active = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [ROOT, "competitions", token],
    queryFn: async () => (await api.competitions()).competitions,
    refetchInterval: active ? 10_000 : false,
  });
}

/**
 * The synced player's head-to-heads that are matched and still have runs to
 * play. Their clock is already running, so the app points at them from every
 * main tab rather than only when the player happens to open Compete.
 */
export function useMatchesToPlay(): Competition[] {
  const token = useAuthStore((s) => s.token);
  const { data } = useQuery({
    queryKey: [ROOT, "competitions", token],
    queryFn: async () => (await api.competitions()).competitions,
    enabled: !!token,
    refetchInterval: 15_000,
  });
  return (data ?? []).filter(
    (competition) =>
      competition.kind === "HEAD_TO_HEAD" &&
      (competition.state === "MATCHED" || competition.state === "IN_PROGRESS") &&
      runsLeft(competition) > 0
  );
}

/** A match in play is polled every few seconds so an opponent's finished run shows up promptly. */
function pollIntervalMs(competition: Competition | undefined): number | false {
  if (!competition) return 5_000;
  switch (competition.state) {
    case "COMPLETED":
    case "CANCELLED":
      return false;
    case "UPCOMING":
      return 30_000;
    case "AWAITING_FUNDING":
      return 15_000;
    case "LIVE":
      return 10_000;
    default:
      return 4_000;
  }
}

export function useCompetition(id: string, active = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [ROOT, "competition", id, token],
    queryFn: () => api.competition(id),
    refetchInterval: (query) => (active ? pollIntervalMs(query.state.data?.competition) : false),
  });
}

/** Locked entry fees, pending rewards and the reward list. Only runs when synced. */
export function useRewards() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [ROOT, "rewards", token],
    queryFn: () => api.rewards(),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

/** Every SOL movement between the player's wallet and FAITH. Only runs when synced. */
export function useWalletHistory() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [ROOT, "wallet-history", token],
    queryFn: async () => (await api.walletHistory()).items,
    enabled: !!token,
    refetchInterval: 60_000,
  });
}

/** Refetches every competition/reward query, e.g. after joining or claiming. */
export function useRefreshCompetitive() {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries({ queryKey: [ROOT] }), [client]);
}

// One shared timer for every countdown on screen, running only while something is showing one.
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;
let clockNow = Date.now();

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

/** The current time, updated once a second. */
export function useSecondClock(): number {
  return useSyncExternalStore(subscribeToClock, () => clockNow);
}

/** Whether the caller can take a seat: accept a challenge, enter a tournament, or pay the stake on their own challenge. */
export function isJoinable(competition: Competition): boolean {
  if (competition.me !== null) return false;
  if (competition.kind === "HEAD_TO_HEAD") {
    if (competition.state === "AWAITING_FUNDING") return competition.createdByMe;
    return competition.state === "OPEN" && competition.entrants < 2;
  }
  const open = competition.state === "UPCOMING" || competition.state === "LIVE";
  return open && (competition.maxEntrants === null || competition.entrants < competition.maxEntrants);
}

/** A tournament whose creator still has to pay in its guaranteed prize. */
export function needsPrizeFunding(competition: Competition): boolean {
  return (
    competition.kind === "TOURNAMENT" &&
    competition.state === "AWAITING_FUNDING" &&
    competition.createdByMe
  );
}

/** Runs the caller has not started yet, from the list view's numbers. */
export function runsLeft(competition: Competition): number {
  if (!competition.me) return 0;
  return Math.max(0, competition.me.attemptsAllowed - competition.me.runsCompleted);
}

/** The server gave a definite answer about this payment, so there is nothing left to retry. */
function isFinalAnswer(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 409 || (err.status === 400 && err.code !== "tx_not_found"))
  );
}

function isWorthRetrying(err: unknown): boolean {
  if (!(err instanceof ApiError)) return true; // network failure
  return err.status >= 500 || err.code === "tx_not_found";
}

export type PayStage = "creating" | "checking" | "paying" | "confirming";

export const PAY_STAGE_LABELS: Record<PayStage, string> = {
  creating: "CREATING…",
  checking: "CHECKING…",
  paying: "APPROVE IN YOUR WALLET…",
  confirming: "CONFIRMING…",
};

export function errorText(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (isWalletCancellation(err)) return "Cancelled in your wallet. Nothing was paid.";
  const wallet = walletErrorMessage(err);
  if (wallet) return wallet;
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

/**
 * Everything that moves SOL into a competition: a head-to-head stake, a
 * tournament entry fee, or a tournament's guaranteed prize.
 */
export function useCompetitionPayments() {
  const pay = useEntryPayment();
  const { selectedAccount } = useAuthorization();
  const { selectedCluster } = useCluster();

  /**
   * Registers a seat or a prize with the server. With a `txSignature` this is
   * also how an interrupted payment is finished later: the saved signature is
   * only forgotten once the server has given a definite answer.
   */
  const submit = useCallback(
    async (
      competitionId: string,
      purpose: PaymentPurpose,
      txSignature?: string
    ): Promise<CompetitionDetail> => {
      let lastError: unknown;
      for (let attempt = 0; attempt < SUBMIT_ATTEMPTS; attempt += 1) {
        try {
          const detail =
            purpose === "prize"
              ? await api.fundCompetition(competitionId, txSignature ?? "")
              : await api.joinCompetition(competitionId, txSignature);
          await pendingEntries.clear(competitionId, purpose);
          return detail;
        } catch (err) {
          lastError = err;
          if (isFinalAnswer(err)) {
            await pendingEntries.clear(competitionId, purpose);
            throw err;
          }
          if (!isWorthRetrying(err)) throw err;
          await sleep(SUBMIT_RETRY_MS);
        }
      }
      throw lastError;
    },
    []
  );

  /** Throws a readable reason when a payment from this device couldn't be made or wouldn't be accepted. */
  const assertCanPay = useCallback(
    (config: ServerConfig | undefined) => {
      if (!config?.paidEnabled || !config.treasuryAddress) {
        throw new Error("Paid competitions are unavailable right now.");
      }
      if (selectedCluster.network !== config.cluster) {
        throw new Error(`Switch the app's network to ${config.cluster} in Settings first.`);
      }
      if (
        !selectedAccount ||
        selectedAccount.publicKey.toBase58() !== useAuthStore.getState().pubkey
      ) {
        throw new Error(
          "Your connected wallet isn't the one synced with FAITH. Sync again on the Home screen."
        );
      }
    },
    [selectedAccount, selectedCluster.network]
  );

  /**
   * Pays whatever `purpose` needs for this competition and registers it.
   * Every check that could strand a payment happens before the wallet opens,
   * and a payment that was already sent is finished rather than repeated.
   */
  const payIn = useCallback(
    async (
      competition: Competition,
      purpose: PaymentPurpose,
      config: ServerConfig | undefined,
      onStage: (stage: PayStage) => void
    ): Promise<CompetitionDetail> => {
      const lamports =
        purpose === "prize" ? (competition.fundingDueLamports ?? 0) : competition.entryFeeLamports;
      if (purpose === "entry" && lamports === 0) {
        onStage("confirming");
        return submit(competition.id, purpose);
      }

      onStage("checking");
      assertCanPay(config);
      const alreadySent = await pendingEntries.get(competition.id, purpose);
      if (alreadySent) {
        onStage("confirming");
        return submit(competition.id, purpose, alreadySent);
      }
      const fresh = (await api.competition(competition.id)).competition;
      const stillOpen = purpose === "prize" ? needsPrizeFunding(fresh) : isJoinable(fresh);
      if (!stillOpen) {
        throw new Error(
          competition.kind === "HEAD_TO_HEAD"
            ? "This challenge was just taken or closed."
            : "This tournament just filled up or closed."
        );
      }

      onStage("paying");
      const signature = await pay(config!.treasuryAddress!, lamports);
      await pendingEntries.save(competition.id, signature, purpose);

      onStage("confirming");
      return submit(competition.id, purpose, signature);
    },
    [assertCanPay, pay, submit]
  );

  return { payIn, submit, assertCanPay };
}

/**
 * Creates a competition and, when its creator has to pay in to open it (a
 * staked challenge, or a tournament with a guaranteed prize), goes straight
 * on to that payment. If the payment doesn't happen the draft still exists,
 * so its id comes back with a `notice` and it can be paid from its own page.
 */
export function useCreateCompetition() {
  const { payIn, assertCanPay } = useCompetitionPayments();

  return useCallback(
    async (
      input: CreateCompetitionInput,
      config: ServerConfig | undefined,
      /** Whether creating this will need a payment from the creator's wallet. */
      willPay: boolean,
      onStage: (stage: PayStage) => void
    ): Promise<{ id: string; notice?: string }> => {
      // Checked before the draft is made, so a wallet that can't pay doesn't leave one behind.
      if (willPay) assertCanPay(config);

      onStage("creating");
      const { competition } = await api.createCompetition(input);
      if (!competition.fundingDueLamports) return { id: competition.id };

      try {
        const purpose = competition.kind === "HEAD_TO_HEAD" ? "entry" : "prize";
        await payIn(competition, purpose, config, onStage);
        return { id: competition.id };
      } catch (err) {
        return { id: competition.id, notice: errorText(err) };
      }
    },
    [assertCanPay, payIn]
  );
}
