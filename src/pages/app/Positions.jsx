import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  LuActivity, LuCircleCheckBig, LuReceiptText, LuArrowUp, LuArrowDown,
  LuRefreshCw, LuTarget, LuClock, LuCircleAlert,
} from "react-icons/lu";
import { isLive } from "../../lib/api";
import { on } from "../../lib/events";
import { loadConfig } from "../../lib/configCache";

const TAB_ICON_SIZE = 16;
const TAB_ICON_STROKE = 2;

const TABS = [
  { id: "open",   label: "Open",         Icon: LuActivity     },
  { id: "closed", label: "Closed",       Icon: LuCircleCheckBig },
  { id: "tx",     label: "Transactions", Icon: LuReceiptText  },
];

const FILTERS = [
  { id: "all",    label: "All" },
  { id: "auto",   label: "Auto" },
  { id: "manual", label: "Manual" },
];

const MANUAL_MS_FALLBACK = 60_000;

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

function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function Positions() {
  const { store } = useOutletContext();
  const navigate = useNavigate();

  const [tab, setTab] = useState("open");
  const [filter, setFilter] = useState("all");
  const [stoppingIds, setStoppingIds] = useState(() => new Set());
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [manualMs, setManualMs] = useState(MANUAL_MS_FALLBACK);
  const [, setTickNow] = useState(0);

  const pollRef = useRef(null);
  const manualRef = useRef(MANUAL_MS_FALLBACK);

  // Fetch the trade window once. The cache helper shares the promise with
  // Trade.jsx, so no extra round-trip if the user has been to Trade already.
  useEffect(() => {
    let cancelled = false;
    loadConfig()
      .then((c) => {
        if (cancelled) return;
        const ms = Number(c?.manualTradeMs);
        if (Number.isFinite(ms) && ms > 0) {
          manualRef.current = ms;
          setManualMs(ms);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Repaint once per second so the countdown on open positions advances
  // without needing a store update.
  useEffect(() => {
    if (tab !== "open") return;
    const id = setInterval(() => setTickNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [tab]);

  useEffect(() => {
    if (!isLive()) {
      setFirstLoadDone(true);
      return;
    }

    let stopped = false;
    const tick = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        await store.refreshInFlight();
        if (!stopped) {
          setLoadError(null);
          setFirstLoadDone(true);
        }
      } catch (e) {
        if (!stopped) {
          if (!firstLoadDone) setLoadError(e?.message || "Unable to load positions");
          setFirstLoadDone(true);
        }
      }
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
  }, [store, firstLoadDone]);

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
    const refreshNow = () => { store.refreshInFlight(); };
    const refreshEverything = () => { store.refresh(); };

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

  const matchesFilter = useCallback((t) => {
    if (filter === "auto") return Boolean(t.auto);
    if (filter === "manual") return !t.auto;
    return true;
  }, [filter]);

  const open = useMemo(
    () => (store.positions || []).filter(matchesFilter),
    [store.positions, matchesFilter]
  );
  const closed = useMemo(
    () => (store.closed || []).filter(matchesFilter),
    [store.closed, matchesFilter]
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

  const showSkeleton = !firstLoadDone;

  return (
    <div className="positions">
      <nav className="positions__tabs">
        {TABS.map((t) => {
          const count =
            t.id === "open" ? open.length :
            t.id === "closed" ? closed.length :
            tx.length;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`positions__tab ${active ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-pressed={active}
            >
              <t.Icon size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE} />
              <span>{t.label}</span>
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
              type="button"
              className={`positions__filter ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loadError && firstLoadDone && (
        <div className="positions__error" role="alert">
          <LuCircleAlert size={18} strokeWidth={2} />
          <div>
            <strong>Unable to load positions</strong>
            <span>Check your connection and try again.</span>
          </div>
          <button
            type="button"
            className="positions__retry"
            onClick={() => { setLoadError(null); store.refreshInFlight().catch(() => {}); }}
          >
            <LuRefreshCw size={14} strokeWidth={2} /> Retry
          </button>
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
        showSkeleton ? (
          <SkeletonList />
        ) : open.length === 0 ? (
          <Empty
            icon={<LuRefreshCw size={28} strokeWidth={2} />}
            title={filter === "all" ? "No open positions" : `No ${filter} positions`}
            sub="Trades you place will appear here while they run."
          />
        ) : (
          <div className="positions__list">
            {open.map((p) => {
              const stopping = stoppingIds.has(p.id);
              const openedAt = new Date(p.openedAt).getTime();
              const remaining = Math.max(0, manualRef.current - (Date.now() - openedAt));
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
                      <LuClock size={14} strokeWidth={2} />
                      {stopping ? "Stopping…" : `Settles in ${fmtCountdown(remaining)}`}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        )
      )}

      {tab === "closed" && (
        showSkeleton ? (
          <SkeletonList />
        ) : closed.length === 0 ? (
          <Empty
            icon={<LuTarget size={28} strokeWidth={2} />}
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
                      {won
                        ? <LuArrowUp size={16} strokeWidth={2} />
                        : <LuArrowDown size={16} strokeWidth={2} />}
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
        showSkeleton
          ? <SkeletonList />
          : <TxList items={tx} onDeposit={() => navigate("/deposit")} />
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="positions__list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div className="positions__skeleton" key={i}>
          <div className="positions__skeleton-line positions__skeleton-line--lg" />
          <div className="positions__skeleton-line positions__skeleton-line--md" />
          <div className="positions__skeleton-line positions__skeleton-line--sm" />
        </div>
      ))}
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
        <div className="positions__empty-icon">
          <LuClock size={28} strokeWidth={2} />
        </div>
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
              {isPos
                ? <LuArrowUp size={16} strokeWidth={2} />
                : <LuArrowDown size={16} strokeWidth={2} />}
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
