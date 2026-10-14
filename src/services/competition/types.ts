/** Shapes returned by faith-server's competition and reward endpoints. Amounts are lamports. */

export type CompetitionKind = "TOURNAMENT" | "HEAD_TO_HEAD";

/**
 * Head-to-heads move OPEN -> MATCHED -> IN_PROGRESS; tournaments UPCOMING -> LIVE.
 * Both end SETTLING -> COMPLETED, or CANCELLED (which always means refunded).
 * AWAITING_FUNDING is a draft only its creator can see, until they pay in.
 */
export type CompetitionState =
  | "AWAITING_FUNDING"
  | "OPEN"
  | "MATCHED"
  | "IN_PROGRESS"
  | "UPCOMING"
  | "LIVE"
  | "SETTLING"
  | "COMPLETED"
  | "CANCELLED";

export interface Competition {
  id: string;
  kind: CompetitionKind;
  name: string;
  state: CompetitionState;
  cancelReason: string | null;
  creatorPubkey: string;
  createdByMe: boolean;
  /** Head-to-head: the wallets in the match, creator first. Empty for tournaments. */
  playerPubkeys: string[];
  /** Head-to-head: the creator agreed the house may accept if no player does. */
  houseAllowed: boolean;
  /** Head-to-head the creator chose to play against the house directly; never open to other players. */
  vsHouse: boolean;
  /** Set when one of the players is the house — FAITH's own automated opponent. */
  housePubkey: string | null;
  /** Who won, once it has completed. Null for a draw, a cancellation, or while it's still running. */
  winnerPubkey: string | null;
  /** A head-to-head stake or a tournament entry fee. */
  entryFeeLamports: number;
  /** Head-to-head: what the winner takes. Tournament: what ranked players share at the current entrant count. */
  prizePoolLamports: number;
  feeBps: number;
  prizeSplitBps: number[];
  entrants: number;
  minEntrants: number;
  maxEntrants: number | null;
  attemptsPerPlayer: number;
  startsAt: string;
  endsAt: string;
  matchedAt: string | null;
  /** What the caller, as creator, still has to pay in before this opens. */
  fundingDueLamports: number | null;
  /** Null when signed out or not entered. */
  me: { totalScore: number; runsCompleted: number; attemptsAllowed: number; rank: number | null } | null;
}

export type RunStatus = "ACTIVE" | "DONE" | "VOID";

export interface CompetitionRun {
  attempt: number;
  status: RunStatus;
  /** Null while the run is still being played — the server doesn't reveal a score until it's final. */
  score: number | null;
}

export interface CompetitionPlayer {
  /** Tournament position; null for head-to-head players and for anyone yet to score. */
  rank: number | null;
  pubkey: string;
  isMe: boolean;
  /** True for FAITH's own automated opponent. */
  isHouse: boolean;
  totalScore: number;
  runsCompleted: number;
  runs: CompetitionRun[];
}

/** How strong the house was set for one match. */
export interface HouseMatchInfo {
  /** 1 (weakest) to 10. */
  level: number;
  typicalRunScore: number;
  targetWinRatePct: number;
}

export interface Settlement {
  /** Null when it ended in a draw or was canceled. */
  winnerPubkey: string | null;
  feeLamports: number;
  payouts: Array<{ pubkey: string; kind: "PRIZE" | "REFUND"; rank: number | null; lamports: number }>;
}

export interface CompetitionDetail {
  competition: Competition;
  /** Runs every player may play right now: the fixed number plus any sudden-death rounds. */
  attemptsAllowed: number;
  players: CompetitionPlayer[];
  house: HouseMatchInfo | null;
  settlement: Settlement | null;
}

/** Issued when a competition run starts. Starting it has already used the attempt. */
export interface CompetitionRunSession {
  competitionId: string;
  sessionId: string;
  attempt: number;
  expiresAt: string;
  attemptsAllowed: number;
}

/** How the server recorded a submitted competition run. */
export interface CompetitionRunResult {
  id: string;
  counted: boolean;
  attempt: number;
  score: number;
  totalScore: number;
  runsCompleted: number;
}

export interface Reward {
  id: string;
  competitionId: string;
  competitionName: string;
  kind: "PRIZE" | "REFUND";
  rank: number | null;
  lamports: number;
  /** Solana's transaction fee, taken out of the payout: the wallet receives lamports minus this. */
  networkFeeLamports: number;
  status: "PENDING" | "SENDING" | "PAID";
  payoutSignature: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface RewardSummary {
  /** Entry fees held in competitions that haven't settled yet. */
  lockedLamports: number;
  /** Prizes and refunds waiting to be claimed. */
  pendingLamports: number;
  /** Prizes already paid out. */
  earnedLamports: number;
  rewards: Reward[];
}

/** One SOL movement between the player's wallet and FAITH, with the Solana transaction that carried it. */
export interface WalletHistoryItem {
  id: string;
  /** Stake or entry fee paid in; guaranteed prize paid in; prize or refund paid out. */
  type: "ENTRY" | "PRIZE_FUNDED" | "PRIZE_PAID" | "REFUND_PAID";
  direction: "IN" | "OUT";
  /** What left or reached the wallet. Payouts are net of Solana's network fee. */
  lamports: number;
  signature: string | null;
  competitionId: string;
  competitionName: string | null;
  competitionKind: CompetitionKind | null;
  at: string;
}

export interface ServerConfig {
  cluster: string;
  treasuryAddress: string | null;
  competitiveEnabled: boolean;
  paidEnabled: boolean;
  attemptsPerPlayer: number;
  h2h: {
    feeBps: number;
    minStakeLamports: number;
    maxStakeLamports: number;
    stakeQuickPicksLamports: number[];
    /** How long an open challenge waits for an opponent before it is refunded. */
    matchmakingWindowMin: number;
    /** How long matched players have to finish their runs. */
    matchDurationMin: number;
    maxOpenPerPlayer: number;
    maxSuddenDeathRounds: number;
  };
  /** The house's published strength and its real record so far. */
  house: { enabled: boolean; targetWinRatePct: number; played: number; won: number };
  tournament: {
    userFeeBps: number;
    userMaxPerMonth: number;
    userMaxPlayers: number;
    userDurationsMin: number[];
    maxEntryFeeLamports: number;
    userMaxPrizeLamports: number;
  };
}

export interface Me {
  id: string;
  pubkey: string;
  isAdmin: boolean;
  tournamentsCreatedThisMonth: number;
  /** Null for admins, who have no monthly limit. */
  tournamentMonthlyLimit: number | null;
}

export interface CreateCompetitionInput {
  kind: CompetitionKind;
  name: string;
  /** Head-to-head stake, or tournament entry fee. */
  entryFeeLamports: number;
  /** Head-to-head only. */
  allowHouse?: boolean;
  /** Head-to-head only: play the house right away instead of waiting for a player. */
  vsHouse?: boolean;
  /** Tournament only from here down. */
  durationMin?: number;
  /** Guaranteed prize: paid in by a player-creator, or taken from the treasury for an admin. */
  prizeLamports?: number;
  prizeSplitBps?: number[];
  maxEntrants?: number | null;
  /** Admin only. */
  startsInMin?: number;
  feeBps?: number;
  minEntrants?: number;
}
