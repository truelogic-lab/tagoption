import { isLive, authApi } from "./api";

const KEY = "tagoption.session";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
  catch { return null; }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function isAuthenticated() {
  return Boolean(getSession());
}

export async function signIn({ email, password }) {
  if (isLive()) {
    const session = await authApi.login({ email, password });
    setSession(session);
    return session;
  }
  await wait(400);
  if (!email || !password) throw new Error("Email and password are required");
  const session = { token: "stub-token", user: { name: email.split("@")[0], email } };
  setSession(session);
  return session;
}

export async function signUp({ name, email, password }) {
  if (isLive()) {
    const session = await authApi.signup({ name, email, password });
    setSession(session);
    return session;
  }
  await wait(400);
  if (!name || !email || !password) throw new Error("All fields are required");
  const session = { token: "stub-token", user: { name, email } };
  setSession(session);
  return session;
}
