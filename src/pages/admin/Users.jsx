import React, { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function Users() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async (q = "") => {
    setLoading(true);
    try {
      const data = await adminApi.users(q ? { q } : {});
      setRows(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const adjust = async (user) => {
    const amountRaw = window.prompt(
      `Adjust balance for ${user.email}\n+100 credits $100 · -50 debits $50`,
      "10"
    );
    if (amountRaw === null) return;

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount === 0) return;

    const reason = window.prompt("Reason (for audit log)", "Manual adjustment");
    if (!reason) return;

    setBusy(user.id);
    try {
      await adminApi.adjust(user.id, amount, reason);
      await load(query);
    } catch (e) {
      alert(e.message || "Failed to adjust");
    }
    setBusy(null);
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
        <div className="loading"><Spinner size="md" tone="muted" /><span>Loading users…</span></div>
      ) : rows.length === 0 ? (
        <div className="adm-state">No users match.</div>
      ) : (
        <div className="adm-list">
          {rows.map((u) => (
            <article className="adm-item" key={u.id}>
              <header className="adm-item__head">
                <span className="adm-item__email">{u.email}</span>
                <span className="adm-item__role">{u.role}</span>
              </header>

              <div className="adm-item__grid">
                <Field label="Name"    value={u.name} />
                <Field label="Balance" value={money(u.balance)} />
                <Field label="Volume"  value={money(u.volume)} />
                <Field label="Joined"  value={new Date(u.createdAt).toLocaleDateString()} />
              </div>

              <div className="adm-item__actions">
                <button
                  className="adm-btn"
                  onClick={() => adjust(u)}
                  disabled={busy === u.id}
                >
                  {busy === u.id ? "Working…" : "Adjust balance"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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
