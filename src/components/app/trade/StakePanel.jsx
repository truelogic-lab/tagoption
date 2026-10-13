import React, { useEffect, useRef, useState } from "react";
import { LuMinus, LuPlus } from "react-icons/lu";

export default function StakePanel({ value, onChange, min = 1 }) {
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
    if (!Number.isFinite(n) || n < min) {
      setDraft(String(value));
    } else {
      onChange(+n.toFixed(2));
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value));
    setEditing(false);
  };

  const dec = () => onChange(Math.max(min, +(value - 1).toFixed(2)));
  const inc = () => onChange(+(value + 1).toFixed(2));

  return (
    <div className="stake">
      <button className="stake__step" onClick={dec} aria-label="Decrease">
        <LuMinus />
      </button>

      <div
        className={`stake__value ${editing ? "is-editing" : ""}`}
        onClick={() => !editing && setEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      >
        <span className="stake__label">STAKE</span>

        {editing ? (
          <input
            ref={inputRef}
            className="stake__input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={min}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
          />
        ) : (
          <strong>${value}</strong>
        )}
      </div>

      <button className="stake__step" onClick={inc} aria-label="Increase">
        <LuPlus />
      </button>
    </div>
  );
}
