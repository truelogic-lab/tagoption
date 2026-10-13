/**
 * Binary trade settlement — three-account model, integer cents internally.
 *
 *   userBalance     — money the user can trade with
 *   platformBalance — the platform's own capital (starts at 0)
 *   escrowBalance   — money held against open positions
 *
 * A trade (stake S, payout multiplier 0.952, profit P = round(S × 0.952 cents)):
 *
 *   placeTrade:      user −S          escrow +S
 *   settle(loss):    escrow −S        platform +S
 *   settle(win):     escrow −S        user +S+P        platform −P
 *
 * Expected platform profit per settled trade (fair 50/50):
 *   E[Δplatform] = 0.5·(+S) + 0.5·(−P) = 0.5·S·(1 − 0.952) = 0.024·S
 *
 * That is the house edge: 2.4% of settled volume.
 */

export const PAYOUT_MULT = 0.952;

/* ---------- internal: cents ---------- */

function toCents(amount) {
  if (!Number.isFinite(amount)) {
    throw new Error("Invalid monetary amount");
  }
  return Math.round(amount * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function profitCents(stakeCents) {
  return Math.round(stakeCents * PAYOUT_MULT);
}

/* ---------- public API ---------- */

export function profitOf(stake) {
  return fromCents(profitCents(toCents(stake)));
}

export function creditOnWin(stake) {
  const stakeCents = toCents(stake);
  return fromCents(stakeCents + profitCents(stakeCents));
}

export function open({ userBalance, escrowBalance, stake }) {
  const userCents = toCents(userBalance);
  const escrowCents = toCents(escrowBalance);
  const stakeCents = toCents(stake);

  if (stakeCents <= 0) throw new Error("Stake must be positive");
  if (userCents < stakeCents) throw new Error("Insufficient balance");

  return {
    userBalance: fromCents(userCents - stakeCents),
    escrowBalance: fromCents(escrowCents + stakeCents),
  };
}

export function settle({
  userBalance,
  platformBalance,
  escrowBalance,
  stake,
  result,
}) {
  const userCents = toCents(userBalance);
  const platformCents = toCents(platformBalance);
  const escrowCents = toCents(escrowBalance);
  const stakeCents = toCents(stake);

  if (stakeCents <= 0) throw new Error("Stake must be positive");
  if (escrowCents < stakeCents) throw new Error("Insufficient escrow balance");
  if (result !== "won" && result !== "lost") throw new Error("Invalid trade result");

  const profit = profitCents(stakeCents);
  const won = result === "won";

  let user = userCents;
  let platform = platformCents;
  const escrow = escrowCents - stakeCents;

  if (won) {
    user += stakeCents + profit;
    platform -= profit;
  } else {
    platform += stakeCents;
  }

  return {
    userBalance: fromCents(user),
    platformBalance: fromCents(platform),
    escrowBalance: fromCents(escrow),
    profit: fromCents(profit),
    won,
  };
}

export function runTrade({
  userBalance,
  platformBalance,
  escrowBalance,
  stake,
  result,
}) {
  const afterOpen = open({ userBalance, escrowBalance, stake });
  return settle({
    userBalance: afterOpen.userBalance,
    platformBalance,
    escrowBalance: afterOpen.escrowBalance,
    stake,
    result,
  });
}
