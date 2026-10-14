import React, { useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import {
  LuMenu, LuX, LuShieldCheck, LuLayoutDashboard, LuUsers, LuActivity,
  LuDollarSign, LuListChecks, LuArrowLeft, LuLogOut,
} from "react-icons/lu";
import { clearSession, getSession } from "../../lib/auth";

const NAV = [
  { to: "/admin",             label: "Dashboard",    icon: LuLayoutDashboard, end: true },
  { to: "/admin/users",       label: "Users",        icon: LuUsers },
  { to: "/admin/trades",      label: "Trades",       icon: LuActivity },
  { to: "/admin/transactions",label: "Transactions", icon: LuDollarSign },
  { to: "/admin/audit",       label: "Audit log",    icon: LuListChecks },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const s = getSession();
  const admin = { name: s?.user?.name ?? "", email: s?.user?.email ?? "" };
  const initial = (admin.name?.[0] || admin.email?.[0] || "A").toUpperCase();

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
      {/* Sidebar — desktop */}
      <aside className="adm__sidebar">
        <div className="adm__brand">
          <span className="adm__brand-badge">
            <LuShieldCheck />
          </span>
          <div className="adm__brand-text">
            <strong>TagOption</strong>
            <em>Admin Console</em>
          </div>
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
              <n.icon /> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="adm__side-foot">
          <NavLink to="/trade" className="adm__nav-item">
            <LuArrowLeft /> Back to site
          </NavLink>
          <button className="adm__nav-item adm__nav-item--danger" onClick={logout}>
            <LuLogOut /> Log out
          </button>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="adm__top">
        <button
          className="adm__burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <LuMenu />
        </button>
        <span className="adm__top-title">Dashboard</span>
        <span className="adm__avatar">{initial}</span>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="adm__drawer" onClick={() => setMenuOpen(false)}>
          <div className="adm__drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm__drawer-top">
              <button className="adm__drawer-close" onClick={() => setMenuOpen(false)}>
                <LuX />
              </button>
              <span>Menu</span>
            </div>

            <div className="adm__drawer-user">
              <div className="adm__drawer-avatar">{initial}</div>
              <div>
                <strong>{admin.name || "Administrator"}</strong>
                <span>{admin.email}</span>
              </div>
            </div>

            <nav className="adm__drawer-nav">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `adm__nav-item ${isActive ? "is-active" : ""}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <n.icon /> {n.label}
                </NavLink>
              ))}
              <div className="adm__divider" />
              <NavLink to="/trade" className="adm__nav-item" onClick={() => setMenuOpen(false)}>
                <LuArrowLeft /> Back to site
              </NavLink>
              <button className="adm__nav-item adm__nav-item--danger" onClick={logout}>
                <LuLogOut /> Log out
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="adm__main">
        <Outlet />
      </main>
    </div>
  );
}
