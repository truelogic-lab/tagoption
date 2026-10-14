/**
 * Client-side engine — mirrors the server's settlement arithmetic.
 *
 * Only used in offline / preview mode. When the API is live, all settlement
 * happens on the server. The payout multiplier is fetched from the server on
 * boot (see usePayoutMultiplier.js) so this file never drifts.
 */

let CACHED_MULT = null;
const listeners = new Set();

export function getPayoutMultiplier() {
  return CACHED_MULT ?? 0.952;   // pre-fetch fallback
}

export function setPayoutMultiplier(mult) {
  if (Number.isFinite(mult) && mult > 0) {
    CACHED_MULT = mult;
    listeners.forEach((fn) => { try { fn(mult); } catch {} });
  }
}

export function subscribeToMultiplier(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function profitOf(stake) {
  return +(stake * getPayoutMultiplier()).toFixed(2);
}

export function creditOnWin(stake) {
  return +(stake + profitOf(stake)).toFixed(2);
}

/* ---------------- two-account (offline) helpers ---------------- */

function toCents(amount) {
  if (!Number.isFinite(amount)) throw new Error("Invalid monetary amount");
  return Math.round(amount * 100);
}

function fromCents(cents) {
  return cents / 100;
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

  const profit = toCents(profitOf(stake));
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
