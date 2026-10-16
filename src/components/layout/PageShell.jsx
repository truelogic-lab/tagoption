import React from "react";
import { Link } from "react-router-dom";
import { LuChevronRight } from "react-icons/lu";
import Header from "../landing/Header";
import Footer from "../landing/Footer";
import Reveal from "../ui/Reveal";

/**
 * Chrome for public pages. Renders the site header and footer around the
 * page content, plus a breadcrumb so a user landing on /terms, /help, or
 * any page not in the top nav has a visible way back to Home.
 *
 * `breadcrumb` overrides the derived label. Pass a string, or null to
 * suppress the bar entirely (e.g. on a page that stands alone).
 */
export default function PageShell({
  eyebrow,
  title,
  lead,
  breadcrumb,
  children,
}) {
  const crumbLabel = breadcrumb !== undefined ? breadcrumb : (eyebrow || title || "Page");

  return (
    <>
      <Header />
      <main className="page">
        {crumbLabel && (
          <nav className="page__crumbs" aria-label="Breadcrumb">
            <div className="container">
              <ol className="page__crumbs-list">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li aria-hidden="true">
                  <LuChevronRight size={14} strokeWidth={2} />
                </li>
                <li aria-current="page">{crumbLabel}</li>
              </ol>
            </div>
          </nav>
        )}

        {(eyebrow || title || lead) && (
          <div className="page__intro">
            <div className="container">
              <div className="page__intro-inner">
                {eyebrow && <Reveal as="span" className="page__eyebrow">{eyebrow}</Reveal>}
                {title && <Reveal as="h1" delay={60} className="page__title">{title}</Reveal>}
                {lead && <Reveal as="p" delay={120} className="page__lead">{lead}</Reveal>}
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
      <Footer />
    </>
  );
}
