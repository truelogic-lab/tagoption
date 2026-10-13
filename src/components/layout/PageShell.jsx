import React from "react";
import Header from "../landing/Header";
import Footer from "../landing/Footer";
import Reveal from "../ui/Reveal";

export default function PageShell({ eyebrow, title, lead, children }) {
  return (
    <>
      <Header />
      <main className="page">
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
