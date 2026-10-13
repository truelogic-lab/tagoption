import React from "react";

export default function ModeToggle({ value, onChange, disabled }) {
  return (
    <div className="mode">
      <button
        className={`mode__btn ${value === "auto" ? "is-active" : ""}`}
        onClick={() => onChange("auto")}
        disabled={disabled}
      >
        AUTO
      </button>
      <button
        className={`mode__btn ${value === "manual" ? "is-active" : ""}`}
        onClick={() => onChange("manual")}
        disabled={disabled}
      >
        MANUAL
      </button>
    </div>
  );
}
