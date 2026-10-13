import React from "react";

export default function ProgressBar({ value, total }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="scan-progress">
      <div className="scan-progress__head">
        <span>Ready to scan</span>
        <span>{value}/{total}</span>
      </div>
      <div className="scan-progress__bar">
        <div className="scan-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
