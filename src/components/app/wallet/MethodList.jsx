import React from "react";
import { LuSmartphone, LuCreditCard, LuArrowUpRight } from "react-icons/lu";
import { METHODS } from "./methods";

export default function MethodList({ mode, onPick }) {
  const isDeposit = mode === "deposit";

  return (
    <div className="paylist">
      {METHODS.map((m) => {
        const Icon = m.icon === "usdt"
          ? () => <span className="paylist__usdt">₮</span>
          : m.icon === "card" ? LuCreditCard : LuSmartphone;
        return (
          <button key={m.id} className="paylist__row" onClick={() => onPick(m)}>
            <span className={`paylist__icon paylist__icon--${m.tone}`}><Icon /></span>
            <div>
              <strong>{m.label}</strong>
              <em>{isDeposit ? m.desc : `Withdraw to ${m.label.toLowerCase()}`}</em>
            </div>
            <LuArrowUpRight className="paylist__arrow" />
          </button>
        );
      })}
    </div>
  );
}
