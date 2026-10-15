import React, { createContext, useContext, useEffect, useState } from "react";
import { getSiteConfig, loadSiteConfig } from "./siteConfig";

/**
 * Provides the current site branding. Seeded from the synchronous cache so
 * the first render is correct — no flash of the default name.
 */
const Ctx = createContext(getSiteConfig());

export function SiteProvider({ children }) {
  const [config, setConfig] = useState(getSiteConfig());

  useEffect(() => {
    let cancelled = false;

    // The load function dispatches `tagoption:site-config` when it settles
    // (and when admin saves a change). One listener handles both cases.
    const sync = () => setConfig(getSiteConfig());
    window.addEventListener("tagoption:site-config", sync);

    loadSiteConfig().then(() => {
      if (!cancelled) sync();
    });

    return () => {
      cancelled = true;
      window.removeEventListener("tagoption:site-config", sync);
    };
  }, []);

  return <Ctx.Provider value={config}>{children}</Ctx.Provider>;
}

export function useSite() {
  return useContext(Ctx);
}
