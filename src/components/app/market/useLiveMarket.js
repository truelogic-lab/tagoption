import { useEffect, useRef, useState } from "react";
import { isLive, tradeApi } from "../../../lib/api";

/**
 * Live market hook — pulls ticks from the server.
 *
 * Server:  GET /markets/:id/price → { price, change, lastDigit, history[] }
 * Client:  polls every `interval` ms, keeps the last `windowSize` raw points.
 *
 * The series is raw prices. Chart is responsible for scaling to the viewport;
 * pre-normalizing here caused the visible jump when windowSize changed,
 * because the same tick data was rescaled against a different min/max.
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
  const [history, setHistory] = useState([]);
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

        const values = Array.isArray(tick.history) && tick.history.length
          ? tick.history
          : [tick.price];

        // Keep the raw prices. Cap the buffer so it does not grow forever.
        setHistory(values.slice(-320));
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
  }, [marketId, interval]);

  // Zoom selects a window; the raw buffer is trimmed to that window here.
  const series = history.slice(-windowSize);

  return { price, change, series, lastDigit, error };
}

/**
 * Digit distribution — how often each last-digit has appeared in recent ticks.
 */
export function useDigitDistribution(recentDigits = []) {
  const [dist, setDist] = useState(() => Array.from({ length: 10 }, () => 10));

  useEffect(() => {
    if (!recentDigits.length) return;
    const counts = Array(10).fill(0);
    for (const d of recentDigits) counts[d] += 1;
    const total = recentDigits.length || 1;
    setDist(counts.map((c) => (c / total) * 100));
  }, [recentDigits]);

  return dist;
}
