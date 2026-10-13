import { useCallback, useEffect, useRef, useState } from "react";
import { isLive, notificationsApi } from "../../lib/api";

const KEY_PREFIX = "tagoption.notifications.";
const POLL_MS = 15000;

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

  useEffect(() => {
    if (!isLive()) writeLocal(key, items);
  }, [key, items]);

  const refresh = useCallback(async () => {
    if (!isLive()) return;
    try {
      const list = await notificationsApi.list();
      setItems(Array.isArray(list) ? list : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLive()) return;
    refresh();
    pollRef.current = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const unreadCount = items.filter((n) => !n.read).length;

  const push = useCallback(async (n) => {
    if (isLive()) {
      await refresh();
      return;
    }
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((list) => [{ id, at: new Date().toISOString(), read: false, ...n }, ...list]);
  }, [refresh]);

  const markAllRead = useCallback(async () => {
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
