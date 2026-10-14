import React from "react";
import { LuSquare, LuRefreshCw } from "react-icons/lu";

/**
 * Even / Odd buttons.
 *
 * Idle:
 *   ┌──────────────┬──────────────┐
 *   │ ● Even 95.2% │ ● Odd  95.2% │
 *   │ $19.52 Payout│ $19.52 Payout│
 *   └──────────────┴──────────────┘
 *
 * Active (e.g. Even tapped): the pressed button turns into STOP,
 * keeps its green colour, the other side dims.
 */
export default function TradeButtons({
  payout,
  onPlace,
  onStop,
  disabled,
  runState,
  activeSide,
}) {
  const isStarting = runState === "starting";
  const isRunning = runState === "running";

  const renderBtn = (side) => {
    const isThis = activeSide === side;
    const isOther = activeSide && !isThis;
    const colour = side === "Even" ? "green" : "red";
    const dotClass = side === "Even" ? "actions__dot--green" : "actions__dot--red";

    /* ---------- the pressed button turns into STOP ---------- */
    if (isThis && (isStarting || isRunning)) {
      return (
        <button
          key={side}
          className={`actions__btn actions__btn--${colour} is-active is-stop`}
          onClick={isStarting ? undefined : onStop}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <span className="actions__name">
                <LuRefreshCw className="actions__spin" />
                Starting…
              </span>
            </>
          ) : (
            <>
              <span className="actions__name">
                <LuSquare /> STOP
              </span>
              <span className="actions__pct">95.2%</span>
              <span className="actions__payout">${payout} Payout</span>
            </>
          )}
        </button>
      );
    }

    /* ---------- regular side ---------- */
    return (
      <button
        key={side}
        className={`actions__btn actions__btn--${colour} ${isOther ? "is-dim" : ""}`}
        onClick={() => onPlace(side)}
        disabled={disabled || !!activeSide}
      >
        <span className="actions__name">
          <span className={`actions__dot ${dotClass}`} />
          {side}
        </span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>
    );
  };

  return (
    <div className="actions">
      {renderBtn("Even")}
      {renderBtn("Odd")}
    </div>
  );
}
