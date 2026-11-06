import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey, PublicKeyInitData } from "@solana/web3.js";
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  SignInPayloadWithRequiredFields,
  SignInPayload,
} from "@solana-mobile/mobile-wallet-adapter-protocol";
import { toUint8Array } from "js-base64";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useCluster } from "../components/cluster/cluster-data-access";
import { LEGAL_SITE } from "../config/links";

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

type WalletAuthorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

function getAccountFromAuthorizedAccount(account: AuthorizedAccount): Account {
  return {
    ...account,
    publicKey: getPublicKeyFromAddress(account.address),
  };
}

function getAuthorizationFromAuthorizationResult(
  authorizationResult: AuthorizationResult,
  previouslySelectedAccount?: Account
): WalletAuthorization {
  let selectedAccount: Account;
  if (
    // We have yet to select an account.
    previouslySelectedAccount == null ||
    // The previously selected account is no longer in the set of authorized addresses.
    !authorizationResult.accounts.some(
      ({ address }) => address === previouslySelectedAccount.address
    )
  ) {
    const firstAccount = authorizationResult.accounts[0];
    selectedAccount = getAccountFromAuthorizedAccount(firstAccount);
  } else {
    selectedAccount = previouslySelectedAccount;
  }
  return {
    accounts: authorizationResult.accounts.map(getAccountFromAuthorizedAccount),
    authToken: authorizationResult.auth_token,
    selectedAccount,
  };
}

function getPublicKeyFromAddress(address: Base64EncodedAddress): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}

function cacheReviver(key: string, value: any) {
  if (key === "publicKey") {
    return new PublicKey(value as PublicKeyInitData); // the PublicKeyInitData should match the actual data structure stored in AsyncStorage
  } else {
    return value;
  }
}

const AUTHORIZATION_STORAGE_KEY = "authorization-cache";
let authorizationRevision = 0;
let storageWrite: Promise<void> = Promise.resolve();

function cancelledConnection() {
  return new Error("Wallet connection cancelled by disconnect");
}

function saveAuthorization(auth: WalletAuthorization | null) {
  // A late connect write must finish before disconnect removes the cache.
  storageWrite = storageWrite.catch(() => {}).then(() => auth
    ? AsyncStorage.setItem(AUTHORIZATION_STORAGE_KEY, JSON.stringify(auth))
    : AsyncStorage.removeItem(AUTHORIZATION_STORAGE_KEY));
  return storageWrite;
}

async function fetchAuthorization(): Promise<WalletAuthorization | null> {
  const revision = authorizationRevision;
  await storageWrite.catch(() => {});
  const cacheFetchResult = await AsyncStorage.getItem(
    AUTHORIZATION_STORAGE_KEY
  );

  if (!cacheFetchResult || revision !== authorizationRevision) {
    return null;
  }

  // Return prior authorization, if found.
  return JSON.parse(cacheFetchResult, cacheReviver);
}

/**
 * Who the app says it is when a wallet is asked to connect. Wallets such as
 * Phantom refuse an app they can't verify, by checking that `uri` publishes
 * this app's package and signing certificate in /.well-known/assetlinks.json
 * (see legal-site). A new signing key needs that file updated. The icon is
 * resolved against `uri`.
 */
export const APP_IDENTITY = {
  name: "FAITH RUN",
  uri: LEGAL_SITE,
  icon: "icon.png",
};

export function useAuthorization() {
  const queryClient = useQueryClient();
  const { selectedCluster } = useCluster();
  const { data: authorization, isLoading } = useQuery({
    queryKey: ["wallet-authorization"],
    queryFn: () => fetchAuthorization(),
  });

  const handleAuthorizationResult = useCallback(
    async (
      authorizationResult: AuthorizationResult,
      revision: number,
    ): Promise<WalletAuthorization> => {
      if (revision !== authorizationRevision) throw cancelledConnection();
      const nextAuthorization = getAuthorizationFromAuthorizationResult(
        authorizationResult,
        authorization?.selectedAccount
      );
      queryClient.setQueryData(["wallet-authorization"], nextAuthorization);
      await saveAuthorization(nextAuthorization);
      if (revision !== authorizationRevision) throw cancelledConnection();
      return nextAuthorization;
    },
    [authorization, queryClient]
  );
  /**
   * Authorizes with the saved token when there is one, so the wallet can skip
   * its prompt. A wallet can refuse a saved token (it expired, or it came from
   * a different wallet app), so a refusal is retried once without it, which
   * asks the player to approve again.
   */
  const authorizeWithFallback = useCallback(
    async (wallet: AuthorizeAPI, signInPayload?: SignInPayload) => {
      const revision = authorizationRevision;
      const chain: `solana:${string}` = selectedCluster.network === "mainnet-beta" ? "solana:mainnet" : `solana:${selectedCluster.network}`;
      const request = {
        identity: APP_IDENTITY,
        chain,
        ...(signInPayload ? { sign_in_payload: signInPayload } : {}),
      } as const;
      const savedToken = authorization?.authToken;
      if (!savedToken) return wallet.authorize(request);
      try {
        return await wallet.authorize({ ...request, auth_token: savedToken });
      } catch {
        if (revision !== authorizationRevision) throw cancelledConnection();
        return wallet.authorize(request);
      }
    },
    [authorization, selectedCluster.network]
  );
  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI) => {
      const revision = authorizationRevision;
      const authorizationResult = await authorizeWithFallback(wallet);
      return (await handleAuthorizationResult(authorizationResult, revision))
        .selectedAccount;
    },
    [authorizeWithFallback, handleAuthorizationResult]
  );
  const authorizeSessionWithSignIn = useCallback(
    async (wallet: AuthorizeAPI, signInPayload: SignInPayload) => {
      const revision = authorizationRevision;
      const authorizationResult = await authorizeWithFallback(wallet, signInPayload);
      return (await handleAuthorizationResult(authorizationResult, revision))
        .selectedAccount;
    },
    [authorizeWithFallback, handleAuthorizationResult]
  );
  const clearAuthorization = useCallback(async () => {
    authorizationRevision += 1;
    const clearing = saveAuthorization(null);
    await queryClient.cancelQueries({ queryKey: ["wallet-authorization"] });
    queryClient.setQueryData(["wallet-authorization"], null);
    await clearing;
  }, [queryClient]);
  return useMemo(
    () => ({
      accounts: authorization?.accounts ?? null,
      authorizeSession,
      authorizeSessionWithSignIn,
      clearAuthorization,
      selectedAccount: authorization?.selectedAccount ?? null,
      isLoading,
    }),
    [authorization, authorizeSession, authorizeSessionWithSignIn, clearAuthorization, isLoading]
  );
}
