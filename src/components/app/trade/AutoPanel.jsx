import React, { useEffect, useRef, useState } from "react";
import { LuMinus, LuPlus, LuPlay, LuSquare } from "react-icons/lu";

function Stepper({ value, onChange, min = 1, max = Infinity, prefix = "", step = 1 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      setDraft(String(value));
    }
  }, [editing, value]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
    else setDraft(String(value));
    setEditing(false);
  };

  return (
    <div className="auto__stepper">
      <button
        className="auto__step"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Decrease"
      >
        <LuMinus />
      </button>

      <span
        className={`auto__value ${editing ? "is-editing" : ""}`}
        onClick={() => !editing && setEditing(true)}
      >
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={draft}
            min={min}
            max={max === Infinity ? undefined : max}
            step={step}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
            }}
            className="auto__input"
          />
        ) : (
          <>{prefix}{value}</>
        )}
      </span>

      <button
        className="auto__step"
        onClick={() => onChange(Math.min(max, value + step))}
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

  return (
    <div className="auto">
      <div className="auto__row">
        <label className="auto__label">Number of trades</label>
        <Stepper value={count} onChange={onCountChange} min={1} max={100} />
      </div>

      <div className="auto__row">
        <label className="auto__label">Stake per trade</label>
        <Stepper value={stake} onChange={onStakeChange} min={1} prefix="$" />
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
            <span>Trading {progress.done}/{progress.total}</span>
            <span className={pnl >= 0 ? "auto__pnl-pos" : "auto__pnl-neg"}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </span>
          </div>
          <div className="auto__bar">
            <div
              className="auto__bar-fill"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
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
