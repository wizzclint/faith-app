import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../design/colors";
import { radius } from "../../design/radius";
import { spacing } from "../../design/spacing";
import { api, ApiError } from "../../services/api/client";
import { formatSol } from "../../services/competition/format";
import {
  useRefreshCompetitive,
  useRewards,
  useServerConfig,
} from "../../services/competition/hooks";
import { useAuthStore } from "../../store/authStore";
import { FaithButton } from "../ui/FaithButton";
import { useGetBalance, useRequestAirdrop } from "./account-data-access";

const FAUCET_URL = "https://faucet.solana.com";

function formatWalletSol(lamports: number): string {
  return `◎ ${Math.round((lamports / LAMPORTS_PER_SOL) * 100000) / 100000}`;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

function ActionButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && styles.pressed, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <MaterialCommunityIcon name={icon} size={20} color={colors.accent} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

/**
 * The money picture, in the spec's terms (section 6):
 *  - available balance: SOL in the connected wallet, read from the chain
 *  - game balance: stakes and entry fees in matches that haven't finished
 *  - pending rewards: prizes and refunds waiting to be withdrawn
 * Server figures only appear once synced — a dash until then, never a made-up zero.
 */
export function WalletSummary({ address }: { address: PublicKey }) {
  const balance = useGetBalance({ address });
  const synced = useAuthStore((s) => s.status === "authenticated");
  const { data: rewards } = useRewards();
  const { data: config } = useServerConfig();
  const refresh = useRefreshCompetitive();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" } | null>(null);

  const cluster = config?.cluster ?? "devnet";
  const amount = (lamports: number | undefined) =>
    lamports === undefined ? "—" : formatSol(lamports);
  const claimable = (rewards?.rewards ?? []).filter((reward) => reward.status !== "PAID");

  /** Sends every pending prize and refund to the wallet, one payout each. */
  const withdrawAll = async () => {
    setWithdrawing(true);
    setMessage(null);
    let sent = 0;
    let stillSending = 0;
    let problem: string | null = null;
    for (const reward of claimable) {
      try {
        const { reward: result } = await api.claimReward(reward.id);
        if (result.status === "PAID") sent += result.lamports - result.networkFeeLamports;
        else stillSending += 1;
      } catch (err) {
        problem =
          err instanceof ApiError ? err.message : "Couldn't reach the FAITH servers. Try again.";
      }
    }
    if (problem) setMessage({ text: problem, tone: "error" });
    else if (stillSending > 0) {
      setMessage({ text: "Your payout is on its way. It can take a minute to show in your wallet.", tone: "info" });
    } else if (sent > 0) {
      setMessage({ text: `Sent ${formatSol(sent)} to your wallet.`, tone: "info" });
    }
    await refresh();
    balance.refetch();
    setWithdrawing(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>AVAILABLE BALANCE · {cluster.toUpperCase()}</Text>
      <Text style={styles.balance}>
        {balance.data !== undefined ? formatWalletSol(balance.data) : balance.isError ? "—" : "…"}
      </Text>

      <View style={styles.subRow}>
        <View style={styles.sub}>
          <Text style={styles.subLabel}>GAME BALANCE</Text>
          <Text style={styles.subValue}>{amount(rewards?.lockedLamports)}</Text>
        </View>
        <View style={styles.sub}>
          <Text style={styles.subLabel}>PENDING REWARDS</Text>
          <Text style={[styles.subValue, (rewards?.pendingLamports ?? 0) > 0 && styles.subValueHot]}>
            {amount(rewards?.pendingLamports)}
          </Text>
        </View>
        <View style={styles.sub}>
          <Text style={styles.subLabel}>TOTAL WON</Text>
          <Text style={styles.subValue}>{amount(rewards?.earnedLamports)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <ActionButton icon="tray-arrow-down" label="DEPOSIT" onPress={() => setDepositOpen(true)} />
        <ActionButton
          icon="tray-arrow-up"
          label={withdrawing ? "SENDING…" : "WITHDRAW"}
          onPress={withdrawAll}
          disabled={withdrawing || claimable.length === 0}
        />
      </View>

      {message && (
        <Text style={[styles.message, message.tone === "error" && styles.messageError]}>
          {message.text}
        </Text>
      )}

      <Text style={styles.footnote}>
        {!synced
          ? "Tap SYNC WITH FAITH above to see your game balance and rewards."
          : claimable.length > 0
            ? "WITHDRAW sends your pending prizes and refunds to this wallet. Solana's small network fee comes out of each payout."
            : "Stakes and entry fees are paid straight from this wallet. Prizes and refunds wait under Pending Rewards until you withdraw them."}
        {cluster !== "mainnet-beta" ? ` ${cluster} SOL is test money with no real-world value.` : ""}
      </Text>

      <DepositModal
        visible={depositOpen}
        onClose={() => setDepositOpen(false)}
        address={address}
        cluster={cluster}
      />
    </View>
  );
}

/**
 * There is no separate game account to deposit into: stakes and entry fees
 * are paid from the connected wallet when you enter. So depositing means
 * getting SOL into that wallet, which on devnet is free test SOL.
 */
function DepositModal({
  visible,
  onClose,
  address,
  cluster,
}: {
  visible: boolean;
  onClose: () => void;
  address: PublicKey;
  cluster: string;
}) {
  const airdrop = useRequestAirdrop({ address });
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "info" | "error" } | null>(null);
  const testNetwork = cluster === "devnet" || cluster === "testnet";
  const base58 = address.toBase58();

  const copy = async () => {
    await Clipboard.setStringAsync(base58);
    setCopied(true);
  };

  const requestTestSol = async () => {
    setNote(null);
    try {
      await airdrop.mutateAsync(1);
      setNote({ text: "1 test SOL is in your wallet.", tone: "info" });
    } catch {
      setNote({
        text: "The devnet faucet is busy right now (it limits how often it pays out). Try again later, or copy your address into faucet.solana.com.",
        tone: "error",
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>DEPOSIT</Text>
          <Text style={styles.sheetBody}>
            FAITH plays from the wallet you connected — stakes and entry fees are paid from it when
            you join. To add SOL, send it to this address:
          </Text>
          <Pressable style={styles.addressBox} onPress={copy}>
            <Text style={styles.address} selectable>
              {base58}
            </Text>
            <Text style={styles.copy}>{copied ? "✓ COPIED" : "TAP TO COPY"}</Text>
          </Pressable>

          {testNetwork && (
            <>
              <Text style={styles.sheetBody}>
                On {cluster}, SOL is free test money. Get some straight away:
              </Text>
              <FaithButton
                label={airdrop.isPending ? "ASKING THE FAUCET…" : "GET 1 TEST SOL"}
                onPress={requestTestSol}
                disabled={airdrop.isPending}
              />
              <FaithButton
                label="OPEN FAUCET.SOLANA.COM"
                variant="secondary"
                onPress={() => Linking.openURL(FAUCET_URL)}
              />
            </>
          )}
          {note && (
            <Text style={[styles.message, note.tone === "error" && styles.messageError]}>
              {note.text}
            </Text>
          )}
          <FaithButton label="CLOSE" variant="tertiary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.largeCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  balance: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "800",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  subRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: spacing.lg,
  },
  sub: {
    flex: 1,
    alignItems: "center",
  },
  subLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subValue: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  subValueHot: {
    color: colors.accent,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.accentDeep,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  actionLabel: {
    color: colors.accentBright,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
  message: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: spacing.md,
  },
  messageError: {
    color: colors.danger,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: spacing.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3,8,11,0.8)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.modal,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  sheetBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  addressBox: {
    backgroundColor: colors.background,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  address: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  copy: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
