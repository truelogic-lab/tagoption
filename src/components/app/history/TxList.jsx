import React from "react";
import {
  LuArrowDown, LuArrowUp, LuRefreshCw, LuTarget,
} from "react-icons/lu";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0.00";
  return Math.abs(v).toFixed(2);
}

/**
 * Works with either:
 *   - server tx: { id, type, amount, method, reference, at }
 *   - legacy tx: { id, type, stake, payout, result, market, contract, at }
 */
function describe(tx) {
  const at = tx.at || tx.closedAt || tx.openedAt;
  const amount = Number(tx.amount) || 0;

  switch (tx.type) {
    case "deposit":
      return {
        title: "Deposit",
        sub: `${tx.method || "—"} · ${timeAgo(at)}`,
        amount: Math.abs(amount),
        tone: "pos",
        Icon: LuArrowDown,
      };
    case "withdraw":
      return {
        title: "Withdrawal",
        sub: `${tx.method || "—"} · ${timeAgo(at)}`,
        amount: -Math.abs(amount),
        tone: "neg",
        Icon: LuArrowUp,
      };
    case "trade-open":
      return {
        title: tx.market ? `${tx.contract || ""} · ${tx.market}` : "Trade opened",
        sub: `Placed · ${timeAgo(at)}`,
        amount: -Math.abs(amount || tx.stake || 0),
        tone: "neg",
        Icon: LuRefreshCw,
      };
    case "trade-settle": {
      const won = tx.result === "won";
      const credit = Math.abs(amount || tx.payout || 0);
      return {
        title: tx.market ? `${tx.contract || ""} · ${tx.market}` : "Trade settled",
        sub: `${won ? "Won" : "Lost"} · ${timeAgo(at)}`,
        amount: won ? credit : 0,
        tone: won ? "pos" : "neg",
        Icon: won ? LuArrowDown : LuArrowUp,
      };
    }
    case "trade":
      return {
        title: amount > 0 ? "Trade settled" : "Trade opened",
        sub: `${amount > 0 ? "Won" : "Placed"} · ${timeAgo(at)}`,
        amount,
        tone: amount > 0 ? "pos" : "neg",
        Icon: amount > 0 ? LuArrowDown : LuRefreshCw,
      };
    default:
      return {
        title: tx.type || "Transaction",
        sub: timeAgo(at),
        amount,
        tone: amount < 0 ? "neg" : "pos",
        Icon: LuRefreshCw,
      };
  }
}

export default function TxList({ items = [] }) {
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    return (
      <div className="positions__empty">
        <div className="positions__empty-icon"><LuTarget /></div>
        <h3>No transactions yet</h3>
        <p>Deposits, withdrawals, and settled trades will show up here.</p>
      </div>
    );
  }

  return (
    <div className="positions__list">
      {list.map((tx) => {
        const { title, sub, amount, tone, Icon } = describe(tx);
        return (
          <div className="tx" key={tx.id ?? `${tx.type}-${tx.at}`}>
            <span className={`tx__icon tx__icon--${tone === "pos" ? "deposit" : "withdraw"}`}>
              <Icon />
            </span>
            <div className="tx__body">
              <strong>{title}</strong>
              <span>{sub}</span>
            </div>
            <span className={`tx__amount tx__amount--${tone}`}>
              {amount === 0 ? "—" : `${amount > 0 ? "+" : "-"}$${fmt(amount)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
