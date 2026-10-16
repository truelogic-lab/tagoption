import React, { useCallback, useEffect, useState } from "react";
import {
  LuSearch, LuCircleCheck, LuCircleX, LuPencil, LuX,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

export default function Markets() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", base: "", sortOrder: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.markets();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load markets");
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (m) => {
    setBusy(m.id);
    try {
      await adminApi.toggleMarket(m.id, !m.enabled);
      await load();
    } catch (e) {
      alert(e.message || "Failed to toggle");
    }
    setBusy(null);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      base: String(m.base),
      sortOrder: String(m.sortOrder),
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.editMarket(editing.id, {
        name: form.name,
        base: parseFloat(form.base),
        sortOrder: parseInt(form.sortOrder, 10),
      });
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const filtered = rows.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  });

  const enabledCount = rows.filter((m) => m.enabled).length;

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Markets</h1>
          <p className="adm-hero__sub">
            {enabledCount} of {rows.length} enabled
          </p>
        </div>
      </div>

      <div className="adm-searchbar">
        <LuSearch />
        <input
          type="text"
          placeholder="Filter by id or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading markets…</span>
        </div>
      ) : error ? (
        <div className="adm-state">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="adm-state">No markets match.</div>
      ) : (
        <div className="adm-rows">
          {filtered.map((m) => (
            <article className="adm-market" key={m.id}>
              <div className="adm-market__body">
                <strong>{m.name}</strong>
                <span className="adm-market__id">{m.id}</span>
              </div>

              <div className="adm-market__stat">
                <span className="adm-field__label">Price</span>
                <strong>{Number(m.livePrice ?? 0).toFixed(2)}</strong>
              </div>

              <div className="adm-market__stat">
                <span className="adm-field__label">Change</span>
                <strong className={m.change >= 0 ? "is-pos" : "is-neg"}>
                  {m.change >= 0 ? "+" : ""}
                  {Number(m.change ?? 0).toFixed(2)}%
                </strong>
              </div>

              <div className="adm-market__stat">
                <span className="adm-field__label">Base</span>
                <strong>{m.base}</strong>
              </div>

              <div className="adm-market__actions">
                <button
                  type="button"
                  className="adm-btn adm-btn--sm"
                  onClick={() => openEdit(m)}
                  aria-label="Edit market"
                >
                  <LuPencil />
                </button>
                <button
                  type="button"
                  className={`adm-btn adm-btn--sm ${
                    m.enabled ? "adm-btn--danger" : "adm-btn--ok"
                  }`}
                  onClick={() => toggle(m)}
                  disabled={busy === m.id}
                >
                  {m.enabled ? (
                    <>
                      <LuCircleX /> Disable
                    </>
                  ) : (
                    <>
                      <LuCircleCheck /> Enable
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="modal"
          onClick={() => !saving && setEditing(null)}
        >
          <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <span className="modal__spacer" />
              <h3 className="modal__title">Edit {editing.id}</h3>
              <button
                type="button"
                className="modal__close"
                onClick={() => !saving && setEditing(null)}
                aria-label="Close"
              >
                <LuX />
              </button>
            </div>

            <form className="wallet-form" onSubmit={saveEdit}>
              <label className="wallet-form__field">
                <span>Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="wallet-form__input-text"
                  required
                />
              </label>
              <label className="wallet-form__field">
                <span>Base price</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.base}
                  onChange={(e) =>
                    setForm({ ...form, base: e.target.value })
                  }
                  className="wallet-form__input-text"
                  required
                />
              </label>
              <label className="wallet-form__field">
                <span>Sort order</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: e.target.value })
                  }
                  className="wallet-form__input-text"
                  required
                />
              </label>
              <button
                type="submit"
                className="btn btn-blue wallet-form__submit"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
