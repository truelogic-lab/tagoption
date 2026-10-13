import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LuTarget, LuArrowUp, LuArrowDown, LuRefreshCw,
} from "react-icons/lu";
import TxList from "../../components/app/history/TxList";

const TABS = [
  { id: "open",   label: "Open" },
  { id: "closed", label: "Closed" },
  { id: "tx",     label: "Transactions" },
];

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Positions() {
  const { store } = useOutletContext();
  const [tab, setTab] = useState("open");

  const open = store.positions;
  const closed = store.closed;
  const tx = store.tx;

  return (
    <div className="positions">
      <nav className="positions__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`positions__tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "open" && open.length > 0 && ` (${open.length})`}
            {t.id === "closed" && closed.length > 0 && ` (${closed.length})`}
          </button>
        ))}
      </nav>

      {tab === "open" && (
        open.length === 0 ? (
          <Empty title="No open positions" sub="Your active trades will appear here" />
        ) : (
          <div className="positions__list">
            {open.map((p) => (
              <div className="position" key={p.id}>
                <div className="position__head">
                  <span className="position__market">{p.market}</span>
                  <span className={`position__contract position__contract--${p.contract.toLowerCase()}`}>
                    {p.contract}
                  </span>
                </div>
                <div className="position__row">
                  <span>Stake</span>
                  <strong>${p.stake.toFixed(2)}</strong>
                </div>
                <div className="position__row">
                  <span>Payout if win</span>
                  <strong className="position__win">${(p.stake + p.payout).toFixed(2)}</strong>
                </div>
                <div className="position__foot">
                  <span>{timeAgo(p.openedAt)}</span>
                  <span className="position__live">
                    <LuRefreshCw /> Running
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "closed" && (
        closed.length === 0 ? (
          <Empty title="No closed positions yet" sub="Settled trades will appear here" />
        ) : (
          <div className="positions__list">
            {closed.map((p) => {
              const won = p.result === "won";
              return (
                <div className="history" key={p.id}>
                  <div className="history__left">
                    <span className={`history__icon history__icon--${won ? "won" : "lost"}`}>
                      {won ? <LuArrowUp /> : <LuArrowDown />}
                    </span>
                    <div>
                      <strong>{p.market}</strong>
                      <span>{p.contract} · {timeAgo(p.closedAt)}</span>
                    </div>
                  </div>
                  <div className="history__right">
                    <strong className={won ? "history__win" : "history__loss"}>
                      {won ? "+" : "-"}${(won ? p.payout : p.stake).toFixed(2)}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "tx" && <TxList items={tx} />}
    </div>
  );
}

function Empty({ title, sub }) {
  return (
    <div className="positions__empty">
      <div className="positions__empty-icon"><LuTarget /></div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}
