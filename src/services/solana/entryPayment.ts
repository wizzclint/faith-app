import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback } from "react";
import { useConnection } from "../../utils/ConnectionProvider";
import { useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";

/** Left in the wallet after paying, to cover the network fee. */
const NETWORK_FEE_HEADROOM_LAMPORTS = 10_000;

export class EntryPaymentError extends Error {}

/**
 * Sends an entry fee from the connected wallet to the FAITH treasury and
 * returns the transaction signature. The wallet app does the signing — this
 * code never sees a private key (spec section 17).
 */
export function useEntryPayment() {
  const { connection } = useConnection();
  const { selectedAccount } = useAuthorization();
  const { signAndSendTransaction } = useMobileWallet();

  return useCallback(
    async (treasuryAddress: string, lamports: number): Promise<string> => {
      if (!selectedAccount) throw new EntryPaymentError("Connect your wallet first.");
      const payer = selectedAccount.publicKey;

      const balance = await connection.getBalance(payer);
      if (balance < lamports + NETWORK_FEE_HEADROOM_LAMPORTS) {
        throw new EntryPaymentError(
          "You don't have enough SOL in your wallet for this. Use DEPOSIT in the Wallet section on Home to add some."
        );
      }

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext();

      const message = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [
          SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: new PublicKey(treasuryAddress),
            lamports,
          }),
        ],
      }).compileToLegacyMessage();

      const signature = await signAndSendTransaction(
        new VersionedTransaction(message),
        minContextSlot
      );

      // Best effort: the server re-checks the chain itself, so a slow
      // confirmation here must not lose a signature the wallet already sent.
      await connection
        .confirmTransaction({ signature, ...latestBlockhash }, "confirmed")
        .catch(() => {});
      return signature;
    },
    [connection, selectedAccount, signAndSendTransaction]
  );
}
