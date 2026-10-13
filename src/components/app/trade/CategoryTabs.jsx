import React from "react";

const CATEGORIES = [
  { id: "matches",   label: "Matches/Differs" },
  { id: "evenodd",   label: "Even/Odd" },
  { id: "overunder", label: "Over/Under" },
];

export default function CategoryTabs({ value, onChange }) {
  return (
    <nav className="tabs">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          className={`tabs__tab ${value === c.id ? "is-active" : ""}`}
          onClick={() => onChange(c.id)}
        >
          {c.label}
        </button>
      ))}
    </nav>
  );
}
