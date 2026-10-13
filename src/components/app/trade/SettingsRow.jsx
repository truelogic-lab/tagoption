import React, { useEffect, useRef, useState } from "react";

function EditableField({ label, symbol, tone, value, onChange, min = 0, step = 1 }) {
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
    if (Number.isFinite(n) && n >= min) onChange(n);
    else setDraft(String(value));
    setEditing(false);
  };

  return (
    <label className="settings__item">
      <span className="settings__label">{label}</span>
      <div
        className={`settings__row ${editing ? "is-editing" : ""}`}
        onClick={() => !editing && setEditing(true)}
      >
        <span className={`settings__cur settings__cur--${tone}`}>{symbol}</span>

        {editing ? (
          <input
            ref={inputRef}
            className="settings__input"
            type="number"
            inputMode="decimal"
            min={min}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
            }}
          />
        ) : (
          <span className="settings__value">{value}</span>
        )}
      </div>
    </label>
  );
}

export default function SettingsRow({ target, stop, multiplier, onChange }) {
  return (
    <div className="settings">
      <EditableField
        label="TARGET PROFIT"
        symbol="$"
        tone="green"
        value={target}
        onChange={(v) => onChange("target", v)}
        min={1}
      />
      <EditableField
        label="STOP LOSS"
        symbol="$"
        tone="red"
        value={stop}
        onChange={(v) => onChange("stop", v)}
        min={1}
      />
      <EditableField
        label="MULTIPLIER"
        symbol="×"
        tone="yellow"
        value={multiplier}
        onChange={(v) => onChange("multiplier", v)}
        min={1}
        step={0.5}
      />
    </div>
  );
}
