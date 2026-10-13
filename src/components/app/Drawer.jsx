import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LuX, LuSettings, LuCircleArrowDown, LuCircleArrowUp,
  LuClock, LuGift, LuMoon, LuCircleHelp, LuShieldCheck, LuMessageCircle,
  LuLogOut, LuChevronRight,
} from "react-icons/lu";
import { clearSession } from "../../lib/auth";

export default function Drawer({ open, onClose, user, darkTheme, onToggleDark }) {
  const navigate = useNavigate();

  if (!open) return null;

  const go = (path) => { onClose(); navigate(path); };
  const logout = () => {
    clearSession();
    // Purge per-user local caches so the next account starts fresh
    try {
      Object.keys(localStorage)
        .filter((k) =>
          k.startsWith("tagoption.notifications.") ||
          k.startsWith("tagoption.store.") ||
          k.startsWith("tagoption.seenTrades.")
        )
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    onClose();
    navigate("/");
  };

  return (
    <div className="drawer" onClick={onClose}>
      <div className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__top">
          <button className="drawer__close" onClick={onClose} aria-label="Close"><LuX /></button>
          <span className="drawer__title">Menu</span>
          <span className="drawer__lang">🇬🇧 EN</span>
        </div>

        <div className="drawer__user">
          <div className="drawer__avatar">{user?.avatarLetter ?? "?"}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav className="drawer__nav">
          <button className="drawer__row" onClick={() => go("/account")}>
            <span><LuSettings /> Account settings</span>
            <LuChevronRight className="drawer__row-caret" />
          </button>
          <button className="drawer__row" onClick={() => go("/deposit")}>
            <LuCircleArrowDown /> Deposit <LuChevronRight className="drawer__row-caret" />
          </button>
          <button className="drawer__row" onClick={() => go("/withdraw")}>
            <LuCircleArrowUp /> Withdraw <LuChevronRight className="drawer__row-caret" />
          </button>
          <button className="drawer__row" onClick={() => go("/history")}>
            <LuClock /> History <LuChevronRight className="drawer__row-caret" />
          </button>
          <button className="drawer__row drawer__row--accent" onClick={() => go("/refer")}>
            <LuGift /> Refer &amp; Earn
          </button>

          <div className="drawer__divider" />

          <div className="drawer__row drawer__row--static">
            <span><LuMoon /> Dark theme</span>
            <button
              className={`drawer__toggle ${darkTheme ? "is-on" : ""}`}
              onClick={onToggleDark}
              aria-label="Toggle dark theme"
            />
          </div>

          <button className="drawer__row" onClick={() => go("/help")}>
            <LuCircleHelp /> Help Centre
          </button>
          <button className="drawer__row" onClick={() => go("/responsible")}>
            <LuShieldCheck /> Responsible Trading
          </button>
          <button className="drawer__row" onClick={() => go("/live-chat")}>
            <LuMessageCircle /> Live Chat
          </button>

          <div className="drawer__divider" />

          <button className="drawer__row drawer__row--danger" onClick={logout}>
            <LuLogOut /> Log out
          </button>
        </nav>

        <div className="drawer__foot">
          {new Date().toISOString().slice(0, 19).replace("T", " ")} GMT
          <span className="drawer__foot-dot" />
        </div>
      </div>
    </div>
  );
}
