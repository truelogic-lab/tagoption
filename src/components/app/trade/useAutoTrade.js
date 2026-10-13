import { useCallback, useEffect, useRef, useState } from "react";
import { tradeApi } from "../../../lib/api";

const POLL_MS = 1200;

export function useAutoTrade({ balance, onTick, onFinish }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, wins: 0, losses: 0 });
  const [pnl, setPnl] = useState(0);
  const [error, setError] = useState(null);
  const [runId, setRunId] = useState(null);

  const pollRef = useRef(null);
  const wasRunning = useRef(false);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const poll = useCallback(async () => {
    try {
      const s = await tradeApi.autoStatus();
      if (!s) return;

      setRunning(Boolean(s.running));
      if (s.progress) setProgress(s.progress);
      if (typeof s.pnl === "number") setPnl(s.pnl);
      if (s.error) setError(s.error);

      // Mirror server state into the store on every tick
      onTick?.();

      // Run just finished
      if (wasRunning.current && !s.running) {
        onFinish?.();
        stopPolling();
      }
      wasRunning.current = Boolean(s.running);
    } catch {
      // silent retry
    }
  }, [onTick, onFinish]);

  const start = useCallback(
    async ({ count, stake, targetProfit, stopLoss, market }) => {
      setError(null);
      try {
        const res = await tradeApi.autoStart({
          count, stake, targetProfit, stopLoss, market,
        });
        if (res?.status !== "running") {
          throw new Error(res?.error || "Auto trade failed to start");
        }

        setRunId(res.runId);
        setRunning(true);
        setPnl(0);
        setProgress({ done: 0, total: count, wins: 0, losses: 0 });
        wasRunning.current = true;

        stopPolling();
        pollRef.current = setInterval(poll, POLL_MS);
        poll();
      } catch (e) {
        setError(e.message || "Failed to start auto trade");
        setRunning(false);
      }
    },
    [poll]
  );

  const stop = useCallback(async () => {
    try { await tradeApi.autoStop(); } catch {}
    // The next poll picks up `running: false`
  }, []);

  // Resume an in-flight run on mount (survives refresh)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await tradeApi.autoStatus();
        if (cancelled || !s) return;
        if (s.running) {
          setRunning(true);
          setProgress(s.progress ?? { done: 0, total: 0, wins: 0, losses: 0 });
          setPnl(s.pnl ?? 0);
          wasRunning.current = true;
          pollRef.current = setInterval(poll, POLL_MS);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [poll]);

  useEffect(() => () => stopPolling(), []);

  return { running, progress, pnl, error, runId, start, stop };
}
