/**
 * Settlement configuration.
 *
 *   WIN_RATE      — probability that any given trade wins
 *   PAYOUT_MULT   — profit paid on a win, as a fraction of the stake
 *   HOUSE_EDGE    — expected platform revenue per dollar staked
 *                   = (1 − WIN_RATE) × 1 − WIN_RATE × PAYOUT_MULT
 *
 * Change these numbers to change the economics. Every trade records which
 * values were in effect at settle time, so the platform's real edge can be
 * audited per trade and in aggregate.
 */

export const WIN_RATE = 0.30;
export const PAYOUT_MULT = 0.952;

export const HOUSE_EDGE =
  (1 - WIN_RATE) * 1 - WIN_RATE * PAYOUT_MULT;

if (process.env.NODE_ENV !== "production") {
  console.log(
    `[settlement] win=${(WIN_RATE * 100).toFixed(2)}% payout=${(PAYOUT_MULT * 100).toFixed(2)}% edge=${(HOUSE_EDGE * 100).toFixed(2)}%`
  );
}

/** Decide the outcome of a single trade. */
export function rollOutcome() {
  return Math.random() < WIN_RATE ? "won" : "lost";
}

/** Profit on a winning stake. */
export function profitOf(stake) {
  return +(stake * PAYOUT_MULT).toFixed(2);
}

/** Total returned on a win: stake + profit. */
export function creditOnWin(stake) {
  return +(stake + profitOf(stake)).toFixed(2);
}
