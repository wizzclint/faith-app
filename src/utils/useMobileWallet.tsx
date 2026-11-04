import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Account, useAuthorization } from "./useAuthorization";
import {
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { SignInPayload } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { useAuthStore } from "../store/authStore";

let connectionInFlight: Promise<Account> | null = null;

export function useMobileWallet() {
  const { authorizeSessionWithSignIn, authorizeSession, deauthorizeSession } =
    useAuthorization();

  const connect = useCallback(async (): Promise<Account> => {
    if (connectionInFlight) return connectionInFlight;
    connectionInFlight = transact(async (wallet) => {
      await useAuthStore.getState().load();
      const account = await authorizeSession(wallet);
      const pubkey = account.publicKey.toBase58();
      const auth = useAuthStore.getState();
      if (auth.pubkey !== pubkey) await auth.signOut();
      if (useAuthStore.getState().status !== "authenticated") {
        await useAuthStore.getState().signIn(pubkey, async (message) => {
          const signed = await wallet.signMessages({
            addresses: [account.address],
            payloads: [message],
          });
          return signed[0].slice(-64);
        });
      }
      return account;
    }).then(account => account).finally(() => { connectionInFlight = null; });
    return connectionInFlight;
  }, [authorizeSession]);

  const signIn = useCallback(
    async (signInPayload: SignInPayload): Promise<Account> => {
      return await transact(async (wallet) => {
        return await authorizeSessionWithSignIn(wallet, signInPayload);
      });
    },
    [authorizeSessionWithSignIn]
  );

  const disconnect = useCallback(async (): Promise<void> => {
    await transact(async (wallet) => {
      await deauthorizeSession(wallet);
    });
    await useAuthStore.getState().signOut();
  }, [deauthorizeSession]);

  const signAndSendTransaction = useCallback(
    async (
      transaction: Transaction | VersionedTransaction,
      minContextSlot: number,
    ): Promise<TransactionSignature> => {
      return await transact(async (wallet) => {
        await authorizeSession(wallet);
        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
          minContextSlot,
        });
        return signatures[0];
      });
    },
    [authorizeSession]
  );

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      return await transact(async (wallet) => {
        const authResult = await authorizeSession(wallet);
        const signedMessages = await wallet.signMessages({
          addresses: [authResult.address],
          payloads: [message],
        });
        return signedMessages[0].slice(-64);
      });
    },
    [authorizeSession]
  );

  return useMemo(
    () => ({
      connect,
      signIn,
      disconnect,
      signAndSendTransaction,
      signMessage,
    }),
    [connect, signIn, disconnect, signAndSendTransaction, signMessage]
  );
}
