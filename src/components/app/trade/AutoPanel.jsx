import React from "react";
import { LuMinus, LuPlus, LuPlay, LuSquare, LuRefreshCw } from "react-icons/lu";

function Stepper({ value, onChange, min = 1, max = Infinity, prefix = "", step = 1, disabled }) {
  return (
    <div className="auto__stepper">
      <button
        className="auto__step"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={disabled}
        aria-label="Decrease"
      >
        <LuMinus />
      </button>
      <span className="auto__value">{prefix}{value}</span>
      <button
        className="auto__step"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={disabled}
        aria-label="Increase"
      >
        <LuPlus />
      </button>
    </div>
  );
}

export default function AutoPanel({
  count, onCountChange,
  stake, onStakeChange,
  targetProfit, stopLoss,
  balance,
  running, progress, pnl, error,
  onStart, onStop,
}) {
  const needed = stake * count;
  const insufficient = balance < needed;
  const pct = progress?.total ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="auto">
      <div className="auto__row">
        <label className="auto__label">Number of trades</label>
        <Stepper value={count} onChange={onCountChange} min={1} max={500} disabled={running} />
      </div>

      <div className="auto__row">
        <label className="auto__label">Stake per trade</label>
        <Stepper value={stake} onChange={onStakeChange} min={1} prefix="$" disabled={running} />
      </div>

      <div className="auto__summary">
        <div className="auto__summary-row">
          <span>Total needed</span>
          <strong>${needed.toFixed(2)}</strong>
        </div>
        <div className="auto__summary-row">
          <span>Balance</span>
          <strong className={insufficient ? "auto__warn" : ""}>
            ${balance.toFixed(2)}
          </strong>
        </div>
        <div className="auto__summary-row">
          <span>Target profit</span>
          <strong>{targetProfit > 0 ? `$${targetProfit}` : "No limit"}</strong>
        </div>
        <div className="auto__summary-row">
          <span>Stop loss</span>
          <strong>{stopLoss > 0 ? `$${stopLoss}` : "No limit"}</strong>
        </div>
      </div>

      {running && (
        <div className="auto__progress">
          <div className="auto__progress-head">
            <span className="auto__progress-live">
              <LuRefreshCw className="auto__spin" />
              Trading {progress.done}/{progress.total}
            </span>
            <span className={pnl >= 0 ? "auto__pnl-pos" : "auto__pnl-neg"}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </span>
          </div>

          <div className="auto__bar">
            <div className="auto__bar-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="auto__stats">
            <span>{progress.wins} won</span>
            <span>{progress.losses} lost</span>
          </div>
        </div>
      )}

      {error && <div className="auto__error">{error}</div>}

      {!running ? (
        <button
          className="btn btn-blue auto__action"
          onClick={onStart}
          disabled={insufficient}
        >
          <LuPlay /> {insufficient ? "Insufficient balance" : "Start Auto Trading"}
        </button>
      ) : (
        <button className="btn btn-primary auto__action" onClick={onStop}>
          <LuSquare /> Stop
        </button>
      )}
    </div>
  );
}
