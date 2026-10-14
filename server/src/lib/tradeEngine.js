/**
 * Trade engine — ledger math for user / platform / escrow accounts.
 *
 * Payout multiplier and win rate are NOT defined here.
 * They come from settlement.js, the single source of truth.
 */

import {
  DEFAULT_PAYOUT_MULT as PAYOUT_MULT,
  profitOf as settlementProfit,
  toCents,
  fromCents,
} from "./settlement.js";

/* Re-export so any old import from this module keeps working. */
export { PAYOUT_MULT };

export function profitOf(stake) {
  return settlementProfit(stake);
}

export function creditOnWin(stake) {
  const stakeCents = toCents(stake);
  const profitCents = toCents(settlementProfit(stake));
  return fromCents(stakeCents + profitCents);
}

export function open({ userBalance, escrowBalance, stake }) {
  const u = toCents(userBalance);
  const e = toCents(escrowBalance);
  const s = toCents(stake);
  if (s <= 0) throw new Error("Stake must be positive");
  if (u < s) throw new Error("Insufficient balance");
  return {
    userBalance: fromCents(u - s),
    escrowBalance: fromCents(e + s),
  };
}

export function settle({
  userBalance,
  platformBalance,
  escrowBalance,
  stake,
  result,
}) {
  const u = toCents(userBalance);
  const p = toCents(platformBalance);
  const e = toCents(escrowBalance);
  const s = toCents(stake);

  if (s <= 0) throw new Error("Stake must be positive");
  if (e < s) throw new Error("Insufficient escrow balance");
  if (result !== "won" && result !== "lost") throw new Error("Invalid result");

  const profit = toCents(settlementProfit(stake));
  const won = result === "won";

  let user = u;
  let platform = p;
  const escrow = e - s;

  if (won) {
    user += s + profit;
    platform -= profit;
  } else {
    platform += s;
  }

  return {
    userBalance: fromCents(user),
    platformBalance: fromCents(platform),
    escrowBalance: fromCents(escrow),
    profit: fromCents(profit),
    won,
  };
}
