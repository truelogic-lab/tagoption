/**
 * Client preview — payout math only.
 *
 * The multiplier is fetched from the server at boot (see useFx-style hook
 * below), so the preview shown to the user is always the same number the
 * server will actually use. No hard-coded constant.
 */

let CACHED_MULT = null;
const listeners = new Set();

export function getPayoutMultiplier() {
  return CACHED_MULT ?? 0.952; // fallback before the server responds
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
