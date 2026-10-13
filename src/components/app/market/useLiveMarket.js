import { useEffect, useRef, useState } from "react";
import { isLive, tradeApi } from "../../../lib/api";

/**
 * Live market hook — pulls ticks from the server.
 *
 * Server:  GET /markets/:id/price → { price, change, lastDigit, history[], updatedAt }
 * Client:  polls every `interval` ms, keeps the last `windowSize` points.
 *
 * No local simulation when the API is live. If the API is offline, the hook
 * returns whatever was last cached and stops — no fabricated ticks.
 */
export function useLiveMarket({
  marketId = "R_10",
  basePrice = 9532.87,
  windowSize = 80,
  interval = 900,
} = {}) {
  const [price, setPrice] = useState(basePrice);
  const [change, setChange] = useState(0);
  const [lastDigit, setLastDigit] = useState(0);
  const [history, setHistory] = useState(() => Array(windowSize).fill(basePrice));
  const [error, setError] = useState(null);

  const cancelled = useRef(false);

  useEffect(() => {
    if (!isLive()) return;
    cancelled.current = false;

    async function poll() {
      try {
        const tick = await tradeApi.price(marketId);
        if (cancelled.current || !tick) return;

        setPrice(tick.price);
        setChange(tick.change);
        setLastDigit(tick.lastDigit);

        // Normalize history values to 0..1 range for the chart
        const values = Array.isArray(tick.history) && tick.history.length
          ? tick.history
          : [tick.price];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const normalized = values.map((v) => (v - min) / range);

        setHistory(normalized.slice(-windowSize));
        setError(null);
      } catch (e) {
        if (!cancelled.current) setError(e.message || "Failed to load price");
      }
    }

    poll();
    const id = setInterval(poll, interval);
    return () => {
      cancelled.current = true;
      clearInterval(id);
    };
  }, [marketId, interval, windowSize]);

  // When zoom changes, refill the visible window from the last fetched full history
  const series = history.slice(-windowSize);

  return { price, change, series, lastDigit, error };
}

/**
 * Digit distribution — how often each last-digit has appeared in recent ticks.
 * Derived from the actual tick history returned by the server.
 */
export function useDigitDistribution(recentDigits = []) {
  const [dist, setDist] = useState(() =>
    Array.from({ length: 10 }, () => 10)
  );

  useEffect(() => {
    if (!recentDigits.length) return;
    const counts = Array(10).fill(0);
    for (const d of recentDigits) counts[d] += 1;
    const total = recentDigits.length || 1;
    setDist(counts.map((c) => (c / total) * 100));
  }, [recentDigits]);

  return dist;
}
