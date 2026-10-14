import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch, LuX } from "react-icons/lu";
import { adminApi } from "../../lib/api";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ users: [], trades: [], transactions: [] });
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setResults({ users: [], trades: [], transactions: [] }); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await adminApi.search(q.trim());
        setResults(r);
      } catch {}
    }, 220);
    return () => clearTimeout(timer.current);
  }, [q]);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  const total = results.users.length + results.trades.length + results.transactions.length;

  const go = (path) => { setOpen(false); setQ(""); navigate(path); };

  return (
    <div className="gs" ref={boxRef}>
      <div className="gs__input">
        <LuSearch />
        <input
          type="text"
          placeholder="Search users, trades, transactions…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {q && (
          <button className="gs__clear" onClick={() => setQ("")} aria-label="Clear">
            <LuX />
          </button>
        )}
      </div>

      {open && q.trim() && (
        <div className="gs__panel">
          {total === 0 ? (
            <div className="gs__empty">Nothing found</div>
          ) : (
            <>
              {results.users.length > 0 && (
                <div className="gs__group">
                  <span className="gs__group-label">Users</span>
                  {results.users.map((u) => (
                    <button key={u.id} className="gs__row" onClick={() => go(`/admin/users/${u.id}`)}>
                      <strong>{u.email}</strong>
                      <span>{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.trades.length > 0 && (
                <div className="gs__group">
                  <span className="gs__group-label">Trades</span>
                  {results.trades.map((t) => (
                    <button key={t.id} className="gs__row" onClick={() => go("/admin/trades")}>
                      <strong>{t.market}</strong>
                      <span>{t.contract} · {t.status}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.transactions.length > 0 && (
                <div className="gs__group">
                  <span className="gs__group-label">Transactions</span>
                  {results.transactions.map((t) => (
                    <button key={t.id} className="gs__row" onClick={() => go("/admin/transactions")}>
                      <strong>{t.type}</strong>
                      <span>{t.status} · {t.reference || t.id.slice(-8)}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
