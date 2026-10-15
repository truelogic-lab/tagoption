import React, { useEffect, useState } from "react";
import {
  LuMenu, LuChevronDown, LuVolume2, LuVolumeX, LuBell,
} from "react-icons/lu";
import { isSoundEnabled, setSoundEnabled } from "../../lib/sound";

export default function AppTopBar({
  onMenu, balance, onDeposit, onBell, unreadCount = 0, user,
}) {
  const initial = (user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || "").toUpperCase();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  // Sync when another surface (drawer, admin) toggles sound.
  useEffect(() => {
    const sync = () => setSoundOn(isSoundEnabled());
    window.addEventListener("tagoption:sound", sync);
    return () => window.removeEventListener("tagoption:sound", sync);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <header className="topbar">
      <button className="topbar__icon" onClick={onMenu} aria-label="Open menu">
        <LuMenu />
        <span className="topbar__dot" />
      </button>

      <button className="topbar__wallet" onClick={onDeposit}>
        <span className="topbar__wallet-badge">
          {initial || <span className="topbar__wallet-dot" />}
        </span>
        <span className="topbar__wallet-amount">
          ${Number(balance || 0).toFixed(2)}
        </span>
        <LuChevronDown className="topbar__wallet-caret" />
      </button>

      <div className="topbar__right">
        <button
          className={`topbar__icon ${soundOn ? "is-on" : "is-off"}`}
          onClick={toggleSound}
          aria-label={soundOn ? "Mute sound effects" : "Unmute sound effects"}
          aria-pressed={soundOn}
        >
          {soundOn ? <LuVolume2 /> : <LuVolumeX />}
        </button>

        <button className="btn btn-blue topbar__deposit" onClick={onDeposit}>
          Deposit
        </button>

        <button className="topbar__icon" aria-label="Alerts" onClick={onBell}>
          <LuBell />
          {unreadCount > 0 && (
            <span className="topbar__badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
