import { http } from "./api";

/**
 * Site branding. Fetched once at app boot; every consumer reads from the same
 * in-memory cache. No polling, no re-fetch on navigation.
 *
 * Empty server values mean "use these defaults" — the app must render
 * correctly on a fresh database before anyone has configured branding.
 */
export const DEFAULTS = {
  name: "TagOption",
  logoUrl: "",
  faviconUrl: "",
  supportEmail: "support@tagoption.ke",
};

let cached = null;
let pending = null;

export function getSiteConfig() {
  return cached || DEFAULTS;
}

export function loadSiteConfig() {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;

  pending = http
    .get("/site-config")
    .then((res) => {
      cached = {
        name: (res?.name || DEFAULTS.name).trim(),
        logoUrl: (res?.logoUrl || "").trim(),
        faviconUrl: (res?.faviconUrl || "").trim(),
        supportEmail: (res?.supportEmail || DEFAULTS.supportEmail).trim(),
      };
      applyDomBranding(cached);
      return cached;
    })
    .catch(() => {
      cached = DEFAULTS;
      applyDomBranding(cached);
      return cached;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export function setSiteConfig(next) {
  cached = {
    name: (next?.name || DEFAULTS.name).trim(),
    logoUrl: (next?.logoUrl || "").trim(),
    faviconUrl: (next?.faviconUrl || "").trim(),
    supportEmail: (next?.supportEmail || DEFAULTS.supportEmail).trim(),
  };
  applyDomBranding(cached);
  return cached;
}

/**
 * DOM-level branding — title and favicon live outside React. Called once when
 * the config resolves, and again when the admin updates it.
 */
export function applyDomBranding(config) {
  if (typeof document === "undefined") return;
  try {
    document.title = config.name;
  } catch {}

  if (config.faviconUrl) {
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = config.faviconUrl;
  }
}
