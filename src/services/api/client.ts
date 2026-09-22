import { getAuthToken } from "./authToken";
import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, { method = "GET", body, auth = false }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const parsed = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, parsed?.error ?? `Request failed (${response.status})`);
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

/**
 * Thin client for faith-server. Every call can fail (no backend reachable
 * yet, no live database behind it) — callers should treat this as
 * best-effort and never let it block gameplay (spec section 30).
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

  createSession: () =>
    request<{ sessionId: string; startedAt: string; expiresAt: string }>("/sessions", {
      method: "POST",
      auth: true,
    }),

  submitRun: (sessionId: string, data: { score: number; coins: number; elapsedSec: number }) =>
    request<{ accepted: boolean; reason?: string; runResultId: string; isNewBest: boolean }>(
      `/sessions/${sessionId}/submit`,
      { method: "POST", body: data, auth: true }
    ),

  leaderboard: (limit = 50) =>
    request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`),

  myRank: () => request<{ bestScore: number; rank: number | null }>("/leaderboard/me", { auth: true }),
};
