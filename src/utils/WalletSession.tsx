import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuthorization } from "./useAuthorization";

/** Restore once, and never keep a game identity belonging to a different wallet. */
export function WalletSession() {
  const { selectedAccount, isLoading } = useAuthorization();
  const address = selectedAccount?.publicKey.toBase58() ?? null;
  useEffect(() => {
    if (isLoading) return;
    let active = true;
    void useAuthStore.getState().load().then(() => {
      const auth = useAuthStore.getState();
      if (active && auth.pubkey && auth.pubkey !== address) void auth.signOut();
    });
    return () => { active = false; };
  }, [address, isLoading]);
  return null;
}
