import { clusterApiUrl } from "@solana/web3.js";

export type SolanaNetwork = "devnet" | "testnet" | "mainnet-beta";

/** Wallet authorization and RPC must use the same build network. */
export function resolveNetwork(cluster = "devnet", rpcUrl?: string) {
  if (cluster !== "devnet" && cluster !== "testnet" && cluster !== "mainnet-beta") {
    throw new Error(`Unsupported Solana network: ${cluster}`);
  }
  if (rpcUrl && !/^https:\/\//i.test(rpcUrl)) {
    throw new Error("The Solana RPC URL must use HTTPS.");
  }
  return { cluster, endpoint: rpcUrl || clusterApiUrl(cluster) };
}

// Expo replaces these public values at build time; never put secrets here.
export const solanaNetwork = resolveNetwork(
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER || "devnet",
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL,
);
