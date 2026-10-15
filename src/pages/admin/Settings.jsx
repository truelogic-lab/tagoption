import React, { useEffect, useState } from "react";
import {
  LuCircleCheck, LuTriangleAlert, LuImage, LuGlobe, LuMail, LuType,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";
import { setSiteConfig } from "../../lib/siteConfig";
import Spinner from "../../components/ui/Spinner";

/**
 * Site branding. Edits name, logo URL, favicon URL, support email. Changes
 * take effect immediately across the app — the client updates its in-memory
 * config and dispatches an event so every consumer re-renders.
 */
export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    faviconUrl: "",
    supportEmail: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const c = await adminApi.siteConfig();
        setForm({
          name: c.name || "",
          logoUrl: c.logoUrl || "",
          faviconUrl: c.faviconUrl || "",
          supportEmail: c.supportEmail || "",
        });
      } catch (e) {
        setError(e.message || "Failed to load");
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
      const res = await adminApi.setSiteConfig(form);
      setSiteConfig(res);
      window.dispatchEvent(new Event("tagoption:site-config"));
      setSaved("Saved. Branding is live.");
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
        <span>Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Settings</h1>
          <p className="adm-hero__sub">
            Site name, logo, favicon, support email. Changes apply instantly.
          </p>
        </div>
      </div>

      <div className="adm-card">
        <form className="wallet-form" onSubmit={save}>
          <label className="wallet-form__field">
            <span><LuType /> Site name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="TagOption"
              maxLength={60}
              className="wallet-form__input-text"
            />
            <span className="adm-field__label">
              Shown in the header, auth page, and browser tab.
            </span>
          </label>

          <label className="wallet-form__field">
            <span><LuImage /> Logo URL</span>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              maxLength={400}
              className="wallet-form__input-text"
            />
            <span className="adm-field__label">
              Leave blank for the default wordmark. Direct link to a PNG or SVG.
            </span>
          </label>

          {form.logoUrl && (
            <div className="adm-settings__preview">
              <span className="adm-field__label">Preview</span>
              <div className="adm-settings__preview-box">
                <img src={form.logoUrl} alt="Logo preview" />
              </div>
            </div>
          )}

          <label className="wallet-form__field">
            <span><LuGlobe /> Favicon URL</span>
            <input
              type="url"
              value={form.faviconUrl}
              onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
              placeholder="https://.../favicon.png"
              maxLength={400}
              className="wallet-form__input-text"
            />
            <span className="adm-field__label">
              The small icon in the browser tab. Leave blank to keep the default.
            </span>
          </label>

          <label className="wallet-form__field">
            <span><LuMail /> Support email</span>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              placeholder="support@tagoption.ke"
              maxLength={254}
              className="wallet-form__input-text"
            />
          </label>

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
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
