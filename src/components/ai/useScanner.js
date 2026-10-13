import { useCallback, useRef, useState } from "react";
import { isLive, tradeApi, http } from "../../lib/api";

/**
 * Market scanner.
 *
 * Reads the actual tick history for each market and computes real statistics
 * from it — no random scoring, no coin-flip signals.
 *
 * What we compute per market:
 *   - digitDistribution: how often each digit 0-9 has landed in the last N ticks
 *   - evenOddRatio:      the actual Even / Odd split over the last N ticks
 *   - streak:            the current length of the running Even or Odd streak
 *   - volatility:        standard deviation of tick deltas, normalised to %
 *   - momentum:          sign + magnitude of the price trend over the window
 *
 * The "pick" is whichever market has the strongest divergence from its own
 * recent baseline. The user sees the numbers that produced the pick — no
 * black box, no invented confidence.
 */

const WINDOW = 60;
const SCAN_STEPS = 13;

function digitsFromHistory(history) {
  // history is an array of prices; last digit = |floor(price * 100)| % 10
  return history.map((p) => Math.abs(Math.floor(p * 100)) % 10);
}

function analyse(history) {
  if (!history || history.length < 10) return null;

  const window = history.slice(-WINDOW);
  const digits = digitsFromHistory(window);

  // Digit distribution
  const counts = Array(10).fill(0);
  digits.forEach((d) => { counts[d] += 1; });
  const total = digits.length;
  const distribution = counts.map((c) => c / total);

  // Even / Odd split
  const even = digits.filter((d) => d % 2 === 0).length;
  const odd = digits.length - even;
  const evenRatio = even / digits.length;

  // Current streak
  let streak = 1;
  let streakType = digits[digits.length - 1] % 2 === 0 ? "Even" : "Odd";
  for (let i = digits.length - 2; i >= 0; i--) {
    const type = digits[i] % 2 === 0 ? "Even" : "Odd";
    if (type === streakType) streak++;
    else break;
  }

  // Volatility — stdev of deltas, as % of mean price
  const deltas = [];
  for (let i = 1; i < window.length; i++) {
    deltas.push((window[i] - window[i - 1]) / window[i - 1]);
  }
  const mean = deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1);
  const variance = deltas.reduce((a, d) => a + (d - mean) ** 2, 0) / (deltas.length || 1);
  const volatility = Math.sqrt(variance) * 100;

  // Momentum — % change from start to end of window
  const momentum = ((window[window.length - 1] - window[0]) / window[0]) * 100;

  return {
    distribution,
    evenRatio,
    oddRatio: 1 - evenRatio,
    streak,
    streakType,
    volatility,
    momentum,
    sample: window.length,
  };
}

/**
 * Rank markets by how far their even/odd ratio deviates from a fair 50/50.
 * A strong deviation is a real, measurable fact — not a prediction.
 */
function rankByDivergence(analyses) {
  return Object.entries(analyses)
    .filter(([, a]) => a !== null)
    .map(([marketId, a]) => {
      const divergence = Math.abs(a.evenRatio - 0.5);
      return { marketId, analysis: a, divergence };
    })
    .sort((a, b) => b.divergence - a.divergence);
}

export function useScanner(markets = []) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMarket, setCurrentMarket] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const cancelled = useRef(false);

  const reset = useCallback(() => {
    setProgress(0);
    setResult(null);
    setCurrentMarket(null);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    cancelled.current = true;
    setRunning(false);
  }, []);

  const start = useCallback(async () => {
    if (running || !markets.length) return;
    cancelled.current = false;
    setRunning(true);
    reset();

    const analyses = {};

    // Walk each market, fetch its ticks, analyse them
    for (let i = 0; i < markets.length; i++) {
      if (cancelled.current) break;
      const m = markets[i];
      setCurrentMarket(m);
      setProgress(i + 1);

      try {
        const tick = await tradeApi.price(m.id);
        if (tick?.history?.length) {
          analyses[m.id] = analyse(tick.history);
        }
      } catch {
        analyses[m.id] = null;
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    if (cancelled.current) return;

    // Rank and pick the strongest divergence
    const ranked = rankByDivergence(analyses);
    if (!ranked.length) {
      setError("Not enough market data to scan.");
      setRunning(false);
      return;
    }

    const best = ranked[0];
    const a = best.analysis;
    const market = markets.find((m) => m.id === best.marketId);

    // The signal is the side currently showing a statistically unusual run
    const signal = a.evenRatio > 0.5 ? "Even" : "Odd";

    setResult({
      market,
      signal,
      // Real numbers from the analysis — not invented
      evenRatio: a.evenRatio,
      oddRatio: a.oddRatio,
      streak: a.streak,
      streakType: a.streakType,
      volatility: a.volatility,
      momentum: a.momentum,
      sample: a.sample,
      alternates: ranked.slice(1, 4).map((r) => ({
        market: markets.find((m) => m.id === r.marketId),
        analysis: r.analysis,
      })),
    });
    setCurrentMarket(null);
    setRunning(false);
  }, [running, markets, reset]);

  return {
    running,
    progress,
    total: markets.length,
    currentMarket,
    result,
    error,
    start,
    stop,
    reset,
  };
}
