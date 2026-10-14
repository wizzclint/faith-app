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

/** The player backed out in their wallet app: closed it, or declined the request. */
export function isWalletCancellation(err: unknown): boolean {
  return /CancellationException|cancel|declin|reject|ERROR_SESSION_CLOSED|ERROR_AUTHORIZATION_FAILED|ERROR_NOT_SIGNED|ERROR_NOT_SUBMITTED/i.test(
    describe(err)
  );
}

/** A player-facing sentence for a wallet failure, or null when it isn't one. */
export function walletErrorMessage(err: unknown): string | null {
  const text = describe(err);
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
