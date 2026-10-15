import React, { createContext, useContext, useEffect, useState } from "react";
import { getSiteConfig, loadSiteConfig } from "./siteConfig";

const Ctx = createContext(getSiteConfig());

export function SiteProvider({ children }) {
  const [config, setConfig] = useState(getSiteConfig());

  useEffect(() => {
    let cancelled = false;
    loadSiteConfig().then((c) => {
      if (!cancelled) setConfig(c);
    });

    // The admin Settings page dispatches this after a save so every consumer
    // re-renders without a full reload.
    const onUpdate = () => setConfig(getSiteConfig());
    window.addEventListener("tagoption:site-config", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("tagoption:site-config", onUpdate);
    };
  }, []);

  return <Ctx.Provider value={config}>{children}</Ctx.Provider>;
}

export function useSite() {
  return useContext(Ctx);
}
