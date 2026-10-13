import { useEffect } from "react";
import { isLive, http } from "./api";
import { setPayoutMultiplier, subscribeToMultiplier } from "./tradeEngine";

export function usePayoutMultiplier() {
  useEffect(() => {
    if (!isLive()) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get("/config");
        if (!cancelled && res?.payoutMultiplier) {
          setPayoutMultiplier(res.payoutMultiplier);
        }
      } catch {}
    })();

    return () => { cancelled = true; };
  }, []);
}
