// Fail at build configuration time if a mainnet APK would point at devnet.
module.exports = ({ config }) => {
  const cluster = process.env.EXPO_PUBLIC_SOLANA_CLUSTER || "devnet";
  const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/+$/, "");
  if (cluster === "mainnet-beta") {
    if (!/^https:\/\/[^/\s]+/i.test(apiUrl) || apiUrl === "https://faith-server-eta.vercel.app") {
      throw new Error("Set EXPO_PUBLIC_API_URL to the separate HTTPS mainnet backend before building for real SOL.");
    }
  }
  return config;
};
