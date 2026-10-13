import React, { useMemo } from "react";
import { LuChevronDown, LuPlus, LuMinus, LuVolume2 } from "react-icons/lu";

const VIEW_W = 800;
const VIEW_H = 260;
const PAD_TOP = 18;
const PAD_BOTTOM = 18;
const DRAW_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

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
  const { pathD, areaD, lastX, lastY } = useMemo(() => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = Math.max(max - min, 0.01);
    const paddedMin = min - range * 0.12;
    const paddedMax = max + range * 0.12;
    const paddedRange = paddedMax - paddedMin;

    const x = (i) => (i / Math.max(series.length - 1, 1)) * VIEW_W;
    const y = (v) => PAD_TOP + (1 - (v - paddedMin) / paddedRange) * DRAW_H;

    const coords = series.map((v, i) => [x(i), y(v)]);
    let d = `M${coords[0][0]},${coords[0][1]}`;
    for (let i = 1; i < coords.length - 1; i++) {
      const [cx, cy] = coords[i];
      const [nx, ny] = coords[i + 1];
      d += ` Q${cx},${cy} ${(cx + nx) / 2},${(cy + ny) / 2}`;
    }
    const final = coords[coords.length - 1];
    d += ` L${final[0]},${final[1]}`;
    const area = `${d} L${VIEW_W},${VIEW_H - PAD_BOTTOM} L0,${VIEW_H - PAD_BOTTOM} Z`;

    return { pathD: d, areaD: area, lastX: final[0], lastY: final[1] };
  }, [series]);

  const up = change >= 0;

  return (
    <div className="chart">
      {!hideHeader && (
        <div className="chart__head">
          <button className="chart__market" type="button">
            <span className="chart__market-label">{market?.name ?? "Vol 10 (1s)"}</span>
            <span className="chart__market-price">
              {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <em className={up ? "" : "is-neg"}>
                {up ? "+" : ""}{change.toFixed(2)}%
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
          <button
            onClick={onZoomIn}
            disabled={!canZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <LuPlus />
          </button>
          <button
            onClick={onZoomOut}
            disabled={!canZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <LuMinus />
          </button>
        </div>

        <div className="chart__axis">
          <span>10:31:09</span>
          <span>10:31:14</span>
          <span>10:31:19</span>
          <span>10:31:24</span>
        </div>
      </div>
    </div>
  );
}
