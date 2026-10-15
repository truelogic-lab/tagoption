import { http } from "./api";

/**
 * Site branding with a localStorage cache.
 *
 * Without the cache, every page load renders DEFAULTS for ~100-500ms until
 * /site-config resolves — visible as a flicker of the default name before
 * the real one. Reading the last-known-good value synchronously on boot
 * removes that window entirely after the first visit. The fetch still runs
 * on every load so server-side changes propagate.
 */
const CACHE_KEY = "tagoption.siteConfig.v1";

export const DEFAULTS = {
  name: "TagOption",
  logo: "",
  favicon: "",
  supportEmail: "support@tagoption.ke",
};

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      name: (parsed.name || DEFAULTS.name).trim(),
      logo: (parsed.logo || "").trim(),
      favicon: (parsed.favicon || "").trim(),
      supportEmail: (parsed.supportEmail || DEFAULTS.supportEmail).trim(),
    };
  } catch {
    return null;
  }
}

function writeCache(config) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch {}
}

function resolveLogo(res) {
  return (res?.logoData || res?.logoUrl || "").trim();
}
function resolveFavicon(res) {
  return (res?.faviconData || res?.faviconUrl || "").trim();
}

// Seed from cache immediately so the first render is correct.
let cached = readCache() || DEFAULTS;
let pending = null;

// Brand the DOM before React mounts, using whatever we have cached.
applyDomBranding(cached);

export function getSiteConfig() {
  return cached;
}

export function loadSiteConfig() {
  if (pending) return pending;

  pending = http
    .get("/site-config")
    .then((res) => {
      const next = {
        name: (res?.name || DEFAULTS.name).trim(),
        logo: resolveLogo(res),
        favicon: resolveFavicon(res),
        supportEmail: (res?.supportEmail || DEFAULTS.supportEmail).trim(),
      };
      cached = next;
      writeCache(next);
      applyDomBranding(next);
      // Notify listeners so React state updates without a reload.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tagoption:site-config"));
      }
      return next;
    })
    .catch(() => cached)
    .finally(() => { pending = null; });

  return pending;
}

export function setSiteConfig(res) {
  const next = {
    name: (res?.name || DEFAULTS.name).trim(),
    logo: resolveLogo(res),
    favicon: resolveFavicon(res),
    supportEmail: (res?.supportEmail || DEFAULTS.supportEmail).trim(),
  };
  cached = next;
  writeCache(next);
  applyDomBranding(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tagoption:site-config"));
  }
  return next;
}

export function applyDomBranding(config) {
  if (typeof document === "undefined") return;
  try { document.title = config.name; } catch {}
  if (config.favicon) {
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = config.favicon;
  }
}
