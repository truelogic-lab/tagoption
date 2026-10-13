import { useCallback, useEffect, useRef, useState } from "react";
import { isLive, notificationsApi } from "../../lib/api";

/**
 * Notifications — server-authoritative when the API is live.
 * Falls back to localStorage only when running offline (dev without a backend).
 */

const KEY_PREFIX = "tagoption.notifications.";
const POLL_MS = 20000;

function sessionEmail() {
  try {
    const raw = localStorage.getItem("tagoption.session");
    if (!raw) return "anon";
    return JSON.parse(raw)?.user?.email || "anon";
  } catch { return "anon"; }
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function writeLocal(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(0, 100))); } catch {}
}

export function useNotifications() {
  const [key] = useState(() => `${KEY_PREFIX}${sessionEmail()}`);
  const [items, setItems] = useState(() => readLocal(key));
  const pollRef = useRef(null);

  // Keep local mirror for the offline case
  useEffect(() => {
    if (!isLive()) writeLocal(key, items);
  }, [key, items, items.length]);

  const refresh = useCallback(async () => {
    if (!isLive()) return;
    try {
      const list = await notificationsApi.list();
      setItems(Array.isArray(list) ? list : []);
    } catch {
      // silent
    }
  }, []);

  // Initial fetch + light polling
  useEffect(() => {
    if (!isLive()) return;
    refresh();
    pollRef.current = setInterval(refresh, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  const unreadCount = items.filter((n) => !n.read).length;

  const push = useCallback(async (n) => {
    // Server pushes happen automatically on the backend — this is only for
    // local-only mode. When live, calling push just refreshes.
    if (isLive()) {
      await refresh();
      return;
    }
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((list) => [{ id, at: new Date().toISOString(), read: false, ...n }, ...list]);
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    // Optimistic
    setItems((list) => list.map((n) => (n.read ? n : { ...n, read: true })));
    if (isLive()) {
      try { await notificationsApi.markAllRead(); } catch { refresh(); }
    }
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (isLive()) {
      try { await notificationsApi.markRead(id); } catch { refresh(); }
    }
  }, [refresh]);

  const remove = useCallback((id) => {
    setItems((list) => list.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(async () => {
    setItems([]);
    if (isLive()) {
      try { await notificationsApi.clear(); } catch { refresh(); }
    }
  }, [refresh]);

  return { items, unreadCount, push, markAllRead, markRead, remove, clear, refresh };
}
