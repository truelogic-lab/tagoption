import { useCallback, useEffect, useRef, useState } from "react";
import { tradeApi } from "../../../lib/api";

/**
 * Client wrapper around the server auto-run.
 *
 * Server settles every ~1.4s, so we poll every 600ms — fast enough that the
 * UI reads as live, without hammering the API. Polling stops when the tab is
 * hidden and resumes the moment it comes back.
 */
const POLL_MS = 600;

export function useAutoTrade({ onTick, onFinish }) {
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
    if (document.visibilityState !== "visible") return;
    try {
      const s = await tradeApi.autoStatus();
      if (!s) return;

      setRunning(Boolean(s.running));
      if (s.progress) setProgress(s.progress);
      if (typeof s.pnl === "number") setPnl(s.pnl);
      if (s.error) setError(s.error);

      onTick?.();

      if (wasRunning.current && !s.running) {
        onFinish?.();
        stopPolling();
      }
      wasRunning.current = Boolean(s.running);
    } catch {
      // silent retry next tick
    }
  }, [onTick, onFinish]);

  const start = useCallback(async ({ count, stake, targetProfit, stopLoss, market }) => {
    setError(null);
    try {
      const res = await tradeApi.autoStart({ count, stake, targetProfit, stopLoss, market });
      if (res?.status !== "running") throw new Error(res?.error || "Auto trade failed to start");

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
  }, [poll]);

  const stop = useCallback(async () => {
    try { await tradeApi.autoStop(); } catch {}
  }, []);

  // Resume an in-flight run on mount (survives refresh / navigation)
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

  // Fast re-poll on tab focus
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && wasRunning.current) poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [poll]);

  useEffect(() => () => stopPolling(), []);

  return { running, progress, pnl, error, runId, start, stop };
}
