import { http } from "./api";

export const DEFAULTS = {
  name: "TagOption",
  logo: "",
  favicon: "",
  supportEmail: "support@tagoption.ke",
};

let cached = null;
let pending = null;

function resolveLogo(res) {
  return (res?.logoData || res?.logoUrl || "").trim();
}
function resolveFavicon(res) {
  return (res?.faviconData || res?.faviconUrl || "").trim();
}

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
        logo: resolveLogo(res),
        favicon: resolveFavicon(res),
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
    .finally(() => { pending = null; });

  return pending;
}

export function setSiteConfig(res) {
  cached = {
    name: (res?.name || DEFAULTS.name).trim(),
    logo: resolveLogo(res),
    favicon: resolveFavicon(res),
    supportEmail: (res?.supportEmail || DEFAULTS.supportEmail).trim(),
  };
  applyDomBranding(cached);
  return cached;
}

export function applyDomBranding(config) {
  if (typeof document === "undefined") return;
  try { document.title = config.name; } catch {}
  if (config.favicon) {
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = config.favicon;
  }
}
