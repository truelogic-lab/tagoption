import React, { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import {
  LuMenu, LuShieldCheck, LuLayoutDashboard, LuUsers, LuActivity,
  LuDollarSign, LuListChecks, LuArrowLeft, LuLogOut, LuCoins, LuBanknote,
  LuSettings2, LuSlidersHorizontal, LuChevronDown, LuUser,
} from "react-icons/lu";
import { clearSession, getSession } from "../../lib/auth";
import { useSite } from "../../lib/SiteContext";
import GlobalSearch from "./GlobalSearch";
import AdminDrawer from "./AdminDrawer";

/**
 * Admin console shell.
 *
 * Desktop (>900px): sidebar on the left, no topbar.
 * Mobile (<=900px): topbar with burger, sidebar hidden behind a drawer.
 *
 * Palette lives entirely in the .adm block in admin.css — this file
 * references no color literals, only class names.
 */
const NAV = [
  { to: "/admin",              label: "Dashboard",    icon: LuLayoutDashboard, end: true },
  { to: "/admin/users",        label: "Users",        icon: LuUsers },
  { to: "/admin/markets",      label: "Markets",      icon: LuCoins },
  { to: "/admin/trades",       label: "Trades",       icon: LuActivity },
  { to: "/admin/withdrawals",  label: "Withdrawals",  icon: LuBanknote },
  { to: "/admin/transactions", label: "Transactions", icon: LuDollarSign },
  { to: "/admin/config",       label: "Config",       icon: LuSettings2 },
  { to: "/admin/settings",     label: "Settings",     icon: LuSlidersHorizontal },
  { to: "/admin/audit",        label: "Audit log",    icon: LuListChecks },
];

const TITLES = {
  "/admin":              "Dashboard",
  "/admin/users":        "Users",
  "/admin/markets":      "Markets",
  "/admin/trades":       "Trades",
  "/admin/withdrawals":  "Withdrawals",
  "/admin/transactions": "Transactions",
  "/admin/config":       "Config",
  "/admin/settings":     "Settings",
  "/admin/audit":        "Audit log",
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const site = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const s = getSession();
  const admin = {
    name: s?.user?.name ?? "",
    email: s?.user?.email ?? "",
  };
  const initial = (admin.name?.[0] || admin.email?.[0] || "A").toUpperCase();

  const title =
    TITLES[pathname] ||
    (pathname.startsWith("/admin/users/") ? "User detail" : "Admin");

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
    navigate("/auth");
  };

  // Close the profile dropdown when tapping outside it.
  useEffect(() => {
    const onDoc = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  return (
    <div className="adm">
      <aside className="adm__sidebar">
        <div className="adm__brand">
          <span className="adm__brand-badge">
            <LuShieldCheck />
          </span>
          <div className="adm__brand-text">
            <strong>{site.name}</strong>
            <em>Admin Console</em>
          </div>
        </div>

        <div className="adm__sidebar-search">
          <GlobalSearch />
        </div>

        <nav className="adm__nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `adm__nav-item ${isActive ? "is-active" : ""}`
              }
            >
              <n.icon /> <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="adm__side-foot">
          <NavLink to="/" className="adm__nav-item">
            <LuArrowLeft /> <span>Back to site</span>
          </NavLink>
          <button
            type="button"
            className="adm__nav-item adm__nav-item--danger"
            onClick={logout}
          >
            <LuLogOut /> <span>Log out</span>
          </button>
        </div>
      </aside>

      <header className="adm__top">
        <button
          className="adm__burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <LuMenu />
        </button>

        <span className="adm__top-title">{title}</span>

        <div className="adm__profile" ref={profileRef}>
          <button
            type="button"
            className="adm__profile-trigger"
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span className="adm__profile-avatar">{initial}</span>
            <span className="adm__profile-name">
              {admin.name || "Administrator"}
            </span>
            <LuChevronDown size={14} strokeWidth={2} />
          </button>

          {profileOpen && (
            <div className="adm__profile-menu" role="menu">
              <div className="adm__profile-menu-head">
                <strong>{admin.name || "Administrator"}</strong>
                <span>{admin.email || "—"}</span>
              </div>
              <NavLink
                to="/admin/settings"
                className="adm__profile-menu-item"
                onClick={() => setProfileOpen(false)}
              >
                <LuSettings2 size={16} strokeWidth={2} /> Settings
              </NavLink>
              <NavLink
                to="/account"
                className="adm__profile-menu-item"
                onClick={() => setProfileOpen(false)}
              >
                <LuUser size={16} strokeWidth={2} /> Your account
              </NavLink>
              <button
                type="button"
                className="adm__profile-menu-item adm__profile-menu-item--danger"
                onClick={logout}
              >
                <LuLogOut size={16} strokeWidth={2} /> Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <AdminDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        admin={admin}
        onLogout={logout}
      />

      <main className="adm__main">
        <Outlet />
      </main>
    </div>
  );
}
