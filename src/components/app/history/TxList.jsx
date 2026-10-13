import React from "react";
import {
  LuArrowDown, LuArrowUp, LuRefreshCw, LuTarget,
} from "react-icons/lu";

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function describe(tx) {
  switch (tx.type) {
    case "deposit":
      return {
        title: "Deposit",
        sub: `${tx.method || "—"} · ${timeAgo(tx.at)}`,
        amount: `+$${tx.amount.toFixed(2)}`,
        tone: "pos",
        Icon: LuArrowDown,
      };
    case "withdraw":
      return {
        title: "Withdrawal",
        sub: `${tx.method || "—"} · ${timeAgo(tx.at)}`,
        amount: `-$${tx.amount.toFixed(2)}`,
        tone: "neg",
        Icon: LuArrowUp,
      };
    case "trade-open":
      return {
        title: `${tx.contract} · ${tx.market}`,
        sub: `Placed · ${timeAgo(tx.at)}`,
        amount: `-$${tx.stake.toFixed(2)}`,
        tone: "neg",
        Icon: LuRefreshCw,
      };
    case "trade-settle": {
      const won = tx.result === "won";
      return {
        title: `${tx.contract} · ${tx.market}`,
        sub: `${won ? "Won" : "Lost"} · ${timeAgo(tx.at)}`,
        amount: won ? `+$${tx.payout.toFixed(2)}` : `-$0.00`,
        tone: won ? "pos" : "neg",
        Icon: won ? LuArrowDown : LuArrowUp,
      };
    }
    default:
      return {
        title: tx.type,
        sub: timeAgo(tx.at),
        amount: "—",
        tone: "pos",
        Icon: LuRefreshCw,
      };
  }
}

export default function TxList({ items }) {
  if (!items.length) {
    return (
      <div className="positions__empty">
        <div className="positions__empty-icon"><LuTarget /></div>
        <h3>Nothing here yet</h3>
        <p>Your activity will show up here.</p>
      </div>
    );
  }

  return (
    <div className="positions__list">
      {items.map((tx) => {
        const { title, sub, amount, tone, Icon } = describe(tx);
        return (
          <div className="tx" key={tx.id}>
            <span className={`tx__icon tx__icon--${tone === "pos" ? "deposit" : "withdraw"}`}>
              <Icon />
            </span>
            <div className="tx__body">
              <strong>{title}</strong>
              <span>{sub}</span>
            </div>
            <span className={`tx__amount tx__amount--${tone}`}>
              {amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
