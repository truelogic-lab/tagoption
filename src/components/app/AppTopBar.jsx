import React from "react";
import { LuMenu, LuChevronDown, LuVolume2, LuBell } from "react-icons/lu";

export default function AppTopBar({
  onMenu, balance, onDeposit, onBell, unreadCount = 0, user,
}) {
  const initial = (user?.avatarLetter || user?.name?.[0] || "T").toUpperCase();

  return (
    <header className="topbar">
      <button className="topbar__icon" onClick={onMenu} aria-label="Open menu">
        <LuMenu />
        <span className="topbar__dot" />
      </button>

      <button className="topbar__wallet" onClick={onDeposit}>
        <span className="topbar__wallet-badge">{initial}</span>
        <span className="topbar__wallet-amount">${balance.toFixed(2)}</span>
        <LuChevronDown className="topbar__wallet-caret" />
      </button>

      <div className="topbar__right">
        <button className="topbar__icon" aria-label="Sound"><LuVolume2 /></button>
        <button className="btn btn-blue topbar__deposit" onClick={onDeposit}>Deposit</button>
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
