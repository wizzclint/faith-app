/**
 * Client-side switches (spec section 28). The server has its own, stricter
 * gates — in particular it refuses paid competitions on mainnet until a
 * compliance flag is set there — so turning something on here can never
 * enable real-money play by itself.
 */
export const featureFlags = {
  ENABLE_COMPETITIVE_MODE: true,
} as const;
