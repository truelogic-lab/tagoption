import { http } from "./api";

/**
 * /config is a small, global value that changes rarely. Fetch once per
 * session and share the promise — Trade.jsx, usePayoutMultiplier, and any
 * future consumer all resolve against the same request.
 */
let cached = null;

export function loadConfig() {
  if (!cached) {
    cached = http
      .get("/config")
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

export function resetConfigCache() {
  cached = null;
}
