import React, { useState, useEffect, useRef } from "react";
import { LuSquare, LuRefreshCw } from "react-icons/lu";

/**
 * Even / Odd trade buttons.
 *
 * Idle:
 *   ┌──────────────┬──────────────┐
 *   │ ● Even       │ ● Odd        │
 *   │ 95.2%        │ 95.2%        │
 *   │ $19.52 Payout│ $19.52 Payout│
 *   └──────────────┴──────────────┘
 *
 * During a trade: the active side stays bright, the other dims,
 * and a Stop button replaces the layout underneath.
 */
export default function TradeButtons({
  stake, payout, onPlace, onStop,
  disabled, running, runState, activeSide,
}) {
  const isStarting = runState === "starting";
  const isRunning = running || runState === "running";

  /* ---------- running / starting ---------- */
  if (isRunning || isStarting) {
    return (
      <div className="actions actions--live">
        <button
          className={`actions__btn actions__btn--green ${activeSide === "Odd" ? "is-dim" : "is-active"}`}
          disabled
        >
          <span className="actions__name"><span className="actions__dot actions__dot--green" />Even</span>
          <span className="actions__pct">95.2%</span>
          <span className="actions__payout">${payout} Payout</span>
        </button>

        <button
          className={`actions__btn actions__btn--red ${activeSide === "Even" ? "is-dim" : "is-active"}`}
          disabled
        >
          <span className="actions__name"><span className="actions__dot actions__dot--red" />Odd</span>
          <span className="actions__pct">95.2%</span>
          <span className="actions__payout">${payout} Payout</span>
        </button>

        <button
          className={`actions__stop ${isStarting ? "is-starting" : ""}`}
          onClick={isStarting ? undefined : onStop}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <LuRefreshCw className="actions__spin" />
              Starting…
            </>
          ) : (
            <>
              <LuSquare /> STOP
            </>
          )}
        </button>
      </div>
    );
  }

  /* ---------- idle ---------- */
  return (
    <div className="actions">
      <button
        className="actions__btn actions__btn--green"
        onClick={() => onPlace("Even")}
        disabled={disabled}
      >
        <span className="actions__name"><span className="actions__dot actions__dot--green" />Even</span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>

      <button
        className="actions__btn actions__btn--red"
        onClick={() => onPlace("Odd")}
        disabled={disabled}
      >
        <span className="actions__name"><span className="actions__dot actions__dot--red" />Odd</span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>
    </div>
  );
}
