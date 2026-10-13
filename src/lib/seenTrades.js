/**
 * Tracks trade ids the client has already shown a toast for.
 * Persisted per-user in localStorage so a page navigation doesn't re-fire.
 */

const KEY_PREFIX = "tagoption.seenTrades.";

function sessionEmail() {
  try {
    const raw = localStorage.getItem("tagoption.session");
    if (!raw) return "anon";
    return JSON.parse(raw)?.user?.email || "anon";
  } catch { return "anon"; }
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function write(key, set) {
  try {
    // Keep the last 500 ids to prevent unbounded growth
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

export function hasSeen(tradeId) {
  return read(`${KEY_PREFIX}${sessionEmail()}`).has(tradeId);
}

export function markSeen(tradeId) {
  const key = `${KEY_PREFIX}${sessionEmail()}`;
  const set = read(key);
  set.add(tradeId);
  write(key, set);
}

export function clearSeen() {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${sessionEmail()}`);
  } catch {}
}
