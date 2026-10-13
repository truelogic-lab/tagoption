import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LuSearch, LuFilter, LuArrowDown, LuArrowUp, LuRefreshCw,
  LuTarget, LuDownload,
} from "react-icons/lu";
import { isLive } from "../../lib/api";

const FILTERS = [
  { id: "all",      label: "All" },
  { id: "deposit",  label: "Deposits" },
  { id: "withdraw", label: "Withdrawals" },
  { id: "trade",    label: "Trades" },
];

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0.00";
  return Math.abs(v).toFixed(2);
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function describe(tx) {
  const at = tx.at || tx.closedAt || tx.openedAt;
  const amount = Number(tx.amount) || 0;

  switch (tx.type) {
    case "deposit":
      return {
        title: "Deposit",
        sub: tx.method || "—",
        amount: Math.abs(amount),
        tone: "pos",
        Icon: LuArrowDown,
      };
    case "withdraw":
      return {
        title: "Withdrawal",
        sub: tx.method || "—",
        amount: -Math.abs(amount),
        tone: "neg",
        Icon: LuArrowUp,
      };
    case "trade-open":
      return {
        title: tx.market ? `${tx.contract || ""} · ${tx.market}` : "Trade opened",
        sub: "Placed",
        amount: -Math.abs(amount || tx.stake || 0),
        tone: "neg",
        Icon: LuRefreshCw,
      };
    case "trade-settle": {
      const won = tx.result === "won";
      const credit = Math.abs(amount || tx.payout || 0);
      return {
        title: tx.market ? `${tx.contract || ""} · ${tx.market}` : "Trade settled",
        sub: won ? "Won" : "Lost",
        amount: won ? credit : 0,
        tone: won ? "pos" : "neg",
        Icon: won ? LuArrowDown : LuArrowUp,
      };
    }
    // Server sometimes tags trades as just "trade" with a signed amount
    case "trade":
      return {
        title: tx.reference?.includes("settle") || amount > 0 ? "Trade settled" : "Trade opened",
        sub: amount > 0 ? "Won" : "Placed",
        amount,
        tone: amount > 0 ? "pos" : "neg",
        Icon: amount > 0 ? LuArrowDown : LuRefreshCw,
      };
    default:
      return {
        title: tx.type || "Transaction",
        sub: "—",
        amount,
        tone: amount < 0 ? "neg" : "pos",
        Icon: LuRefreshCw,
      };
  }
}

export default function History() {
  const { store } = useOutletContext();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Poll while visible so it stays fresh
  useEffect(() => {
    if (!isLive()) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      try { await store.refresh(); } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store]);

  const all = Array.isArray(store.tx) ? store.tx : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((tx) => {
        if (filter === "deposit" && tx.type !== "deposit") return false;
        if (filter === "withdraw" && tx.type !== "withdraw") return false;
        if (filter === "trade" && !tx.type?.startsWith("trade")) return false;
        if (q) {
          const hay = `${tx.type} ${tx.method ?? ""} ${tx.market ?? ""} ${tx.contract ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.at || b.closedAt) - new Date(a.at || a.closedAt));
  }, [all, filter, query]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map();
    for (const tx of filtered) {
      const iso = tx.at || tx.closedAt || tx.openedAt;
      const key = iso ? new Date(iso).toDateString() : "unknown";
      if (!map.has(key)) map.set(key, { label: dayLabel(iso), items: [] });
      map.get(key).items.push(tx);
    }
    return Array.from(map.values());
  }, [filtered]);

  const totals = useMemo(() => {
    let in_ = 0, out = 0;
    for (const tx of all) {
      const d = describe(tx);
      if (d.amount > 0) in_ += d.amount;
      else out += Math.abs(d.amount);
    }
    return { in: in_, out };
  }, [all]);

  return (
    <div className="history">
      <div className="history__head">
        <div>
          <h1 className="page-form__title">History</h1>
          <p className="page-form__lead">Every deposit, withdrawal, and settled trade.</p>
        </div>
      </div>

      <div className="history__totals">
        <div className="history__total">
          <span>In</span>
          <strong className="is-pos">+${totals.in.toFixed(2)}</strong>
        </div>
        <div className="history__total">
          <span>Out</span>
          <strong className="is-neg">-${totals.out.toFixed(2)}</strong>
        </div>
      </div>

      <div className="history__controls">
        <div className="history__search">
          <LuSearch />
          <input
            type="text"
            placeholder="Search transactions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="history__filter-wrap">
          <button
            className={`history__filter-btn ${filterOpen ? "is-open" : ""}`}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <LuFilter />
            {FILTERS.find((f) => f.id === filter)?.label}
          </button>

          {filterOpen && (
            <div className="history__filter-menu">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  className={`history__filter-option ${filter === f.id ? "is-active" : ""}`}
                  onClick={() => { setFilter(f.id); setFilterOpen(false); }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="positions__empty">
          <div className="positions__empty-icon"><LuTarget /></div>
          <h3>{query || filter !== "all" ? "Nothing matches" : "No transactions yet"}</h3>
          <p>{query || filter !== "all" ? "Try changing the filter or search." : "Deposits, withdrawals, and settled trades appear here."}</p>
        </div>
      ) : (
        grouped.map((group) => (
          <div className="history__group" key={group.label}>
            <div className="history__group-label">{group.label}</div>
            <div className="positions__list history__group-list">
              {group.items.map((tx) => {
                const d = describe(tx);
                const iso = tx.at || tx.closedAt || tx.openedAt;
                return (
                  <div className="tx" key={tx.id ?? `${tx.type}-${iso}`}>
                    <span className={`tx__icon tx__icon--${d.tone === "pos" ? "deposit" : "withdraw"}`}>
                      <d.Icon />
                    </span>
                    <div className="tx__body">
                      <strong>{d.title}</strong>
                      <span>{d.sub} · {timeAgo(iso)}</span>
                    </div>
                    <span className={`tx__amount tx__amount--${d.tone}`}>
                      {d.amount === 0 ? "—" : `${d.amount > 0 ? "+" : "-"}$${fmt(d.amount)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
