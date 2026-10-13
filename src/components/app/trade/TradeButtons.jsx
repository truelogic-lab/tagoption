import React, { useEffect, useState } from "react";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";

/**
 * Even/Odd trade ticket.
 *   stake    — current stake in dollars
 *   payout   — total return on a win (stake + profit)
 *   onPlace  — callback: (contract) => void
 *   disabled — during auto / placing
 */
export default function TradeButtons({ stake, payout, onPlace, disabled }) {
  const profit = Math.max(0, payout - stake);
  const profitPct = stake > 0 ? (profit / stake) * 100 : 0;
  const [pressed, setPressed] = useState(null);

  // Clear the "placing" flash after a moment
  useEffect(() => {
    if (!pressed) return;
    const id = setTimeout(() => setPressed(null), 900);
    return () => clearTimeout(id);
  }, [pressed]);

  const handle = (contract) => {
    if (disabled) return;
    setPressed(contract);
    onPlace(contract);
  };

  return (
    <div className="ticket">
      <button
        className={`ticket__btn ticket__btn--even ${pressed === "Even" ? "is-pressed" : ""}`}
        onClick={() => handle("Even")}
        disabled={disabled}
        aria-label="Place Even trade"
      >
        <span className="ticket__top">
          <span className="ticket__icon"><LuTrendingUp /></span>
          <span className="ticket__name">Even</span>
          <span className="ticket__pct">{profitPct.toFixed(1)}%</span>
        </span>

        <span className="ticket__return">
          <span className="ticket__return-label">Return</span>
          <span className="ticket__return-value">${payout.toFixed(2)}</span>
        </span>

        <span className="ticket__profit">
          +${profit.toFixed(2)} on win
        </span>
      </button>

      <button
        className={`ticket__btn ticket__btn--odd ${pressed === "Odd" ? "is-pressed" : ""}`}
        onClick={() => handle("Odd")}
        disabled={disabled}
        aria-label="Place Odd trade"
      >
        <span className="ticket__top">
          <span className="ticket__icon"><LuTrendingDown /></span>
          <span className="ticket__name">Odd</span>
          <span className="ticket__pct">{profitPct.toFixed(1)}%</span>
        </span>

        <span className="ticket__return">
          <span className="ticket__return-label">Return</span>
          <span className="ticket__return-value">${payout.toFixed(2)}</span>
        </span>

        <span className="ticket__profit">
          +${profit.toFixed(2)} on win
        </span>
      </button>
    </div>
  );
}
