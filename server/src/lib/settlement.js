import { sql } from "../db/index.js";

export const DEFAULT_WIN_RATE = 0.30;
export const DEFAULT_PAYOUT_MULT = 0.952;

let cache = {
  winRate: DEFAULT_WIN_RATE,
  payoutMult: DEFAULT_PAYOUT_MULT,
  loadedAt: 0,
};

export async function loadConfig() {
  try {
    const rows = await sql`select key, value from app_config`;
    for (const r of rows) {
      if (r.key === "win_rate") cache.winRate = Number(r.value);
      if (r.key === "payout_mult") cache.payoutMult = Number(r.value);
    }
    cache.loadedAt = Date.now();
  } catch {}
  return cache;
}

export function getConfig() {
  return { winRate: cache.winRate, payoutMult: cache.payoutMult };
}

export async function setConfig({ winRate, payoutMult }) {
  if (winRate != null) {
    await sql`
      insert into app_config (key, value) values ('win_rate', ${JSON.stringify(winRate)}::jsonb)
      on conflict (key) do update set value = excluded.value, at = now()
    `;
    cache.winRate = Number(winRate);
  }
  if (payoutMult != null) {
    await sql`
      insert into app_config (key, value) values ('payout_mult', ${JSON.stringify(payoutMult)}::jsonb)
      on conflict (key) do update set value = excluded.value, at = now()
    `;
    cache.payoutMult = Number(payoutMult);
  }
  return getConfig();
}

export async function effectiveWinRate(userId) {
  if (userId) {
    try {
      const rows = await sql`
        select win_rate_override from users where id = ${userId} limit 1
      `;
      const override = rows[0]?.win_rate_override;
      if (override != null) return { rate: Number(override), source: "user-override" };
    } catch {}
  }
  return { rate: cache.winRate, source: "default" };
}

export function rollOutcome(winRate) {
  const r = Number.isFinite(winRate) ? winRate : cache.winRate;
  return Math.random() < r ? "won" : "lost";
}

export function profitOf(stake) {
  return +(stake * cache.payoutMult).toFixed(2);
}

export function creditOnWin(stake) {
  return +(stake + profitOf(stake)).toFixed(2);
}

export function toCents(amount) {
  if (!Number.isFinite(amount)) throw new Error("Invalid monetary amount");
  return Math.round(amount * 100);
}

export function fromCents(cents) {
  return cents / 100;
}
