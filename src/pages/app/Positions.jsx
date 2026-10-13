import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LuTarget, LuArrowUp, LuArrowDown, LuRefreshCw, LuBot, LuHand,
  LuChevronDown, LuFilter,
} from "react-icons/lu";
import TxList from "../../components/app/history/TxList";
import { isLive } from "../../lib/api";

const TABS = [
  { id: "open",   label: "Open" },
  { id: "closed", label: "Closed" },
  { id: "tx",     label: "Transactions" },
];

const FILTERS = [
  { id: "all",    label: "All" },
  { id: "auto",   label: "Auto" },
  { id: "manual", label: "Manual" },
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
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Poll the server every 2 seconds while visible
  useEffect(() => {
    if (!isLive()) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      try { await store.refreshInFlight(); } catch {}
    };

    tick();
    const id = setInterval(tick, 2000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store]);

  const matchesFilter = (t) => {
    if (filter === "all") return true;
    if (filter === "auto") return Boolean(t.auto);
    return !t.auto;
  };

  const open = useMemo(() => (store.positions || []).filter(matchesFilter), [store.positions, filter]);
  const closed = useMemo(() => (store.closed || []).filter(matchesFilter), [store.closed, filter]);
  const tx = store.tx || [];

  const totals = useMemo(() => {
    const closedAll = store.closed || [];
    const wins = closedAll.filter((t) => t.result === "won").length;
    const losses = closedAll.filter((t) => t.result === "lost").length;
    const pnl = closedAll.reduce((sum, t) => {
      if (t.result === "won") return sum + (t.payout ?? 0);
      return sum - t.stake;
    }, 0);
    return { wins, losses, pnl };
  }, [store.closed]);

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

      {(tab === "open" || tab === "closed") && (
        <div className="positions__filters">
          <button
            className={`positions__filter ${filterOpen ? "is-open" : ""}`}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <LuFilter />
            {FILTERS.find((f) => f.id === filter)?.label}
            <LuChevronDown className={`positions__filter-caret ${filterOpen ? "is-open" : ""}`} />
          </button>

          {filterOpen && (
            <div className="positions__filter-menu">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={`positions__filter-option ${filter === f.id ? "is-active" : ""}`}
                  onClick={() => { setFilter(f.id); setFilterOpen(false); }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "closed" && (totals.wins + totals.losses) > 0 && (
        <div className="positions__summary">
          <div className="positions__summary-item">
            <strong>{totals.wins}</strong>
            <span>Won</span>
          </div>
          <div className="positions__summary-item">
            <strong>{totals.losses}</strong>
            <span>Lost</span>
          </div>
          <div className="positions__summary-item">
            <strong className={totals.pnl >= 0 ? "is-pos" : "is-neg"}>
              {totals.pnl >= 0 ? "+" : ""}${Math.abs(totals.pnl).toFixed(2)}
            </strong>
            <span>Net P/L</span>
          </div>
        </div>
      )}

      {tab === "open" && (
        open.length === 0 ? (
          <Empty
            icon={<LuRefreshCw />}
            title="No open positions"
            sub="Trades you place will show here while they run."
          />
        ) : (
          <div className="positions__list">
            {open.map((p) => (
              <div className="position" key={p.id}>
                <div className="position__head">
                  <span className="position__market">
                    {p.auto && <LuBot className="position__badge-icon" title="Auto" />}
                    {!p.auto && <LuHand className="position__badge-icon" title="Manual" />}
                    {p.market}
                  </span>
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
                  <strong className="position__win">
                    ${(p.stake + (p.payout ?? 0)).toFixed(2)}
                  </strong>
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
          <Empty
            icon={<LuTarget />}
            title="No closed positions yet"
            sub="Once a trade settles it will appear here."
          />
        ) : (
          <div className="positions__list">
            {closed.map((p) => {
              const won = p.result === "won";
              const net = won ? (p.payout ?? 0) : -p.stake;
              return (
                <div className="history" key={p.id}>
                  <div className="history__left">
                    <span className={`history__icon history__icon--${won ? "won" : "lost"}`}>
                      {won ? <LuArrowUp /> : <LuArrowDown />}
                    </span>
                    <div>
                      <strong>
                        {p.auto && <LuBot className="history__badge-icon" title="Auto" />}
                        {!p.auto && <LuHand className="history__badge-icon" title="Manual" />}
                        {p.market}
                      </strong>
                      <span>
                        {p.contract} · {timeAgo(p.closedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="history__right">
                    <strong className={won ? "history__win" : "history__loss"}>
                      {net >= 0 ? "+" : "-"}${Math.abs(net).toFixed(2)}
                    </strong>
                    <span className="history__stake">
                      stake ${p.stake.toFixed(2)}
                    </span>
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

function Empty({ icon, title, sub }) {
  return (
    <div className="positions__empty">
      <div className="positions__empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}
