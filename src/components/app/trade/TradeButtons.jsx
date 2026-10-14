import React, { useState, useRef, useEffect } from "react";
import {
  LuTrendingUp, LuTrendingDown, LuRefreshCw, LuSquare,
} from "react-icons/lu";

/**
 * Manual trade buttons.
 *
 * Flow:
 *   1. Idle      → Even / Odd show icon + label + payout
 *   2. Press     → button shows a spinner + "Starting…"
 *   3. Placed    → both buttons collapse to a single STOP button
 *   4. Stop      → halts the run, returns to idle
 *
 * props:
 *   stake, payout     — numbers
 *   onPlace(contract) — called when the user taps Even / Odd
 *   onStop()          — called when the user taps Stop
 *   disabled          — externally blocked (e.g. auto run active)
 *   running           — true while a manual trade is active
 *   runState          — "idle" | "starting" | "running"
 */
export default function TradeButtons({
  stake, payout, onPlace, onStop, disabled, running, runState,
}) {
  const [lastPressed, setLastPressed] = useState(null);
  const clearTimer = useRef(null);

  useEffect(() => {
    if (!lastPressed) return;
    clearTimer.current = setTimeout(() => setLastPressed(null), 1500);
    return () => clearTimeout(clearTimer.current);
  }, [lastPressed]);

  const handle = (contract) => {
    if (disabled || running) return;
    setLastPressed(contract);
    onPlace(contract);
  };

  const isStarting = runState === "starting";
  const isRunning = runState === "running" || running;

  /* ---------- running state: single Stop button ---------- */
  if (isRunning || isStarting) {
    return (
      <div className="actions actions--running">
        <button
          className={`actions__stop ${isStarting ? "is-starting" : ""}`}
          onClick={isStarting ? undefined : onStop}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <LuRefreshCw className="actions__spin" />
              <span>Starting…</span>
            </>
          ) : (
            <>
              <LuSquare />
              <span>Stop</span>
            </>
          )}
        </button>
      </div>
    );
  }

  /* ---------- idle state: Even / Odd ---------- */
  return (
    <div className="actions">
      <button
        className={`ticket ticket--even ${lastPressed === "Even" ? "is-pressed" : ""}`}
        onClick={() => handle("Even")}
        disabled={disabled}
        aria-label="Place Even trade"
      >
        <span className="ticket__icon">
          <LuTrendingUp />
        </span>
        <span className="ticket__body">
          <strong className="ticket__title">Even</strong>
          <em className="ticket__sub">95.2% · ${payout} payout</em>
        </span>
        <span className="ticket__amount">${payout}</span>
      </button>

      <button
        className={`ticket ticket--odd ${lastPressed === "Odd" ? "is-pressed" : ""}`}
        onClick={() => handle("Odd")}
        disabled={disabled}
        aria-label="Place Odd trade"
      >
        <span className="ticket__icon">
          <LuTrendingDown />
        </span>
        <span className="ticket__body">
          <strong className="ticket__title">Odd</strong>
          <em className="ticket__sub">95.2% · ${payout} payout</em>
        </span>
        <span className="ticket__amount">${payout}</span>
      </button>
    </div>
  );
}
