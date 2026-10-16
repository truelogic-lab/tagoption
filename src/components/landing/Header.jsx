import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LuMenu, LuX, LuUser, LuLayoutDashboard,
} from "react-icons/lu";
import { useAuth } from "../../lib/useAuth";
import BrandMark from "../ui/BrandMark";

/**
 * Public nav. Two items only — every other label in the previous version
 * pointed at a page that doesn't exist. Add items back as their
 * destinations ship, not before.
 */
const NAV = [
  { label: "Markets", to: "/markets" },
  { label: "Company", to: "/company" },
];

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Same anti-long-press behaviour as the app shell
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      const tag = (t?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        t?.isContentEditable ||
        t?.closest?.("input, textarea, [contenteditable]");
      if (isEditable) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const closeAll = () => setMenuOpen(false);

  return (
    <>
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="header__logo" onClick={closeAll}>
            <BrandMark variant="header" />
          </Link>

          <nav className="header__nav">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="header__nav-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            {isAuthenticated ? (
              <>
                <Link to="/trade" className="header__login">
                  <LuLayoutDashboard /> Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="header__login">
                  <LuUser /> Login
                </Link>
              </>
            )}

            <button
              className="header__burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <LuMenu />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile">
          <div className="mobile__top">
            <Link to="/" className="header__logo" onClick={closeAll}>
              <BrandMark variant="header" />
            </Link>
            <button
              className="mobile__close"
              onClick={closeAll}
              aria-label="Close menu"
            >
              <LuX />
            </button>
          </div>

          <div className="mobile__body">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="mobile__link"
                onClick={closeAll}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mobile__actions">
            {isAuthenticated ? (
              <>
                <Link to="/trade" className="btn btn-ghost" onClick={closeAll}>
                  Dashboard
                </Link>
                <Link to="/trade" className="btn btn-primary" onClick={closeAll}>
                  Open Trade
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-ghost" onClick={closeAll}>
                  Login
                </Link>
                <Link to="/auth" className="btn btn-primary" onClick={closeAll}>
                  Start Trading
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
