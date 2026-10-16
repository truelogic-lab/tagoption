import React from "react";

/**
 * Tiny area sparkline for KPI cards. No axes, no labels — one filled
 * area path and one line path across a small viewBox. The parent sets
 * the tone via the `tone` prop so the stroke and fill colour match the
 * card it belongs to.
 *
 * Renders an empty placeholder when given fewer than two values, so a
 * card with no trend data doesn't collapse.
 */
export default function Sparkline({
  values = [],
  tone = "blue",
  width = 120,
  height = 32,
}) {
  if (!Array.isArray(values) || values.length < 2) {
    return (
      <div
        className={`adm-spark adm-spark--${tone}`}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    // Inset by 2px top/bottom so the peak and trough don't clip.
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      className={`adm-spark adm-spark--${tone}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width={width}
      height={height}
      aria-hidden="true"
    >
      <path d={area} className="adm-spark__area" />
      <path d={line} className="adm-spark__line" fill="none" />
    </svg>
  );
}
