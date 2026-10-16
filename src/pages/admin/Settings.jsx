import React, { useEffect, useRef, useState } from "react";
import {
  LuCircleCheck, LuTriangleAlert, LuImage, LuGlobe, LuMail, LuType,
  LuUpload, LuTrash2,
} from "react-icons/lu";
import { adminApi } from "../../lib/api";
import { setSiteConfig } from "../../lib/siteConfig";
import Spinner from "../../components/ui/Spinner";

const MAX_BYTES = 300 * 1024;

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function pickImage(file) {
  if (!file) throw new Error("No file selected");
  if (!file.type.startsWith("image/")) throw new Error("File must be an image");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 300 KB");
  return readFileAsDataUri(file);
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [name, setName] = useState("");
  const [logoData, setLogoData] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconData, setFaviconData] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  const logoInput = useRef(null);
  const faviconInput = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await adminApi.siteConfig();
        setName(c.name || "");
        setLogoData(c.logoData || "");
        setLogoUrl(c.logoUrl || "");
        setFaviconData(c.faviconData || "");
        setFaviconUrl(c.faviconUrl || "");
        setSupportEmail(c.supportEmail || "");
      } catch (e) {
        setError(e.message || "Failed to load");
      }
      setLoading(false);
    })();
  }, []);

  const handleUpload = async (file, which) => {
    setUploadError("");
    try {
      const data = await pickImage(file);
      if (which === "logo") {
        setLogoData(data);
        setLogoUrl("");
      } else {
        setFaviconData(data);
        setFaviconUrl("");
      }
    } catch (e) {
      setUploadError(e.message || "Upload failed");
    }
  };

  const clearImage = (which) => {
    if (which === "logo") {
      setLogoData("");
      setLogoUrl("");
      if (logoInput.current) logoInput.current.value = "";
    } else {
      setFaviconData("");
      setFaviconUrl("");
      if (faviconInput.current) faviconInput.current.value = "";
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved("");
    setSaving(true);
    try {
      const res = await adminApi.setSiteConfig({
        name,
        logoData,
        logoUrl,
        faviconData,
        faviconUrl,
        supportEmail,
      });
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
      <div className="adm-page">
        <div className="loading">
          <Spinner size="md" tone="muted" />
          <span>Loading settings…</span>
        </div>
      </div>
    );
  }

  const currentLogo = logoData || logoUrl;
  const currentFavicon = faviconData || faviconUrl;

  return (
    <div className="adm-page">
      <div className="adm-hero adm-hero--compact">
        <div>
          <h1 className="adm-hero__title">Settings</h1>
          <p className="adm-hero__sub">
            Site name, logo, favicon, and support email. Changes apply instantly.
          </p>
        </div>
      </div>

      <form className="adm-settings" onSubmit={save}>
        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title"><LuImage /> Logo</h2>
          </div>

          <div className="adm-upload">
            <div className="adm-upload__preview">
              {currentLogo ? (
                <img src={currentLogo} alt="Site logo" />
              ) : (
                <span className="adm-upload__placeholder">
                  {(name?.[0] || "T").toUpperCase()}
                </span>
              )}
            </div>

            <div className="adm-upload__body">
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                id="logo-upload"
                className="adm-upload__file"
                onChange={(e) => handleUpload(e.target.files?.[0], "logo")}
              />
              <label htmlFor="logo-upload" className="adm-btn">
                <LuUpload /> Choose image
              </label>

              {currentLogo && (
                <button
                  type="button"
                  className="adm-btn adm-btn--danger"
                  onClick={() => clearImage("logo")}
                >
                  <LuTrash2 /> Remove
                </button>
              )}

              <p className="adm-upload__hint">
                PNG or SVG. Max 300 KB. Falls back to the initial badge if empty.
              </p>
            </div>
          </div>

          <label className="wallet-form__field">
            <span>Or paste an image URL</span>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                if (e.target.value) setLogoData("");
              }}
              placeholder="https://..."
              className="wallet-form__input-text"
            />
          </label>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title"><LuGlobe /> Favicon</h2>
          </div>

          <div className="adm-upload">
            <div className="adm-upload__preview adm-upload__preview--sm">
              {currentFavicon ? (
                <img src={currentFavicon} alt="Favicon" />
              ) : (
                <span className="adm-upload__placeholder">
                  {(name?.[0] || "T").toUpperCase()}
                </span>
              )}
            </div>

            <div className="adm-upload__body">
              <input
                ref={faviconInput}
                type="file"
                accept="image/*"
                id="favicon-upload"
                className="adm-upload__file"
                onChange={(e) => handleUpload(e.target.files?.[0], "favicon")}
              />
              <label htmlFor="favicon-upload" className="adm-btn">
                <LuUpload /> Choose favicon
              </label>

              {currentFavicon && (
                <button
                  type="button"
                  className="adm-btn adm-btn--danger"
                  onClick={() => clearImage("favicon")}
                >
                  <LuTrash2 /> Remove
                </button>
              )}

              <p className="adm-upload__hint">
                Small square icon for the browser tab. PNG recommended.
              </p>
            </div>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title"><LuType /> Text</h2>
          </div>

          <label className="wallet-form__field">
            <span>Site name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="TagOption"
              maxLength={60}
              className="wallet-form__input-text"
            />
            <span className="adm-field__label">
              Shown in headers, auth page, and the browser tab.
            </span>
          </label>

          <label className="wallet-form__field">
            <span><LuMail /> Support email</span>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@example.com"
              maxLength={254}
              className="wallet-form__input-text"
            />
          </label>
        </div>

        {uploadError && (
          <div className="adm-config__msg adm-config__msg--err">
            <LuTriangleAlert /> {uploadError}
          </div>
        )}

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

        <div className="adm-settings__actions">
          <button className="btn btn-blue" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
