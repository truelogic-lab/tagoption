import React from "react";
import { LuSquare, LuRefreshCw } from "react-icons/lu";

export default function TradeButtons({
  onPlace,
  onStop,
  disabled,
  runState,
  activeSide,
  lastResult,
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
            <span className="actions__name"><LuSquare /> STOP</span>
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
