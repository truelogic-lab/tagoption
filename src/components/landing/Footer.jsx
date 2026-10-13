import React from "react";
import { Link } from "react-router-dom";
import {
  LuFacebook, LuTwitter, LuInstagram, LuLinkedin, LuSend,
} from "react-icons/lu";
import Reveal from "../ui/Reveal";

const columns = [
  {
    title: "Markets",
    links: [
      { label: "Volatility Indices", to: "/online-trading" },
      { label: "Boom & Crash",       to: "/online-trading" },
      { label: "Step Index",         to: "/online-trading" },
      { label: "Range Break",        to: "/online-trading" },
      { label: "Jump Index",         to: "/online-trading" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/company" },
      { label: "Careers",  to: "/company" },
      { label: "Blog",     to: "/company" },
      { label: "Press",    to: "/company" },
      { label: "Contact",  to: "/company" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center",          to: "/help" },
      { label: "Terms of Service",     to: "/terms" },
      { label: "Privacy Policy",       to: "/privacy" },
      { label: "Responsible Trading",  to: "/responsible" },
      { label: "Contact Support",      to: "/live-chat" },
    ],
  },
];

const socials = [
  { Icon: LuFacebook,  label: "Facebook" },
  { Icon: LuTwitter,   label: "Twitter" },
  { Icon: LuInstagram, label: "Instagram" },
  { Icon: LuLinkedin,  label: "LinkedIn" },
  { Icon: LuSend,      label: "Telegram" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <Reveal className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-badge">T</span>
              <span className="footer__logo-text">TAGOPTION</span>
            </div>
            <p className="footer__desc">
              A modern trading experience focused on market access, useful tools,
              and transparent information.
            </p>
            <div className="footer__socials">
              {socials.map(({ Icon, label }) => (
                <a href="#" key={label} aria-label={label}><Icon /></a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div className="footer__col" key={col.title}>
              <h4 className="footer__title">{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>

        <div className="footer__bottom">
          <p>© 2026 TagOption. All rights reserved.</p>
          <p>
            Trading involves risk. You may lose some or all of your trading stake.
            Never trade money you cannot afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
}
