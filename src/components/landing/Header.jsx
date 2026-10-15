import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuMenu, LuX, LuChevronDown, LuUser, LuGlobe, LuLayoutDashboard } from "react-icons/lu";
import { useAuth } from "../../lib/useAuth";
import BrandMark from "../ui/BrandMark";

const NAV = [
  { label: "Online Trading", to: "/online-trading",
    items: [
      { label: "Volatility Indices", to: "/online-trading" },
      { label: "Boom & Crash", to: "/online-trading" },
      { label: "Step Index", to: "/online-trading" },
      { label: "Range Break", to: "/online-trading" },
      { label: "Jump Indices", to: "/online-trading" },
    ]},
  { label: "Markets", to: "/markets",
    items: [
      { label: "Live Prices", to: "/markets" },
      { label: "Market News", to: "/markets" },
      { label: "Economic Calendar", to: "/markets" },
    ]},
  { label: "Tools", to: "/tools",
    items: [
      { label: "AI Entry Scanner", to: "/tools" },
      { label: "Technical Analysis", to: "/tools" },
      { label: "Payout Calculator", to: "/tools" },
      { label: "Trading Signals", to: "/tools" },
    ]},
  { label: "Company", to: "/company",
    items: [
      { label: "About Us", to: "/company" },
      { label: "Careers", to: "/company" },
      { label: "Blog", to: "/company" },
      { label: "Contact", to: "/company" },
    ]},
];

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

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

  const closeAll = () => { setMenuOpen(false); setOpenGroup(null); setHovered(null); };

  return (
    <>
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="header__logo" onClick={closeAll}>
            <BrandMark variant="header" />
          </Link>

          <nav className="header__nav">
            {NAV.map((group) => (
              <div
                key={group.label}
                className="header__nav-item"
                onMouseEnter={() => setHovered(group.label)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link to={group.to} className="header__nav-link">
                  {group.label}
                  <LuChevronDown className="header__caret" />
                </Link>
                {hovered === group.label && (
                  <div className="header__dropdown">
                    {group.items.map((item) => (
                      <Link key={item.label} to={item.to}>{item.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="header__actions">
            <button className="header__icon-btn" aria-label="Language"><LuGlobe /></button>

            {isAuthenticated ? (
              <>
                <Link to="/trade" className="header__login"><LuLayoutDashboard /> Dashboard</Link>
                <Link to="/trade" className="btn btn-primary header__cta">Open Trade</Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="header__login"><LuUser /> Login</Link>
                <Link to="/auth" className="btn btn-primary header__cta">Start Trading</Link>
              </>
            )}

            <button className="header__burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
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
            <button className="mobile__close" onClick={closeAll} aria-label="Close menu">
              <LuX />
            </button>
          </div>

          <div className="mobile__body">
            {NAV.map((group) => (
              <div key={group.label} className="mobile__group">
                <button
                  className="mobile__trigger"
                  onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                >
                  <span>{group.label}</span>
                  <LuChevronDown className={`mobile__caret ${openGroup === group.label ? "is-open" : ""}`} />
                </button>
                {openGroup === group.label && (
                  <div className="mobile__sub">
                    {group.items.map((item) => (
                      <Link key={item.label} to={item.to} onClick={closeAll}>{item.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mobile__actions">
            {isAuthenticated ? (
              <>
                <Link to="/trade" className="btn btn-ghost" onClick={closeAll}>Dashboard</Link>
                <Link to="/trade" className="btn btn-primary" onClick={closeAll}>Open Trade</Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-ghost" onClick={closeAll}>Login</Link>
                <Link to="/auth" className="btn btn-primary" onClick={closeAll}>Start Trading</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
