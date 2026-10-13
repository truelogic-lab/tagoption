import React from "react";

export default function TradeButtons({ stake, payout, onPlace, disabled }) {
  return (
    <div className="actions">
      <button
        className="actions__btn actions__btn--green"
        onClick={() => onPlace("Even")}
        disabled={disabled}
      >
        <span className="actions__name">Even</span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>

      <button
        className="actions__btn actions__btn--red"
        onClick={() => onPlace("Odd")}
        disabled={disabled}
      >
        <span className="actions__name">Odd</span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>
    </div>
  );
}
