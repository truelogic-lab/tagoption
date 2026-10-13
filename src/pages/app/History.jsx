import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LuArrowDown, LuArrowUp, LuRefreshCw, LuTarget, LuSearch,
} from "react-icons/lu";
import { isLive } from "../../lib/api";

/* ------------------------------------------------------------------
   Transaction history — one flat list, grouped by day, with a simple
   type filter. Nothing else. Fast, scannable, honest.
   ------------------------------------------------------------------ */

const FILTERS = [
  { id: "all",      label: "All" },
  { id: "deposit",  label: "Deposits" },
  { id: "withdraw", label: "Withdrawals" },
  { id: "trade",    label: "Trades" },
];

function fmt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.abs(v).toFixed(2) : "0.00";
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
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (same(d, y)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function describe(tx) {
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

  // Refresh from the server periodically while visible
  useEffect(() => {
    if (!isLive()) return;
    let stopped = false;
    const tick = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try { await store.refresh(); } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
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
      .sort((a, b) => {
        const ta = new Date(a.at || a.closedAt || a.openedAt).getTime() || 0;
        const tb = new Date(b.at || b.closedAt || b.openedAt).getTime() || 0;
        return tb - ta;
      });
  }, [all, filter, query]);

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

  const empty = grouped.length === 0;

  return (
    <div className="hist">
      <div className="hist__head">
        <h1 className="hist__title">History</h1>
        <p className="hist__sub">Deposits, withdrawals, and trades.</p>
      </div>

      <div className="hist__tools">
        <div className="hist__search">
          <LuSearch />
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="hist__filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`hist__filter ${filter === f.id ? "is-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="hist__empty">
          <div className="hist__empty-icon"><LuTarget /></div>
          <h3>{query || filter !== "all" ? "Nothing here" : "No activity yet"}</h3>
          <p>
            {query || filter !== "all"
              ? "Try a different filter or search term."
              : "Deposits, withdrawals, and trades appear here."}
          </p>
        </div>
      ) : (
        grouped.map((group) => (
          <div className="hist__group" key={group.label}>
            <div className="hist__day">{group.label}</div>
            <div className="hist__rows">
              {group.items.map((tx) => {
                const d = describe(tx);
                const iso = tx.at || tx.closedAt || tx.openedAt;
                return (
                  <div className="hist__row" key={tx.id ?? `${tx.type}-${iso}`}>
                    <span className={`hist__icon hist__icon--${d.tone}`}>
                      <d.Icon />
                    </span>
                    <div className="hist__body">
                      <strong className="hist__row-title">{d.title}</strong>
                      <span className="hist__row-sub">{d.sub} · {timeAgo(iso)}</span>
                    </div>
                    <span className={`hist__amount hist__amount--${d.tone}`}>
                      {d.amount === 0
                        ? "—"
                        : `${d.amount > 0 ? "+" : "-"}$${fmt(d.amount)}`}
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
