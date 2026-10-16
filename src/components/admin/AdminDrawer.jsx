import React, { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LuX, LuLayoutDashboard, LuUsers, LuCoins, LuActivity, LuBanknote,
  LuDollarSign, LuSettings2, LuSlidersHorizontal, LuListChecks,
  LuArrowLeft, LuLogOut,
} from "react-icons/lu";

/**
 * Mobile admin navigation drawer.
 *
 * Shown only when the layout's burger button opens it. Slides in from
 * the left, dims the page behind, closes on overlay click, Escape, or
 * navigating to a new page.
 *
 * Sizes and colours come entirely from .adm-drawer* rules in admin.css.
 * The layout keeps the tablet/desktop sidebar; this is phone-only.
 */
const NAV = [
  { to: "/admin",              label: "Dashboard",    Icon: LuLayoutDashboard, end: true },
  { to: "/admin/users",        label: "Users",        Icon: LuUsers },
  { to: "/admin/markets",      label: "Markets",      Icon: LuCoins },
  { to: "/admin/trades",       label: "Trades",       Icon: LuActivity },
  { to: "/admin/withdrawals",  label: "Withdrawals",  Icon: LuBanknote },
  { to: "/admin/transactions", label: "Transactions", Icon: LuDollarSign },
  { to: "/admin/config",       label: "Config",       Icon: LuSettings2 },
  { to: "/admin/settings",     label: "Settings",     Icon: LuSlidersHorizontal },
  { to: "/admin/audit",        label: "Audit log",    Icon: LuListChecks },
];

const ICON_SIZE = 20;
const ICON_STROKE = 2;

export default function AdminDrawer({ open, onClose, admin, onLogout }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Escape closes; body scroll is locked while open so the page behind
  // doesn't scroll under the overlay. Focus moves into the panel on open.
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const initial = (admin.name?.[0] || admin.email?.[0] || "A").toUpperCase();

  const go = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <div
      className="adm-drawer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Admin navigation"
    >
      <div
        className="adm-drawer__panel"
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="adm-drawer__head">
          <button
            type="button"
            className="adm-drawer__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <LuX size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
          <span className="adm-drawer__title">Menu</span>
        </header>

        <section className="adm-drawer__user">
          <div className="adm-drawer__avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="adm-drawer__user-body">
            <strong>{admin.name || "Administrator"}</strong>
            <span>{admin.email || "—"}</span>
          </div>
        </section>

        <nav className="adm-drawer__nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `adm-drawer__item ${isActive ? "is-active" : ""}`
              }
              onClick={() => onClose()}
            >
              <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <footer className="adm-drawer__foot">
          <button
            type="button"
            className="adm-drawer__item"
            onClick={() => go("/")}
          >
            <LuArrowLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            <span>Back to site</span>
          </button>
          <button
            type="button"
            className="adm-drawer__item adm-drawer__item--danger"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LuLogOut size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            <span>Log out</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
