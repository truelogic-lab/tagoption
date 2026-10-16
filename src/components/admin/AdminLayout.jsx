import React, { useState } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import {
  LuMenu, LuShieldCheck, LuLayoutDashboard, LuUsers, LuActivity,
  LuDollarSign, LuListChecks, LuArrowLeft, LuLogOut, LuCoins, LuBanknote,
  LuSettings2, LuSlidersHorizontal,
} from "react-icons/lu";
import { clearSession, getSession } from "../../lib/auth";
import GlobalSearch from "./GlobalSearch";
import AdminDrawer from "./AdminDrawer";
import { useSite } from "../../lib/SiteContext";
import AdminMetrics from "./AdminMetrics";

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

  const s = getSession();
  const admin = { name: s?.user?.name ?? "", email: s?.user?.email ?? "" };
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

  return (
    <div className="adm">
      <aside className="adm__sidebar">
        <div className="adm__brand">
          <span className="adm__brand-badge"><LuShieldCheck /></span>
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
          <NavLink to="/trade" className="adm__nav-item">
            <LuArrowLeft /> <span>Back to site</span>
          </NavLink>
          <button className="adm__nav-item adm__nav-item--danger" onClick={logout}>
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
        <GlobalSearch />
        <span className="adm__avatar">{initial}</span>
      </header>

      <AdminDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        admin={admin}
        onLogout={logout}
      />

      <main className="adm__main">
        <AdminMetrics />
        <Outlet />
      </main>
    </div>
  );
}
