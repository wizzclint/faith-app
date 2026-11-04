import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "../../utils/ConnectionProvider";

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["get-balance", { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  });
}

/** Asks the cluster's faucet for test SOL. Only meaningful on devnet and testnet. */
export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const client = useQueryClient();

  return useMutation({
    mutationKey: ["airdrop", { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const before = await connection.getBalance(address, "confirmed");
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ]);
      await connection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");
      // When the faucet refuses (over its limit, too many requests) it can still
      // reply with a confirmed transaction that only carries a note. Only a
      // balance that actually went up counts as success.
      const after = await connection.getBalance(address, "confirmed");
      if (after <= before) throw new Error("The faucet didn't send any SOL.");
      return signature;
    },
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["get-balance", { endpoint: connection.rpcEndpoint, address }],
      }),
  });
}
