import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuX, LuSettings, LuCircleArrowDown, LuCircleArrowUp,
  LuClock, LuGift, LuMoon, LuCircleHelp, LuShieldCheck, LuMessageCircle,
  LuLogOut, LuChevronRight,
} from "react-icons/lu";
import { clearSession } from "../../lib/auth";

const ICON_PROPS = { size: 20, strokeWidth: 2 };

const GROUPS = [
  {
    label: "Wallet",
    items: [
      { to: "/deposit",  label: "Deposit",    Icon: LuCircleArrowDown },
      { to: "/withdraw", label: "Withdraw",   Icon: LuCircleArrowUp },
      { to: "/history",  label: "History",    Icon: LuClock },
      { to: "/refer",    label: "Refer & Earn", Icon: LuGift },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/account", label: "Account settings", Icon: LuSettings },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/help",        label: "Help Centre",         Icon: LuCircleHelp },
      { to: "/responsible", label: "Responsible Trading", Icon: LuShieldCheck },
      { to: "/live-chat",   label: "Live Chat",           Icon: LuMessageCircle },
    ],
  },
];

export default function Drawer({ open, onClose, user, darkTheme, onToggleDark }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!open) return null;

  const go = (path) => { onClose(); navigate(path); };

  const logout = () => {
    clearSession();
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

  const initial =
    (user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || "").toUpperCase();

  return (
    <div className="drawer" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <span className="drawer__head-title">Menu</span>
          <button className="drawer__close" onClick={onClose} aria-label="Close">
            <LuX size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="drawer__profile">
          <div className="drawer__avatar" aria-hidden="true">
            {initial || <span className="drawer__avatar-dot" />}
          </div>
          <div className="drawer__profile-body">
            <strong>{user?.name || "Account"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>

        <nav className="drawer__nav">
          {GROUPS.map((group) => (
            <section key={group.label} className="drawer__group">
              <h4 className="drawer__group-label">{group.label}</h4>
              {group.items.map(({ to, label, Icon }) => {
                const active = pathname === to || pathname.startsWith(to + "/");
                return (
                  <button
                    key={to}
                    type="button"
                    className={`drawer__row ${active ? "is-active" : ""}`}
                    onClick={() => go(to)}
                  >
                    <Icon {...ICON_PROPS} />
                    <span className="drawer__row-label">{label}</span>
                    <LuChevronRight className="drawer__row-caret" size={18} strokeWidth={2} />
                  </button>
                );
              })}
            </section>
          ))}

          <section className="drawer__group">
            <h4 className="drawer__group-label">Preferences</h4>
            <div className="drawer__row drawer__row--static">
              <span className="drawer__row-label">
                <LuMoon {...ICON_PROPS} />
                <span>Dark theme</span>
              </span>
              <button
                type="button"
                className={`drawer__toggle ${darkTheme ? "is-on" : ""}`}
                onClick={onToggleDark}
                aria-label="Toggle dark theme"
                aria-pressed={darkTheme}
              />
            </div>
          </section>
        </nav>

        <footer className="drawer__foot">
          <button type="button" className="drawer__row drawer__row--danger" onClick={logout}>
            <LuLogOut {...ICON_PROPS} />
            <span className="drawer__row-label">Log out</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
