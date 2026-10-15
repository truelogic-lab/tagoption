import { useCallback, useEffect, useRef, useState } from "react";
import { tradeApi } from "../../../lib/api";

/**
 * Client wrapper around the server auto-run.
 *
 * The server settles each trade in ~1.4s, so polling at 1.5s reads as live
 * without over-fetching. Polling only runs while a run is active. The mount
 * check hits the API once to resume an in-flight run after a refresh.
 *
 * onTick and onFinish are held in refs so callers can pass inline functions
 * without re-triggering the mount effect on every parent render. Before this,
 * a price tick every 900ms was causing a fresh autoStatus() call every time.
 */
const POLL_MS = 1500;

export function useAutoTrade({ onTick, onFinish }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, wins: 0, losses: 0 });
  const [pnl, setPnl] = useState(0);
  const [error, setError] = useState(null);
  const [runId, setRunId] = useState(null);

  const pollRef = useRef(null);
  const wasRunning = useRef(false);
  const onTickRef = useRef(onTick);
  const onFinishRef = useRef(onFinish);

  // Keep latest callbacks without retriggering effects.
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const s = await tradeApi.autoStatus();
      if (!s) return;

      setRunning(Boolean(s.running));
      if (s.progress) setProgress(s.progress);
      if (typeof s.pnl === "number") setPnl(s.pnl);
      if (s.error) setError(s.error);

      onTickRef.current?.();

      if (wasRunning.current && !s.running) {
        onFinishRef.current?.();
        stopPolling();
      }
      wasRunning.current = Boolean(s.running);
    } catch {
      // Silent — next tick retries.
    }
  }, [stopPolling]);

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
  }, [poll, stopPolling]);

  const stop = useCallback(async () => {
    try { await tradeApi.autoStop(); } catch {}
  }, []);

  // One-time check on mount to resume an in-flight run after a refresh.
  // Intentionally runs once — deps are stable refs and stable callbacks.
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
          stopPolling();
          pollRef.current = setInterval(poll, POLL_MS);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [poll, stopPolling]);

  // Immediate re-poll when the tab comes back into view.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && wasRunning.current) poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [poll]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { running, progress, pnl, error, runId, start, stop };
}
