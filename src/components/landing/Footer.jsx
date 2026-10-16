import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";
import BrandMark from "../ui/BrandMark";
import { useSite } from "../../lib/SiteContext";

/**
 * Footer. Only links that resolve to a real page. The previous version had
 * a Company column where four of five entries pointed at /company, and five
 * social icons with href="#" — both removed until there are real targets.
 */
const columns = [
  {
    title: "Platform",
    links: [
      { label: "Markets", to: "/markets" },
      { label: "Company", to: "/company" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center",         to: "/help" },
      { label: "Terms of Service",    to: "/terms" },
      { label: "Privacy Policy",      to: "/privacy" },
      { label: "Responsible Trading", to: "/responsible" },
      { label: "Contact Support",     to: "/live-chat" },
    ],
  },
];

export default function Footer() {
  const site = useSite();

  return (
    <footer className="footer">
      <div className="container">
        <Reveal className="footer__grid footer__grid--two">
          <div className="footer__brand">
            <div className="footer__logo">
              <BrandMark variant="footer" />
            </div>
            <p className="footer__desc">
              A modern trading experience focused on market access, useful tools,
              and transparent information.
            </p>
          </div>

          {columns.map((col) => (
            <div className="footer__col" key={col.title}>
              <h4 className="footer__title">{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>
            Trading involves risk. You may lose some or all of your trading stake.
            Never trade money you cannot afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
}
