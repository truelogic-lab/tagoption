/**
 * Settlement — the single source of truth for win rate, payout multiplier,
 * and the arithmetic used to open and settle trades.
 *
 * Nothing else in the codebase should hard-code PAYOUT_MULT or WIN_RATE.
 * Import them from here, or use the helpers.
 */

/* ---------------- configuration ---------------- */

export const WIN_RATE = 0.30;
export const PAYOUT_MULT = 0.952;

export const HOUSE_EDGE =
  (1 - WIN_RATE) * 1 - WIN_RATE * PAYOUT_MULT;

if (process.env.NODE_ENV !== "production") {
  console.log(
    `[settlement] win=${(WIN_RATE * 100).toFixed(2)}% payout=${(PAYOUT_MULT * 100).toFixed(2)}% edge=${(HOUSE_EDGE * 100).toFixed(2)}%`
  );
}

/* ---------------- arithmetic ---------------- */

/** Decide the outcome of a single trade. */
export function rollOutcome() {
  return Math.random() < WIN_RATE ? "won" : "lost";
}

/** Profit on a winning stake, in dollars. */
export function profitOf(stake) {
  return +(stake * PAYOUT_MULT).toFixed(2);
}

/** Total returned on a win: stake + profit. */
export function creditOnWin(stake) {
  return +(stake + profitOf(stake)).toFixed(2);
}

/** Cents helper — used by the trade engine. */
export function toCents(amount) {
  if (!Number.isFinite(amount)) throw new Error("Invalid monetary amount");
  return Math.round(amount * 100);
}

export function fromCents(cents) {
  return cents / 100;
}
