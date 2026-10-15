import React, { useMemo } from "react";
import { LuChevronDown, LuPlus, LuMinus, LuVolume2 } from "react-icons/lu";

const VIEW_W = 800;
const VIEW_H = 260;
const PAD_TOP = 18;
const PAD_BOTTOM = 18;
const DRAW_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const TICK_MS = 900;

function buildPath(series) {
  if (!Array.isArray(series) || series.length < 2) {
    // Single point or empty: draw a flat line at mid-height so the chart
    // does not collapse to a diagonal or a NaN path.
    const midY = PAD_TOP + DRAW_H / 2;
    return {
      pathD: `M0,${midY} L${VIEW_W},${midY}`,
      areaD: `M0,${midY} L${VIEW_W},${midY} L${VIEW_W},${VIEW_H - PAD_BOTTOM} L0,${VIEW_H - PAD_BOTTOM} Z`,
      lastX: VIEW_W,
      lastY: midY,
    };
  }

  let min = Infinity;
  let max = -Infinity;
  for (const v of series) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // Floor the range so a perfectly flat series still has height.
  const rawRange = max - min;
  const range = rawRange > 0 ? rawRange : Math.max(Math.abs(max) * 0.0001, 0.01);
  const paddedMin = min - range * 0.12;
  const paddedMax = max + range * 0.12;
  const paddedRange = paddedMax - paddedMin;

  const stepX = VIEW_W / (series.length - 1);
  const y = (v) => PAD_TOP + (1 - (v - paddedMin) / paddedRange) * DRAW_H;

  let d = "";
  for (let i = 0; i < series.length; i++) {
    const cx = i * stepX;
    const cy = y(series[i]);
    if (i === 0) {
      d += `M${cx},${cy}`;
    } else {
      const px = (i - 1) * stepX;
      const py = y(series[i - 1]);
      d += ` Q${px},${py} ${(px + cx) / 2},${(py + cy) / 2}`;
    }
  }
  const lastX = (series.length - 1) * stepX;
  const lastY = y(series[series.length - 1]);
  d += ` L${lastX},${lastY}`;

  const areaD = `${d} L${VIEW_W},${VIEW_H - PAD_BOTTOM} L0,${VIEW_H - PAD_BOTTOM} Z`;

  return { pathD: d, areaD, lastX, lastY };
}

function fmtTime(msAgo) {
  const d = new Date(Date.now() - msAgo);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export default function Chart({
  market,
  price,
  change,
  series,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  hideHeader = false,
}) {
  const { pathD, areaD, lastX, lastY } = useMemo(() => buildPath(series), [series]);

  const up = change >= 0;

  // Ticks are evenly spaced at TICK_MS. Labels derive from the series length,
  // not hardcoded strings, so they stay correct when the window changes.
  const labels = useMemo(() => {
    const n = Array.isArray(series) ? series.length : 0;
    if (!n) return [];
    const span = (n - 1) * TICK_MS;
    return [0, 1 / 3, 2 / 3, 1].map((f) => fmtTime(span * (1 - f)));
  }, [series]);

  return (
    <div className="chart">
      {!hideHeader && (
        <div className="chart__head">
          <button className="chart__market" type="button">
            <span className="chart__market-label">{market?.name ?? "Vol 10 (1s)"}</span>
            <span className="chart__market-price">
              {Number(price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <em className={up ? "" : "is-neg"}>
                {up ? "+" : ""}{Number(change).toFixed(2)}%
              </em>
            </span>
            <LuChevronDown className="chart__market-caret" />
          </button>

          <button className="chart__sound" aria-label="Sound"><LuVolume2 /></button>
        </div>
      )}

      <div className="chart__canvas">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaD} fill="url(#chartFill)" />
          <path
            d={pathD}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          <circle cx={lastX} cy={lastY} r="8" fill="#3b82f6" opacity="0.18" />
          <circle cx={lastX} cy={lastY} r="3.5" fill="#60a5fa" />
        </svg>

        <div className="chart__zoom">
          <button onClick={onZoomIn} disabled={!canZoomIn} aria-label="Zoom in" title="Zoom in">
            <LuPlus />
          </button>
          <button onClick={onZoomOut} disabled={!canZoomOut} aria-label="Zoom out" title="Zoom out">
            <LuMinus />
          </button>
        </div>

        {labels.length === 4 && (
          <div className="chart__axis">
            {labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
