/**
 * Mobile Wallet Adapter failures arrive as raw platform text — on Android,
 * closing the wallet or tapping Cancel surfaces as
 * "java.util.concurrent.CancellationException". These helpers turn them into
 * something a player can read, and let callers treat a cancel as a choice
 * rather than an error.
 */

function describe(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    return `${err.name} ${code ?? ""} ${err.message}`;
  }
  return String(err ?? "");
}

/**
 * The wallet refused to connect to the app. Either the player declined, or
 * the wallet couldn't verify the app and refused without asking them, which
 * is why this is never treated as a silent cancel.
 */
export function isWalletRefusal(err: unknown): boolean {
  return /ERROR_AUTHORIZATION_FAILED|authorization request failed|not authorized/i.test(describe(err));
}

/** The player backed out in their wallet app: closed it, or declined to sign. */
export function isWalletCancellation(err: unknown): boolean {
  if (isWalletRefusal(err)) return false;
  return /CancellationException|cancel|declin|reject|ERROR_SESSION_CLOSED|ERROR_NOT_SIGNED|ERROR_NOT_SUBMITTED/i.test(
    describe(err)
  );
}

export const WALLET_REFUSED =
  "Your wallet didn't connect to FAITH RUN. If it never asked you to approve, update the wallet app and try again, or use another wallet such as Solflare.";

/** A player-facing sentence for a wallet failure, or null when it isn't one. */
export function walletErrorMessage(err: unknown): string | null {
  const text = describe(err);
  if (isWalletRefusal(err)) return WALLET_REFUSED;
  if (isWalletCancellation(err)) return "Cancelled in your wallet.";
  if (/ERROR_WALLET_NOT_FOUND|wallet not found|no installed wallet|ActivityNotFoundException/i.test(text)) {
    return "No Solana wallet app found on this phone. Install one, such as Phantom or Solflare, and try again.";
  }
  if (/ERROR_SESSION_TIMEOUT|timed out|timeout/i.test(text)) {
    return "Your wallet app didn't respond in time. Try again.";
  }
  if (/java\.|Exception/.test(text)) {
    return "Your wallet app couldn't finish that. Try again.";
  }
  return null;
}
