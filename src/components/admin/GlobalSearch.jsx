import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch, LuX } from "react-icons/lu";
import { adminApi } from "../../lib/api";

/**
 * Cross-entity search — users, trades, transactions — by id, email, or
 * reference. Debounced by 220ms so typing doesn't fire a request per
 * keystroke. Results drop into a panel; clicking a row navigates.
 *
 * Backed by GET /admin/search?q=, which returns { users, trades, transactions }.
 * If the endpoint returns fewer results than expected, this renders an empty
 * state, never fabricated data.
 */
const DEBOUNCE_MS = 220;

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ users: [], trades: [], transactions: [] });
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setResults({ users: [], trades: [], transactions: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await adminApi.search(trimmed);
        setResults({
          users: Array.isArray(r?.users) ? r.users : [],
          trades: Array.isArray(r?.trades) ? r.trades : [],
          transactions: Array.isArray(r?.transactions) ? r.transactions : [],
        });
      } catch {
        setResults({ users: [], trades: [], transactions: [] });
      }
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer.current);
  }, [q]);

  // Close the panel when tapping outside the search box.
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  const total =
    results.users.length +
    results.trades.length +
    results.transactions.length;

  const go = (path) => {
    setOpen(false);
    setQ("");
    navigate(path);
  };

  const clear = () => {
    setQ("");
    setResults({ users: [], trades: [], transactions: [] });
  };

  return (
    <div className="gs" ref={boxRef}>
      <div className="gs__input">
        <LuSearch />
        <input
          type="text"
          placeholder="Search users, trades, transactions…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Search"
        />
        {q && (
          <button
            type="button"
            className="gs__clear"
            onClick={clear}
            aria-label="Clear search"
          >
            <LuX />
          </button>
        )}
      </div>

      {open && q.trim() && (
        <div className="gs__panel" role="listbox">
          {loading ? (
            <div className="gs__empty">Searching…</div>
          ) : total === 0 ? (
            <div className="gs__empty">Nothing found.</div>
          ) : (
            <>
              {results.users.length > 0 && (
                <div className="gs__group">
                  <span className="gs__group-label">Users</span>
                  {results.users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="gs__row"
                      onClick={() => go(`/admin/users/${u.id}`)}
                    >
                      <strong>{u.email}</strong>
                      <span>{u.name || "—"}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.trades.length > 0 && (
                <div className="gs__group">
                  <span className="gs__group-label">Trades</span>
                  {results.trades.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="gs__row"
                      onClick={() => go("/admin/trades")}
                    >
                      <strong>{t.market}</strong>
                      <span>
                        {t.contract} · {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.transactions.length > 0 && (
                <div className="gs__group">
                  <span className="gs__group-label">Transactions</span>
                  {results.transactions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="gs__row"
                      onClick={() => go("/admin/transactions")}
                    >
                      <strong>{(t.type || "").replace("-", " ")}</strong>
                      <span>
                        {t.status} · {(t.reference || t.id || "").slice(-8)}
                      </span>
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
