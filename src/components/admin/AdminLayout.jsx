import React, { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import {
  LuMenu, LuX, LuShieldCheck, LuChartLine, LuUsers, LuActivity,
  LuDollarSign, LuClock, LuListChecks, LuLogOut, LuArrowLeft,
} from "react-icons/lu";
import { clearSession } from "../../lib/auth";
import { getSession } from "../../lib/auth";

const NAV = [
  { id: "overview",      label: "Overview",      icon: LuChartLine },
  { id: "users",         label: "Users",         icon: LuUsers },
  { id: "trades",        label: "Trades",        icon: LuActivity },
  { id: "transactions",  label: "Transactions",  icon: LuDollarSign },
  { id: "audit",         label: "Audit log",     icon: LuListChecks },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const admin = (() => {
    const s = getSession();
    return { name: s?.user?.name ?? "", email: s?.user?.email ?? "" };
  })();

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
    <div className="admlayout">
      <header className="adm-top">
        <button
          className="adm-top__burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <LuMenu />
        </button>

        <Link to="/admin" className="adm-top__brand">
          <span className="adm-top__brand-badge">
            <LuShieldCheck />
          </span>
          <span className="adm-top__brand-text">
            TagOption <em>Admin</em>
          </span>
        </Link>

        <div className="adm-top__right">
          <span className="adm-top__avatar">{initial}</span>
        </div>
      </header>

      {menuOpen && (
        <div className="adm-drawer" onClick={() => setMenuOpen(false)}>
          <div className="adm-drawer__panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer__top">
              <button
                className="adm-drawer__close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
                <LuX />
              </button>
              <span className="adm-drawer__title">Admin menu</span>
            </div>

            <div className="adm-drawer__user">
              <div className="adm-drawer__avatar">{initial}</div>
              <div>
                <strong>{admin.name || "Administrator"}</strong>
                <span>{admin.email}</span>
              </div>
            </div>

            <nav className="adm-drawer__nav">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  className="adm-drawer__row"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/admin/${n.id}`);
                  }}
                >
                  <n.icon /> {n.label}
                </button>
              ))}

              <div className="adm-drawer__divider" />

              <Link
                to="/trade"
                className="adm-drawer__row"
                onClick={() => setMenuOpen(false)}
              >
                <LuArrowLeft /> Back to site
              </Link>

              <button className="adm-drawer__row adm-drawer__row--danger" onClick={logout}>
                <LuLogOut /> Log out
              </button>
            </nav>

            <div className="adm-drawer__foot">
              {new Date().toISOString().slice(0, 19).replace("T", " ")} GMT
            </div>
          </div>
        </div>
      )}

      <main className="adm-body">
        <Outlet />
      </main>
    </div>
  );
}
