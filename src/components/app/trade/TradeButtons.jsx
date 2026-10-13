import React, { useEffect, useState } from "react";

export default function TradeButtons({ stake, payout, onPlace, disabled }) {
  const [pressed, setPressed] = useState(null);

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
