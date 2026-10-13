import { env } from "./config";

function getToken() {
  try {
    const raw = localStorage.getItem("tagoption.session");
    if (!raw) return null;
    return JSON.parse(raw)?.token || null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function request(path, { method = "GET", body, headers = {} } = {}) {
  const token = getToken();

  const res = await fetch(`${env.apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
