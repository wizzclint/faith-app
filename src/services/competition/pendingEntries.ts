import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "faith-run:pending-entry-payments";

/** What a payment was for: a stake or entry fee, or a tournament's guaranteed prize. */
export type PaymentPurpose = "entry" | "prize";

type PendingMap = Record<string, string>;

// Entry payments keep the bare competition id as their key, as older builds stored them.
const keyFor = (competitionId: string, purpose: PaymentPurpose) =>
  purpose === "entry" ? competitionId : `${purpose}:${competitionId}`;

async function readAll(): Promise<PendingMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingMap) : {};
  } catch {
    return {};
  }
}

/**
 * Payments that have been sent from the wallet but not yet confirmed by the
 * server. Saved *before* the server call, so if the app dies or the network
 * drops in between, the payment's signature survives and the entry can be
 * finished later instead of the SOL being lost.
 */
export const pendingEntries = {
  async get(competitionId: string, purpose: PaymentPurpose = "entry"): Promise<string | null> {
    return (await readAll())[keyFor(competitionId, purpose)] ?? null;
  },

  async save(competitionId: string, txSignature: string, purpose: PaymentPurpose = "entry") {
    const all = await readAll();
    all[keyFor(competitionId, purpose)] = txSignature;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  async clear(competitionId: string, purpose: PaymentPurpose = "entry") {
    const all = await readAll();
    delete all[keyFor(competitionId, purpose)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all)).catch(() => {});
  },
};
