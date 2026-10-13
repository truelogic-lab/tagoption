import React, { useEffect, useRef, useState } from "react";
import { LuChevronDown, LuCheck } from "react-icons/lu";

export default function MarketSelect({ markets, current, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div className="market-select" ref={ref}>
      <button
        className={`chart__market ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="chart__market-info">
          <span className="chart__market-label">{current.name}</span>
          <span className="chart__market-price">
            {current.price != null
              ? `${current.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} `
              : ""}
            <em className={current.change >= 0 ? "" : "is-neg"}>
              {current.change >= 0 ? "+" : ""}{(current.change ?? 0).toFixed(2)}%
            </em>
          </span>
        </div>
        <LuChevronDown className={`chart__market-caret ${open ? "is-rotated" : ""}`} />
      </button>

      {open && (
        <div className="market-select__menu">
          {markets.map((m) => (
            <button
              key={m.id}
              className={`market-select__item ${m.id === current.id ? "is-active" : ""}`}
              onClick={() => { onChange(m); setOpen(false); }}
            >
              <span className="market-select__name">{m.name}</span>
              <span className="market-select__sym">{m.symbol}</span>
              {m.id === current.id && <LuCheck className="market-select__check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
