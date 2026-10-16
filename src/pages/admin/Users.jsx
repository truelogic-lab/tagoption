import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch, LuShieldAlert } from "react-icons/lu";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";
import AdjustModal from "../../components/admin/AdjustModal";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function Users() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.users(q ? { q } : {});
      // Backend returns either an array or { rows: [] }. Normalise.
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
          ? data.rows
          : [];
      setRows(list);
    } catch (e) {
      setError(e.message || "Failed to load users");
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyAdjust = async ({ amount, reason }) => {
    if (!editing) return;
    setBusy(true);
    try {
      await adminApi.adjust(editing.id, amount, reason);
      setEditing(null);
      await load(query);
    } catch (e) {
      alert(e.message || "Failed to adjust");
    }
    setBusy(false);
  };

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Users</h1>
          <p className="adm-hero__sub">
            {rows.length} account{rows.length === 1 ? "" : "s"} shown
          </p>
        </div>
      </div>

      <form
        className="adm-searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
      >
        <LuSearch />
        <input
          type="text"
          placeholder="Search by email, name, or id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading users…</span>
        </div>
      ) : error ? (
        <div className="adm-state">{error}</div>
      ) : rows.length === 0 ? (
        <div className="adm-state">No users match.</div>
      ) : (
        <div className="adm-rows">
          {rows.map((u) => (
            <article
              className="adm-user"
              key={u.id}
              onClick={() => navigate(`/admin/users/${u.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/admin/users/${u.id}`);
              }}
            >
              <div className="adm-user__avatar">
                {(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
              </div>
              <div className="adm-user__body">
                <strong>{u.name || "—"}</strong>
                <span>{u.email}</span>
              </div>
              <div className="adm-user__meta">
                <span className="adm-user__label">Balance</span>
                <strong className="adm-user__value">{money(u.balance)}</strong>
              </div>
              {u.winRateOverride != null && (
                <span className="adm-user__flag" title="Custom win rate">
                  <LuShieldAlert />
                </span>
              )}
              <button
                type="button"
                className="adm-btn adm-btn--sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(u);
                }}
              >
                Adjust
              </button>
            </article>
          ))}
        </div>
      )}

      <AdjustModal
        open={!!editing}
        user={editing}
        busy={busy}
        onClose={() => !busy && setEditing(null)}
        onConfirm={applyAdjust}
      />
    </div>
  );
}
