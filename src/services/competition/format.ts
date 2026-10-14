import { ellipsify } from "../../utils/ellipsify";
import { Competition, CompetitionState } from "./types";

const LAMPORTS_PER_SOL = 1_000_000_000;

/** "◎ 0.01" — up to four decimals, no trailing zeros. */
export function formatSol(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return `◎ ${Number(sol.toFixed(4)).toString()}`;
}

/** Parses a typed SOL amount into whole lamports; null when it isn't a valid amount. */
export function solToLamports(text: string): number | null {
  const value = Number(text.trim() === "" ? "0" : text.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * LAMPORTS_PER_SOL);
}

/** Solana Explorer for one transaction or address, on the cluster the FAITH server runs on. */
export function explorerUrl(path: string, cluster: string | undefined): string {
  const suffix = !cluster || cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/${path}${suffix}`;
}

/** There are no usernames yet, so a player is shown as a short wallet address. */
export function shortAddress(pubkey: string): string {
  return ellipsify(pubkey, 4);
}

/** "2d 4h", "3h 12m", "45m", "under a minute". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "under a minute";
}

/** A ticking "9:42" inside the last hour, otherwise the coarser "2d 4h". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  if (ms >= 60 * 60_000) return formatDuration(ms);
  const totalSec = Math.floor(ms / 1000);
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, "0")}`;
}

/** "1 hour", "6 hours", "3 days" — for picking how long a tournament runs. */
export function durationOptionLabel(minutes: number): string {
  if (minutes % 1440 === 0 && minutes >= 2880) return `${minutes / 1440} days`;
  if (minutes % 60 === 0) return minutes === 60 ? "1 hour" : `${minutes / 60} hours`;
  return `${minutes} min`;
}

const STATE_LABELS: Record<CompetitionState, string> = {
  AWAITING_FUNDING: "AWAITING PAYMENT",
  OPEN: "OPEN",
  MATCHED: "MATCHED",
  IN_PROGRESS: "IN PROGRESS",
  UPCOMING: "UPCOMING",
  LIVE: "LIVE",
  SETTLING: "SETTLING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

/** Whether canceling this gave money back, so it can be labeled REFUNDED rather than CANCELLED. */
function wasRefunded(competition: Competition): boolean {
  return (
    competition.state === "CANCELLED" &&
    competition.cancelReason !== "never_funded" &&
    (competition.entryFeeLamports > 0 || competition.prizePoolLamports > 0)
  );
}

export function stateLabel(competition: Competition): string {
  return wasRefunded(competition) ? "REFUNDED" : STATE_LABELS[competition.state];
}

/** The moment a competition's current phase runs out, or null when nothing is counting down. */
export function countdownTarget(competition: Competition): string | null {
  switch (competition.state) {
    case "UPCOMING":
      return competition.startsAt;
    case "OPEN":
    case "MATCHED":
    case "IN_PROGRESS":
    case "LIVE":
      return competition.endsAt;
    default:
      return null;
  }
}

export function playersLabel(competition: Competition): string {
  return competition.maxEntrants !== null
    ? `${competition.entrants}/${competition.maxEntrants}`
    : String(competition.entrants);
}

export function prizeSplitLabel(prizeSplitBps: number[]): string {
  if (prizeSplitBps.length === 1) return "Winner takes all";
  const places = ["1st", "2nd", "3rd"];
  return prizeSplitBps
    .map((bps, index) => `${places[index] ?? `${index + 1}th`} ${bps / 100}%`)
    .join(" · ");
}

/** "Run 2", or "Sudden death 1" past the fixed number of runs. */
export function runLabel(attempt: number, attemptsPerPlayer: number): string {
  return attempt <= attemptsPerPlayer
    ? `RUN ${attempt}`
    : `SUDDEN DEATH ${attempt - attemptsPerPlayer}`;
}

export function cancelReasonText(competition: Competition): string {
  const paid = competition.entryFeeLamports > 0;
  const headToHead = competition.kind === "HEAD_TO_HEAD";
  switch (competition.cancelReason) {
    case "no_opponent":
      return paid
        ? "Nobody accepted in time, so the stake was refunded."
        : "Nobody accepted this challenge in time.";
    case "draw":
      return paid
        ? "It finished level — a draw. Both stakes were refunded."
        : "It finished level — a draw.";
    case "not_enough_players":
      return paid
        ? "Not enough players joined, so every entry was refunded."
        : "Not enough players joined.";
    case "no_scores":
      return paid
        ? "Nobody posted a score, so every entry was refunded."
        : "Nobody posted a score.";
    case "canceled_by_admin":
      return "FAITH called this off. Anything paid in was refunded.";
    case "canceled_by_creator":
      return headToHead
        ? "The challenger withdrew this before anyone accepted. Anything paid in was refunded."
        : "Its creator called this off before anyone joined. Anything paid in was refunded.";
    case "never_funded":
      return "This was never paid for, so it never opened.";
    case "house_unavailable":
      return paid
        ? "The house couldn't take this match after all, so it was called off and your stake was refunded."
        : "The house couldn't take this match after all, so it was called off.";
    default:
      return "This was canceled.";
  }
}
