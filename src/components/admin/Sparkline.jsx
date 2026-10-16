import React from "react";

/**
 * Tiny area sparkline. Takes an array of numbers and draws a filled path.
 * No axis, no labels — a visual hint of direction, nothing more.
 */
export default function Sparkline({ values = [], tone = "blue", width = 100, height = 32 }) {
  if (!Array.isArray(values) || values.length < 2) {
    return <div className={`adm-spark adm-spark--${tone}`} style={{ width, height }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      className={`adm-spark adm-spark--${tone}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width={width}
      height={height}
    >
      <path d={area} className="adm-spark__area" />
      <path d={line} className="adm-spark__line" fill="none" />
    </svg>
  );
}
