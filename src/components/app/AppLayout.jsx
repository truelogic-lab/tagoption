import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppTopBar from "./AppTopBar";
import AppBottomNav from "./AppBottomNav";
import Drawer from "./Drawer";
import WalletModal from "./modals/WalletModal";
import InsufficientBalance from "./modals/InsufficientBalance";
import EntryScanner from "./modals/EntryScanner";
import NotificationsPanel from "./NotificationsPanel";
import CelebrationToast from "./CelebrationToast";
import { useAppStore } from "./useAppStore";
import { useNotifications } from "./useNotifications";
import { getSession } from "../../lib/auth";
import { useTheme } from "../../lib/useTheme";
import { celebrateDeposit, celebrateWithdraw } from "../../lib/celebrate";

export default function AppLayout() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [botResult, setBotResult] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const store = useAppStore();
  const { balance, positions } = store;
  const { isDark, toggle: toggleTheme } = useTheme();
  const notif = useNotifications();

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

  const user = useMemo(() => {
    const s = getSession();
    return {
      name: s?.user?.name ?? "",
      email: s?.user?.email ?? "",
    };
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
        onDeposit={() => setWallet("deposit")}
        onBell={() => { setNotifOpen(true); notif.refresh(); }}
        unreadCount={notif.unreadCount}
      />
      <main className="app__body">
        <Outlet
          context={{
            store, botResult, clearBotResult,
            onPlaceTrade: handleManualPlace,
            onOpenWallet: setWallet,
            onOpenScanner: () => setScannerOpen(true),
          }}
        />
      </main>
      <AppBottomNav onAi={() => setScannerOpen(true)} positionCount={positions.length} />
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        darkTheme={isDark}
        onToggleDark={toggleTheme}
      />
      <WalletModal
        open={wallet !== null}
        mode={wallet || "deposit"}
        balance={balance}
        onClose={() => setWallet(null)}
        onCompleted={() => store.refresh()}
      />
      <InsufficientBalance
        open={insufficient}
        onClose={() => setInsufficient(false)}
        onDeposit={() => { setInsufficient(false); setWallet("deposit"); }}
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
