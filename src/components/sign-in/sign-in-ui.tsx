import { useCallback, useState } from "react";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { alertAndLog } from "../../utils/alertAndLog";
import { isWalletCancellation, walletErrorMessage } from "../../utils/walletErrors";
import { FaithButton } from "../ui/FaithButton";

/** Asks the player's wallet app to connect. Backing out of it is silent; anything else is explained. */
export function useConnectWallet() {
  const { connect } = useMobileWallet();
  const [connecting, setConnecting] = useState(false);

  const run = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      await connect();
    } catch (err) {
      if (!isWalletCancellation(err)) {
        alertAndLog(
          "Couldn't connect",
          walletErrorMessage(err) ?? "Your wallet app couldn't connect. Try again."
        );
      }
    } finally {
      setConnecting(false);
    }
  }, [connect, connecting]);

  return { connect: run, connecting };
}

export function ConnectButton() {
  const { connect, connecting } = useConnectWallet();
  return (
    <FaithButton
      label={connecting ? "OPENING YOUR WALLET…" : "CONNECT WALLET"}
      onPress={connect}
      disabled={connecting}
    />
  );
}
