/**
 * USD → KES exchange rate.
 *
 * Primary source: exchangerate.host (free, no key required for basic use).
 * Fallback: a hardcoded rate from env, so the site never breaks if the
 * external API is down.
 *
 * The rate is cached for 5 minutes to avoid hammering the API.
 */

const FALLBACK_RATE = Number(process.env.USD_KES_FALLBACK || 129.50);
const CACHE_MS = 5 * 60 * 1000;

let cache = { rate: FALLBACK_RATE, fetchedAt: 0, source: "fallback" };

async function fetchLiveRate() {
  // Try a couple of free providers in order
  const providers = [
    {
      name: "exchangerate.host",
      url: "https://api.exchangerate.host/latest?base=USD&symbols=KES",
      pick: (data) => data?.rates?.KES,
    },
    {
      name: "open.er-api.com",
      url: "https://open.er-api.com/v6/latest/USD",
      pick: (data) => data?.rates?.KES,
    },
  ];

  for (const p of providers) {
    try {
      const res = await fetch(p.url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = Number(p.pick(data));
      if (Number.isFinite(rate) && rate > 0) {
        return { rate, source: p.name };
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function getUsdKesRate() {
  const now = Date.now();
  if (now - cache.fetchedAt < CACHE_MS && cache.source !== "fallback") {
    return cache;
  }
  const live = await fetchLiveRate();
  if (live) {
    cache = { ...live, fetchedAt: now };
    return cache;
  }
  // Keep the last known rate even if the fetch failed
  return { ...cache, fetchedAt: now, source: cache.source || "fallback" };
}

/** Convert USD → KES using the current rate. */
export function usdToKes(usd, rate) {
  const r = rate ?? cache.rate;
  return Math.round(usd * r);
}

/** Current rate for display (server-side, sync). */
export function cachedRate() {
  return cache.rate;
}

/** Called once at boot to warm the cache. */
export async function warmFxCache() {
  const r = await getUsdKesRate();
  console.log(`[fx] USD/KES = ${r.rate.toFixed(2)} (${r.source})`);
}
