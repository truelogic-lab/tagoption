import React from "react";

const TYPES = [
  { id: "all",      label: "All" },
  { id: "deposit",  label: "Deposits" },
  { id: "withdraw", label: "Withdrawals" },
  { id: "trade",    label: "Trades" },
];

export default function Filters({ value, onChange }) {
  return (
    <div className="history-filters">
      {TYPES.map((t) => (
        <button
          key={t.id}
          className={`history-filters__chip ${value === t.id ? "is-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
