import React, { useEffect, useState } from "react";
import { LuRefreshCw } from "react-icons/lu";

export default function TradeButtons({ stake, payout, onPlace, disabled, autoRunning }) {
  const [pressed, setPressed] = useState(null);

  useEffect(() => {
    if (!pressed) return;
    const id = setTimeout(() => setPressed(null), 900);
    if (autoRunning) {
    return (
      <div className="actions actions--busy">
        <div className="actions__busy">
          <LuRefreshCw className="actions__spin" />
          <span>Auto trade running…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="actions">
      <button
        className={`actions__btn actions__btn--green ${pressed === "Even" ? "is-pressed" : ""}`}
        onClick={() => handle("Even")}
        disabled={disabled}
      >
        <span className="actions__name">Even</span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>

      <button
        className={`actions__btn actions__btn--red ${pressed === "Odd" ? "is-pressed" : ""}`}
        onClick={() => handle("Odd")}
        disabled={disabled}
      >
        <span className="actions__name">Odd</span>
        <span className="actions__pct">95.2%</span>
        <span className="actions__payout">${payout} Payout</span>
      </button>
    </div>
  );
}
