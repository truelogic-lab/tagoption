import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  LuArrowUp, LuArrowDown, LuRefreshCw, LuTarget, LuClock,
} from "react-icons/lu";
import { isLive, tradeApi } from "../../lib/api";
import { on } from "../../lib/events";

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

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Positions() {
  const { store } = useOutletContext();
  const navigate = useNavigate();

  const [tab, setTab] = useState("open");
  const [filter, setFilter] = useState("all");
  const [stoppingIds, setStoppingIds] = useState(() => new Set());
  const pollRef = useRef(null);

  useEffect(() => {
    if (!isLive()) return;

    let stopped = false;
    const tick = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        await store.refreshInFlight();
      } catch {}
    };

    tick();
    pollRef.current = setInterval(tick, 2000);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store]);

  useEffect(() => {
    const markStopping = ({ id }) => {
      if (!id) return;
      setStoppingIds((prev) => new Set(prev).add(id));
    };

    const clearStopping = ({ id }) => {
      if (!id) return;
      setStoppingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    const refreshNow = () => {
      store.refreshInFlight();
    };

    const refreshEverything = () => {
      store.refresh();
    };

    const offPlaced = on("trade:placed", refreshNow);
    const offStopping = on("trade:stopping", markStopping);
    const offStopped = on("trade:stopped", clearStopping);
    const offRefresh = on("trade:refresh", refreshNow);
    const offAutoStart = on("auto:started", refreshNow);
    const offAutoStopping = on("auto:stopping", refreshNow);
    const offAutoStopped = on("auto:stopped", refreshEverything);

    return () => {
      offPlaced();
      offStopping();
      offStopped();
      offRefresh();
      offAutoStart();
      offAutoStopping();
      offAutoStopped();
    };
  }, [store]);

  const matchesFilter = (t) => {
    if (filter === "auto") return Boolean(t.auto);
    if (filter === "manual") return !t.auto;
    return true;
  };

  const open = useMemo(
    () => (store.positions || []).filter(matchesFilter),
    [store.positions, filter]
  );
  const closed = useMemo(
    () => (store.closed || []).filter(matchesFilter),
    [store.closed, filter]
  );
  const tx = store.tx || [];

  const stats = useMemo(() => {
    const all = store.closed || [];
    const wins = all.filter((t) => t.result === "won").length;
    const losses = all.filter((t) => t.result === "lost").length;
    const pnl = all.reduce((sum, t) => {
      if (t.result === "won") return sum + Number(t.payout || 0);
      return sum - Number(t.stake || 0);
    }, 0);
    return { wins, losses, pnl };
  }, [store.closed]);

  const hasNothing = open.length === 0 && closed.length === 0 && tx.length === 0;

  return (
    <div className="positions">
      <nav className="positions__tabs">
        {TABS.map((t) => {
          const count =
            t.id === "open" ? open.length :
            t.id === "closed" ? closed.length :
            tx.length;
          return (
            <button
              key={t.id}
              className={`positions__tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {count > 0 && <span className="positions__count">{count}</span>}
            </button>
          );
        })}
      </nav>

      {tab !== "tx" && (
        <div className="positions__filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`positions__filter ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {tab === "closed" && (stats.wins + stats.losses) > 0 && (
        <div className="positions__stats">
          <div className="positions__stat">
            <span>Won</span>
            <strong className="is-pos">{stats.wins}</strong>
          </div>
          <div className="positions__stat">
            <span>Lost</span>
            <strong className="is-neg">{stats.losses}</strong>
          </div>
          <div className="positions__stat">
            <span>Net P&amp;L</span>
            <strong className={stats.pnl >= 0 ? "is-pos" : "is-neg"}>
              {stats.pnl >= 0 ? "+" : "-"}{money(Math.abs(stats.pnl))}
            </strong>
          </div>
        </div>
      )}

      {tab === "open" && (
        open.length === 0 ? (
          <Empty
            icon={<LuRefreshCw />}
            title={filter === "all" ? "No open positions" : `No ${filter} positions`}
            sub="Trades you place will appear here while they run."
          />
        ) : (
          <div className="positions__list">
            {open.map((p) => {
              const stopping = stoppingIds.has(p.id);
              return (
                <article className="position" key={p.id}>
                  <header className="position__head">
                    <span className="position__market">{p.market}</span>
                    <span className={`position__contract position__contract--${String(p.contract || "").toLowerCase()}`}>
                      {p.contract}
                    </span>
                  </header>

                  <div className="position__row">
                    <span>Stake</span>
                    <strong>{money(p.stake)}</strong>
                  </div>
                  <div className="position__row">
                    <span>Payout if win</span>
                    <strong className="position__win">
                      {money(Number(p.stake || 0) + Number(p.payout || 0))}
                    </strong>
                  </div>

                  <footer className="position__foot">
                    <span>{timeAgo(p.openedAt)}</span>
                    <span className={`position__live ${stopping ? "is-stopping" : ""}`}>
                      <LuRefreshCw /> {stopping ? "Stopping…" : "Running"}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        )
      )}

      {tab === "closed" && (
        closed.length === 0 ? (
          <Empty
            icon={<LuTarget />}
            title={filter === "all" ? "No closed positions yet" : `No ${filter} positions`}
            sub="Settled trades will appear here."
          />
        ) : (
          <div className="positions__list">
            {closed.map((p) => {
              const won = p.result === "won";
              const net = won ? Number(p.payout || 0) : -Number(p.stake || 0);
              return (
                <article className="history" key={p.id}>
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
                      {net >= 0 ? "+" : "-"}{money(Math.abs(net))}
                    </strong>
                    <span className="history__stake">stake {money(p.stake)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      {tab === "tx" && (
        <TxList items={tx} onDeposit={() => navigate("/deposit")} />
      )}
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

function TxList({ items, onDeposit }) {
  if (!items.length) {
    return (
      <div className="positions__empty">
        <div className="positions__empty-icon"><LuClock /></div>
        <h3>No activity yet</h3>
        <p>Deposits, withdrawals, and settled trades appear here.</p>
        <button className="btn btn-blue positions__empty-cta" onClick={onDeposit}>
          Make a deposit
        </button>
      </div>
    );
  }

  return (
    <div className="positions__list">
      {items.map((t) => {
        const amount = Number(t.amount) || 0;
        const isPos = amount >= 0;
        const label =
          t.type === "deposit" ? "Deposit" :
          t.type === "withdraw" ? "Withdrawal" :
          t.type === "trade-open" ? "Stake" :
          t.type === "trade-settle" ? "Closed" :
          (t.type || "Transaction");
        const sub =
          t.method ? `${t.method} · ${timeAgo(t.at)}` :
          t.market ? `${t.contract || ""} ${t.market} · ${timeAgo(t.at)}` :
          timeAgo(t.at);

        return (
          <article className="tx-row" key={t.id ?? `${t.type}-${t.at}`}>
            <span className={`tx-row__icon tx-row__icon--${isPos ? "in" : "out"}`}>
              {isPos ? <LuArrowUp /> : <LuArrowDown />}
            </span>
            <div className="tx-row__body">
              <strong>{label}</strong>
              <span>{sub}</span>
            </div>
            <div className="tx-row__right">
              <strong className={isPos ? "is-pos" : "is-neg"}>
                {amount === 0 ? "—" : `${isPos ? "+" : "-"}${money(Math.abs(amount))}`}
              </strong>
            </div>
          </article>
        );
      })}
    </div>
  );
}
