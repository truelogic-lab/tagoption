import { useEffect, useState } from "react";
import { isLive, tradeApi } from "./api";

/**
 * Loads the market list from the server.
 * Falls back to an empty array when the API isn't configured — the Trade
 * page will render a loading state instead of fabricating markets.
 */
export function useMarkets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(isLive());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLive()) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        const data = await tradeApi.markets();
        if (cancelled) return;
        setMarkets(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load markets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { markets, loading, error };
}
