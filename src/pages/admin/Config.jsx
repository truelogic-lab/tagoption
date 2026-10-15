import React, { useEffect, useState } from "react";
import { LuTriangleAlert, LuCircleCheck } from "react-icons/lu";
import { adminApi } from "../../lib/api";
import Spinner from "../../components/ui/Spinner";

/**
 * Platform config. Values take effect on the next trade placed — the settle
 * engine reads them fresh on every call. Changes are written to admin_audit.
 */
export default function Config() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [form, setForm] = useState({
    winRate: "",
    payoutMult: "",
    manualTradeMs: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const c = await adminApi.config();
        setForm({
          winRate: String(c.winRate ?? ""),
          payoutMult: String(c.payoutMultiplier ?? ""),
          manualTradeMs: String(c.manualTradeMs ?? ""),
        });
      } catch (e) {
        setError(e.message || "Failed to load config");
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    try {
      const payload = {};
      const wr = parseFloat(form.winRate);
      const pm = parseFloat(form.payoutMult);
      if (Number.isFinite(wr)) payload.winRate = wr;
      if (Number.isFinite(pm)) payload.payoutMult = pm;
      await adminApi.setConfig(payload);
      setSaved("Saved. Applies to the next trade placed.");
      setTimeout(() => setSaved(""), 2400);
    } catch (e) {
      setError(e.message || "Failed to save");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <Spinner size="md" tone="muted" />
        <span>Loading config…</span>
      </div>
    );
  }

  const wr = parseFloat(form.winRate);
  const pm = parseFloat(form.payoutMult);
  const edge =
    Number.isFinite(wr) && Number.isFinite(pm) ? (1 - wr) - wr * pm : null;

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Config</h1>
          <p className="adm-hero__sub">
            Win rate and payout multiplier. Changes apply to the next trade.
          </p>
        </div>
      </div>

      <div className="adm-card">
        <form className="wallet-form" onSubmit={save}>
          <label className="wallet-form__field">
            <span>Win rate (0 to 1)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.winRate}
              onChange={(e) => setForm({ ...form, winRate: e.target.value })}
              className="wallet-form__input-text"
              required
            />
            <span className="adm-field__label">
              {Number.isFinite(wr) ? `= ${(wr * 100).toFixed(1)}% of trades win` : "—"}
            </span>
          </label>

          <label className="wallet-form__field">
            <span>Payout multiplier</span>
            <input
              type="number"
              step="0.001"
              min="0"
              max="5"
              value={form.payoutMult}
              onChange={(e) => setForm({ ...form, payoutMult: e.target.value })}
              className="wallet-form__input-text"
              required
            />
            <span className="adm-field__label">
              {Number.isFinite(pm) ? `Win pays ${(pm * 100).toFixed(1)}% of stake` : "—"}
            </span>
          </label>

          <label className="wallet-form__field">
            <span>Manual trade window (ms)</span>
            <input
              type="number"
              value={form.manualTradeMs}
              readOnly
              className="wallet-form__input-text"
            />
            <span className="adm-field__label">
              Read-only here. Set via MANUAL_TRADE_MS env on Render.
            </span>
          </label>

          <div className="adm-config__meta">
            <div className="adm-stat">
              <span>Real house edge</span>
              <strong className={edge != null && edge >= 0 ? "is-pos" : "is-neg"}>
                {edge != null ? `${(edge * 100).toFixed(2)}%` : "—"}
              </strong>
            </div>
          </div>

          {saved && (
            <div className="adm-config__msg adm-config__msg--ok">
              <LuCircleCheck /> {saved}
            </div>
          )}

          {error && (
            <div className="adm-config__msg adm-config__msg--err">
              <LuTriangleAlert /> {error}
            </div>
          )}

          <button className="btn btn-blue wallet-form__submit" disabled={saving}>
            {saving ? "Saving…" : "Save config"}
          </button>
        </form>
      </div>
    </div>
  );
}
