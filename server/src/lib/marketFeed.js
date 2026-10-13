/**
 * Server-side tick feed.
 *
 * Keeps a live price per market in memory. Every `TICK_MS`, each active
 * market's price drifts by a small random amount. Clients poll
 * GET /markets/:id/price and receive the current tick.
 *
 * When a real external feed is available, replace `startTicker()` with a
 * websocket subscription to the provider. The /markets/:id/price route
 * contract doesn't change.
 */
import { MARKETS, getMarket } from "./markets.js";

const TICK_MS = 900;

/** marketId → { price, change, updatedAt, history: number[] } */
const state = new Map();

function initState() {
  for (const m of MARKETS) {
    state.set(m.id, {
      price: m.base,
      change: 0,
      updatedAt: new Date().toISOString(),
      // rolling window for historical ticks (last 200 values)
      history: Array.from({ length: 200 }, () =>
        m.base * (1 + (Math.random() - 0.5) * 0.02)
      ),
    });
  }
}

function tick() {
  for (const m of MARKETS) {
    const s = state.get(m.id);
    if (!s) continue;

    // Random walk — small drift, occasional momentum flips
    const drift = (Math.random() - 0.5) * (m.base * 0.0006);
    let next = s.price + drift;

    // Keep it near base (within ±2%)
    const lo = m.base * 0.98;
    const hi = m.base * 1.02;
    if (next < lo) next = lo + Math.random() * (m.base * 0.002);
    if (next > hi) next = hi - Math.random() * (m.base * 0.002);

    s.price = +next.toFixed(2);
    s.change = +((s.price - m.base) / m.base * 100).toFixed(2);
    s.updatedAt = new Date().toISOString();
    s.history = [...s.history.slice(-199), s.price];
  }
}

let timer = null;

export function startTicker() {
  if (timer) return;
  initState();
  timer = setInterval(tick, TICK_MS);
  console.log(`[marketFeed] ticker running every ${TICK_MS}ms`);
}

export function stopTicker() {
  if (timer) clearInterval(timer);
  timer = null;
}

export function getPrice(marketId) {
  const s = state.get(marketId);
  if (!s) return null;
  const m = getMarket(marketId);
  return {
    id: marketId,
    name: m?.name,
    price: s.price,
    change: s.change,
    updatedAt: s.updatedAt,
    lastDigit: Math.abs(Math.floor(s.price * 100)) % 10,
    history: s.history.slice(-80),
  };
}

export function getTicks(marketId, limit = 80) {
  const s = state.get(marketId);
  if (!s) return [];
  return s.history.slice(-limit);
}
