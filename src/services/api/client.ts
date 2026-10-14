import {
  CompetitionDetail,
  Competition,
  CompetitionRunResult,
  CompetitionRunSession,
  CreateCompetitionInput,
  Me,
  Reward,
  RewardSummary,
  ServerConfig,
  WalletHistoryItem,
} from "../competition/types";
import { getAuthToken, notifyUnauthorized } from "./authToken";
import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  /** Machine-readable reason from the server, e.g. "wrong_sender" for a rejected payment. */
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Sends the session token when there is one. */
  auth?: boolean;
}

async function request<T>(path: string, { method = "GET", body, auth = false }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = auth ? getAuthToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const parsed = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A token the server no longer accepts: drop it so the UI asks to sync again.
    if (response.status === 401 && token) notifyUnauthorized();
    throw new ApiError(
      response.status,
      parsed?.error ?? `Request failed (${response.status})`,
      parsed?.code
    );
  }
  return parsed as T;
}

export interface LeaderboardEntry {
  rank: number;
  pubkey: string;
  score: number;
  coins: number;
  submittedAt: string;
}

interface SessionInfo {
  sessionId: string;
  startedAt: string;
  expiresAt: string;
}

/**
 * Thin client for faith-server. Every call can fail — callers treat free-run
 * calls as best-effort and never let them block gameplay (spec section 30).
 */
export const api = {
  challenge: (pubkey: string) =>
    request<{ message: string; nonce: string }>("/auth/challenge", {
      method: "POST",
      body: { pubkey },
    }),

  verify: (pubkey: string, nonce: string, signature: string) =>
    request<{ token: string; user: { id: string; pubkey: string } }>("/auth/verify", {
      method: "POST",
      body: { pubkey, nonce, signature },
    }),

  createSession: () => request<SessionInfo>("/sessions", { method: "POST", auth: true }),

  submitRun: (sessionId: string, data: { score: number; coins: number; elapsedSec: number }) =>
    request<{
      accepted: boolean;
      reason?: string;
      runResultId: string;
      isNewBest: boolean;
      /** Present when the session was issued for a competition. */
      competition?: CompetitionRunResult;
    }>(`/sessions/${sessionId}/submit`, { method: "POST", body: data, auth: true }),

  leaderboard: (limit = 50) =>
    request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`),

  myRank: () => request<{ bestScore: number; rank: number | null }>("/leaderboard/me", { auth: true }),

  config: () => request<ServerConfig>("/config"),

  me: () => request<Me>("/me", { auth: true }),

  competitions: () => request<{ competitions: Competition[] }>("/competitions", { auth: true }),

  competition: (id: string) => request<CompetitionDetail>(`/competitions/${id}`, { auth: true }),

  createCompetition: (input: CreateCompetitionInput) =>
    request<CompetitionDetail>("/competitions", { method: "POST", body: input, auth: true }),

  /**
   * Enter a tournament, accept a challenge, or pay the stake on your own
   * challenge. `txSignature` is the payment; omit it when there's nothing to pay.
   */
  joinCompetition: (id: string, txSignature?: string) =>
    request<CompetitionDetail>(`/competitions/${id}/join`, {
      method: "POST",
      body: { txSignature },
      auth: true,
    }),

  /** The creator pays in their tournament's guaranteed prize, which opens it. */
  fundCompetition: (id: string, txSignature: string) =>
    request<CompetitionDetail>(`/competitions/${id}/fund`, {
      method: "POST",
      body: { txSignature },
      auth: true,
    }),

  /** Starts the caller's next run. This spends one of their attempts. */
  createCompetitionSession: (id: string) =>
    request<CompetitionRunSession>(`/competitions/${id}/session`, { method: "POST", auth: true }),

  endCompetition: (id: string) =>
    request<CompetitionDetail>(`/competitions/${id}/end`, { method: "POST", auth: true }),

  cancelCompetition: (id: string) =>
    request<CompetitionDetail>(`/competitions/${id}/cancel`, { method: "POST", auth: true }),

  rewards: () => request<RewardSummary>("/rewards", { auth: true }),

  walletHistory: () => request<{ items: WalletHistoryItem[] }>("/rewards/history", { auth: true }),

  claimReward: (id: string) =>
    request<{ reward: Reward }>(`/rewards/${id}/claim`, { method: "POST", auth: true }),
};
