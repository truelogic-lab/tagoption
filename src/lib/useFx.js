import { useEffect, useState } from "react";
import { fxApi } from "./api";

/**
 * Returns the current USD → KES rate + helpers.
 * Cached server-side for 5 minutes; client caches in-memory for the tab.
 */
const DEFAULT_RATE = 129.50;

let cached = { rate: DEFAULT_RATE, at: 0 };

export function useFx() {
  const [rate, setRate] = useState(cached.rate);
  const [source, setSource] = useState("default");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fxApi.usdKes();
        if (cancelled || !res?.rate) return;
        cached = { rate: res.rate, at: Date.now() };
        setRate(res.rate);
        setSource(res.source);
      } catch {
        // keep the default
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toKes = (usd) => Math.round(Number(usd || 0) * rate);

  return { rate, source, toKes };
}
