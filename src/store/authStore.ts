import AsyncStorage from "@react-native-async-storage/async-storage";
import bs58 from "bs58";
import { create } from "zustand";
import { setAuthToken } from "../services/api/authToken";
import { api, ApiError } from "../services/api/client";

const AUTH_STORAGE_KEY = "faith-run:backend-auth";

type AuthStatus = "idle" | "signing" | "authenticated" | "error";

interface AuthState {
  token: string | null;
  userId: string | null;
  pubkey: string | null;
  status: AuthStatus;
  error: string | null;

  load: () => Promise<void>;
  /** Runs the full challenge → wallet-sign → verify handshake against faith-server. */
  signIn: (pubkeyBase58: string, signMessage: (bytes: Uint8Array) => Promise<Uint8Array>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  pubkey: null,
  status: "idle",
  error: null,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setAuthToken(parsed.token ?? null);
      set({
        token: parsed.token ?? null,
        userId: parsed.userId ?? null,
        pubkey: parsed.pubkey ?? null,
        status: parsed.token ? "authenticated" : "idle",
      });
    } catch {
      // Non-fatal — just starts signed out.
    }
  },

  signIn: async (pubkeyBase58, signMessage) => {
    set({ status: "signing", error: null });
    try {
      const { message, nonce } = await api.challenge(pubkeyBase58);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signatureB58 = bs58.encode(signatureBytes);

      const { token, user } = await api.verify(pubkeyBase58, nonce, signatureB58);

      setAuthToken(token);
      set({ token, userId: user.id, pubkey: user.pubkey, status: "authenticated", error: null });
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ token, userId: user.id, pubkey: user.pubkey })
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign-in failed — is the backend reachable?";
      set({ status: "error", error: message });
    }
  },

  signOut: async () => {
    setAuthToken(null);
    set({ token: null, userId: null, pubkey: null, status: "idle", error: null });
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
  },
}));
