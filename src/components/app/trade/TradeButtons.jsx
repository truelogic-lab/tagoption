import React from "react";
import { LuSquare, LuRefreshCw } from "react-icons/lu";

function fmtCountdown(seconds) {
  if (seconds == null || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TradeButtons({
  onPlace,
  onStop,
  disabled,
  runState,
  activeSide,
  lastResult,
  secondsLeft,
}) {
  const isStarting = runState === "starting";
  const isRunning  = runState === "running";

  const renderBtn = (side) => {
    const isThis  = activeSide === side;
    const isOther = activeSide && !isThis;
    const colour  = side === "Even" ? "green" : "red";
    const dotClass = side === "Even" ? "actions__dot--green" : "actions__dot--red";

    if (isThis && (isStarting || isRunning)) {
      return (
        <button
          key={side}
          className={`actions__btn actions__btn--${colour} is-stop`}
          onClick={isStarting ? undefined : onStop}
          disabled={isStarting}
        >
          {isStarting ? (
            <span className="actions__name">
              <LuRefreshCw className="actions__spin" /> Starting…
            </span>
          ) : (
            <>
              <span className="actions__name"><LuSquare /> STOP</span>
              <span className="actions__countdown">{fmtCountdown(secondsLeft)}</span>
            </>
          )}
        </button>
      );
    }

    if (isThis && lastResult) {
      const won = lastResult.result === "won";
      return (
        <button
          key={side}
          className={`actions__btn actions__btn--${colour} is-result ${won ? "is-win" : "is-loss"}`}
          disabled
        >
          <span className="actions__name">
            {won ? `+$${lastResult.amount.toFixed(2)}` : `-$${lastResult.amount.toFixed(2)}`}
          </span>
        </button>
      );
    }

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
