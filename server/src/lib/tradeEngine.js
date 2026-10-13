/**
 * Binary trade settlement — server-side, integer cents internally.
 * Same math as the client engine. This file is the source of truth;
 * the client can calculate previews but only the server mutates balances.
 */

export const PAYOUT_MULT = 0.952;

function toCents(amount) {
  if (!Number.isFinite(amount)) throw new Error("Invalid monetary amount");
  return Math.round(amount * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function profitCents(stakeCents) {
  return Math.round(stakeCents * PAYOUT_MULT);
}

export function profitOf(stake) {
  return fromCents(profitCents(toCents(stake)));
}

export function creditOnWin(stake) {
  const stakeCents = toCents(stake);
  return fromCents(stakeCents + profitCents(stakeCents));
}

export function open({ userBalance, escrowBalance, stake }) {
  const u = toCents(userBalance);
  const e = toCents(escrowBalance);
  const s = toCents(stake);
  if (s <= 0) throw new Error("Stake must be positive");
  if (u < s) throw new Error("Insufficient balance");
  return { userBalance: fromCents(u - s), escrowBalance: fromCents(e + s) };
}

export function settle({ userBalance, platformBalance, escrowBalance, stake, result }) {
  const u = toCents(userBalance);
  const p = toCents(platformBalance);
  const e = toCents(escrowBalance);
  const s = toCents(stake);

  if (s <= 0) throw new Error("Stake must be positive");
  if (e < s) throw new Error("Insufficient escrow balance");
  if (result !== "won" && result !== "lost") throw new Error("Invalid result");

  const profit = profitCents(s);
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
