import { env } from "./config";

const KEY = "tagoption.session";

function readSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
  catch { return null; }
}

function writeSession(session) {
  try { localStorage.setItem(KEY, JSON.stringify(session)); } catch {}
}

function clearSession() {
  try { localStorage.removeItem(KEY); } catch {}
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// One in-flight refresh at a time. Any 401 while it runs waits for the same
// promise, then retries. Two concurrent 401s must not fire two refreshes.
let refreshPromise = null;

async function refreshTokens() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const session = readSession();
    if (!session?.refresh) return null;

    const res = await fetch(`${env.apiBase}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: session.refresh }),
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    if (!data?.token) {
      clearSession();
      return null;
    }

    writeSession({
      ...session,
      token: data.token,
      refresh: data.refresh || session.refresh,
      user: data.user || session.user,
    });
    return data.token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function request(path, { method = "GET", body, headers = {}, retry = true } = {}) {
  const session = readSession();
  const token = session?.token;

  const res = await fetch(`${env.apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // One transparent refresh on 401. If the retried call also 401s, fall through
  // to the error path and let the caller decide (usually: redirect to /auth).
  if (res.status === 401 && retry && session?.refresh) {
    const newToken = await refreshTokens();
    if (newToken) {
      return request(path, { method, body, headers, retry: false });
    }
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

export const http = {
  get:   (path) => request(path),
  post:  (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del:   (path) => request(path, { method: "DELETE" }),
};
