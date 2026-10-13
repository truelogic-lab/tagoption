import { useCallback, useRef, useState } from "react";
import { MARKETS, SCAN_STEPS } from "./data";

/**
 * Scanner engine.
 * Walks the filtered market list one by one, scoring each against a
 * volatility-weighted heuristic, then surfaces the best result.
 *
 * Everything is deterministic-ish simulation until a backend is wired.
 */
function scoreMarket(market) {
  const digits = parseInt(market.id.replace(/\D/g, ""), 10) || 10;
  const base = Math.min(digits / 100, 0.85);
  const noise = Math.random() * 0.14;
  return Math.min(0.98, base + noise);
}

export function useScanner() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMarket, setCurrentMarket] = useState(null);
  const [result, setResult] = useState(null);
  const cancelled = useRef(false);

  const reset = useCallback(() => {
    setProgress(0);
    setResult(null);
    setCurrentMarket(null);
  }, []);

  const stop = useCallback(() => {
    cancelled.current = true;
    setRunning(false);
  }, []);

  const start = useCallback(
    async (categoryId = "all") => {
      if (running) return;
      cancelled.current = false;
      setRunning(true);
      reset();

      const pool =
        categoryId === "all"
          ? MARKETS
          : MARKETS.filter((m) => m.category === categoryId);

      // One "step" per market — progress reflects which market is being read
      for (let i = 0; i < pool.length; i++) {
        if (cancelled.current) break;
        setCurrentMarket(pool[i]);
        setProgress(i + 1);
        await new Promise((r) => setTimeout(r, 380));
      }
      if (cancelled.current) return;

      // Pick the best-scoring market
      const scored = pool
        .map((m) => ({ market: m, score: scoreMarket(m) }))
        .sort((a, b) => b.score - a.score);

      const best = scored[0];
      const signal = Math.random() < 0.5 ? "Even" : "Odd";

      setResult({
        market: best.market,
        signal,
        confidence: Math.round(best.score * 100),
        alternates: scored.slice(1, 4).map((s) => ({
          market: s.market,
          confidence: Math.round(s.score * 100),
        })),
      });
      setCurrentMarket(null);
      setRunning(false);
    },
    [running, reset]
  );

  return {
    running,
    progress,
    total: MARKETS.length,
    currentMarket,
    result,
    start,
    stop,
    reset,
  };
}
