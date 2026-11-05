/** Default backend for existing devnet builds. Mainnet uses its own deployment. */
const DEVNET_API_URL = "https://faith-server-eta.vercel.app";

export function resolveApiBaseUrl(value?: string, cluster = "devnet"): string {
  const url = (value || DEVNET_API_URL).replace(/\/+$/, "");
  if (cluster === "mainnet-beta") {
    if (!value || url === DEVNET_API_URL) {
      throw new Error("A separate mainnet API URL is required for real-SOL testing.");
    }
    if (!/^https:\/\/[^/\s]+/i.test(url)) {
      throw new Error("The mainnet API URL must use HTTPS.");
    }
  }
  return url;
}

export const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
  process.env.EXPO_PUBLIC_SOLANA_CLUSTER || "devnet",
);
