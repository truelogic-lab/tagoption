import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
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

  const load = async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.users(q ? { q } : {});
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
      <div className="adm-page__head">
        <h1 className="adm-page__title">Users</h1>
        <p className="adm-page__sub">
          {rows.length} account{rows.length === 1 ? "" : "s"} shown
        </p>
      </div>

      <form
        className="adm-search"
        onSubmit={(e) => { e.preventDefault(); load(query); }}
      >
        <LuSearch />
        <input
          type="text"
          placeholder="Search by email, name, or id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="adm-search__btn">Search</button>
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
        <div className="adm-list adm-list--2col">
          {rows.map((u) => (
            <article
              className="adm-item adm-item--clickable"
              key={u.id}
              onClick={() => navigate(`/admin/users/${u.id}`)}
            >
              <header className="adm-item__head">
                <span className="adm-item__email">{u.email}</span>
                {u.winRateOverride != null && (
                  <span className="adm-item__role">
                    {(u.winRateOverride * 100).toFixed(0)}%
                  </span>
                )}
              </header>

              <div className="adm-item__grid">
                <Field label="Name"    value={u.name || "—"} />
                <Field label="Balance" value={money(u.balance)} />
                <Field label="Volume"  value={money(u.volume)} />
                <Field
                  label="Joined"
                  value={u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                />
              </div>

              <div className="adm-item__actions">
                <button
                  className="adm-btn"
                  onClick={(e) => { e.stopPropagation(); setEditing(u); }}
                >
                  Adjust balance
                </button>
              </div>
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

function Field({ label, value }) {
  return (
    <div className="adm-field">
      <span className="adm-field__label">{label}</span>
      <span className="adm-field__value">{value}</span>
    </div>
  );
}
