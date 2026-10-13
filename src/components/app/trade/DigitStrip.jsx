import React, { useEffect, useMemo, useRef, useState } from "react";

const DELTAS = [0.4, 0.2, 0.3, 0.5, 0.3, 0.2, 0.4, 0.4, 0.2, 0.4];

/**
 * DigitStrip
 *
 *   active        = live last digit (0-9)
 *   recentDigits  = last N digits observed from the server (for distribution)
 *   lastResult    = { result: "won"|"lost", key } — flashes the tone
 *
 * Exactly ONE digit is highlighted. Its colour alternates red/green as the
 * digit moves, and a settled result forces the tone.
 */
export default function DigitStrip({ active, recentDigits = [], lastResult }) {
  const [tone, setTone] = useState("red");
  const prevDigit = useRef(null);
  const lastResultKey = useRef(null);

  // Distribution % from actual server ticks
  const dist = useMemo(() => {
    if (!recentDigits.length) return Array(10).fill(10);
    const counts = Array(10).fill(0);
    for (const d of recentDigits) counts[d] += 1;
    const total = recentDigits.length;
    return counts.map((c) => (c / total) * 100);
  }, [recentDigits]);

  // Alternate tone every time the digit moves
  useEffect(() => {
    if (active == null) return;
    if (prevDigit.current === active) return;
    prevDigit.current = active;
    setTone((t) => (t === "red" ? "green" : "red"));
  }, [active]);

  // A settle forces the tone
  useEffect(() => {
    if (!lastResult?.key || lastResult.key === lastResultKey.current) return;
    lastResultKey.current = lastResult.key;
    setTone(lastResult.result === "won" ? "green" : "red");
  }, [lastResult?.key, lastResult?.result]);

  return (
    <div className="digits">
      {[0,1,2,3,4,5,6,7,8,9].map((d) => {
        const isActive = d === active;
        const stateClass = isActive
          ? tone === "green" ? "is-green" : "is-red"
          : "";

        return (
          <div key={d} className={`digits__cell ${stateClass}`.trim()}>
            <span className="digits__pct">{dist[d].toFixed(1)}%</span>
            <div className="digits__circle">
              <span className="digits__num">{d}</span>
              {isActive && <span className="digits__arc" />}
            </div>
            <span className={`digits__delta ${isActive ? "is-neg" : "is-pos"}`}>
              {isActive ? "-" : "+"}{DELTAS[d].toFixed(1)}%
            </span>
            {isActive && <span className="digits__caret" />}
          </div>
        );
      })}
    </div>
  );
}
