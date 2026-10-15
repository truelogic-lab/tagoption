import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppTopBar from "./AppTopBar";
import AppBottomNav from "./AppBottomNav";
import Drawer from "./Drawer";
import InsufficientBalance from "./modals/InsufficientBalance";
import EntryScanner from "./modals/EntryScanner";
import NotificationsPanel from "./NotificationsPanel";
import CelebrationToast from "./CelebrationToast";
import { useAppStore } from "./useAppStore";
import { useNotifications } from "./useNotifications";
import { getSession } from "../../lib/auth";
import { useTheme } from "../../lib/useTheme";
import { usePayoutMultiplier } from "../../lib/usePayoutMultiplier";

export default function AppLayout() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [botResult, setBotResult] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  // Read the session reactively so AppTopBar always has the current user,
  // even right after login (getSession can be called before localStorage writes).
  const [sessionUser, setSessionUser] = useState(() => {
    const s = getSession();
    return { name: s?.user?.name ?? "", email: s?.user?.email ?? "" };
  });

  useEffect(() => {
    const sync = () => {
      const s = getSession();
      setSessionUser({
        name: s?.user?.name ?? "",
        email: s?.user?.email ?? "",
      });
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const store = useAppStore();
  const { balance, positions } = store;
  const { isDark, toggle: toggleTheme } = useTheme();
  const notif = useNotifications();
  usePayoutMultiplier();

  useEffect(() => { store.resumeStale(8000); }, []); // eslint-disable-line

  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      const tag = (t?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || t?.isContentEditable ||
        t?.closest?.("input, textarea, [contenteditable]");
      if (isEditable) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const handleManualPlace = (payload) => {
    if (balance < payload.stake) { setInsufficient(true); return; }
    store.placeTrade(payload);
    navigate("/positions");
  };

  const handleLoadBot = (result) => { setBotResult(result); navigate("/trade"); };
  const clearBotResult = () => setBotResult(null);

  return (
    <div className="app">
      <AppTopBar
        onMenu={() => setDrawerOpen(true)}
        balance={balance}
        onDeposit={() => navigate("/deposit")}
        onBell={() => { setNotifOpen(true); notif.refresh(); }}
        unreadCount={notif.unreadCount}
        user={sessionUser}
      />
      <main className="app__body">
        <Outlet
          context={{
            store, botResult, clearBotResult,
            onPlaceTrade: handleManualPlace,
            onOpenScanner: () => setScannerOpen(true),
          }}
        />
      </main>
      <AppBottomNav onAi={() => setScannerOpen(true)} positionCount={positions.length} />
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={sessionUser}
        darkTheme={isDark}
        onToggleDark={toggleTheme}
      />
      <InsufficientBalance
        open={insufficient}
        onClose={() => setInsufficient(false)}
        onDeposit={() => { setInsufficient(false); navigate("/deposit"); }}
      />
      <EntryScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onLoadBot={handleLoadBot} />
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        items={notif.items}
        unreadCount={notif.unreadCount}
        onMarkAllRead={notif.markAllRead}
        onMarkRead={notif.markRead}
        onClear={notif.clear}
      />
      <CelebrationToast />
    </div>
  );
}
