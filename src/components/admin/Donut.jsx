import React from "react";

/**
 * Pure-SVG donut chart. Takes segments in order and renders proportional
 * arcs on a ring. A hole in the middle carries a label and value.
 */
export default function Donut({ segments = [], size = 140, thickness = 22, label, value }) {
  const total = segments.reduce((s, seg) => s + Number(seg.value || 0), 0);

  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const pct = total > 0 ? Number(seg.value || 0) / total : 0;
    const dash = pct * circumference;
    const arc = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return arc;
  });

  return (
    <div className="adm-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--adm-border)" strokeWidth={thickness} />
        {arcs}
      </svg>
      {(label || value) && (
        <div className="adm-donut__center">
          {value != null && <strong>{value}</strong>}
          {label && <span>{label}</span>}
        </div>
      )}
    </div>
  );
}
