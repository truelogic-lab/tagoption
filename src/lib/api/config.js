/**
 * API configuration.
 * Reads from Vite env vars. Never hardcode secrets here.
 *
 *   VITE_API_BASE         → e.g. https://api.tagoption.ke
 *   VITE_WS_URL           → optional realtime feed
 *   VITE_USE_LIVE         → "true" forces live even if base is set
 */

export const env = {
  apiBase: import.meta.env.VITE_API_BASE || "",
  wsUrl:   import.meta.env.VITE_WS_URL || "",
  useLive: import.meta.env.VITE_USE_LIVE === "true",
};

export const isLive = () => env.useLive && Boolean(env.apiBase);
