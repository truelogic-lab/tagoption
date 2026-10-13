import React from "react";
import { LuChevronDown } from "react-icons/lu";
import { CATEGORIES } from "../data";

export default function CategorySelect({ value, onChange, disabled }) {
  return (
    <label className="scan-field">
      <span className="scan-field__label">Market</span>
      <div className="scan-field__select">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <LuChevronDown className="scan-field__caret" />
      </div>
    </label>
  );
}
