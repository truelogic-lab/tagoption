import React from "react";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import Reveal from "../components/ui/Reveal";
import ScannerPanel from "../components/ai/scanner/ScannerPanel";
import FeatureGrid from "../components/ai/FeatureGrid";

export default function Ai() {
  return (
    <>
      <Header />
      <main className="page ai-page">
        <div className="page__intro">
          <div className="container">
            <div className="page__intro-inner">
              <Reveal as="span" className="page__eyebrow">AI</Reveal>
              <Reveal as="h1" delay={60} className="page__title">
                Let the scanner do the <span className="accent">watching</span>.
              </Reveal>
              <Reveal as="p" delay={120} className="page__lead">
                The Entry Scanner reads every supported market in the background,
                ranks them by activity, and flags the ones worth a closer look.
                You still make the call — the scanner just narrows the field.
              </Reveal>
            </div>
          </div>
        </div>

        <section className="page__section">
          <div className="container">
            <Reveal>
              <ScannerPanel />
            </Reveal>
          </div>
        </section>

        <section className="page__section">
          <div className="container">
            <Reveal className="page__section-head">
              <h2 className="page__section-title">What the scanner looks at</h2>
              <p className="page__section-sub">
                Four signals feed into every result. Each one is measurable —
                nothing here is a black box.
              </p>
            </Reveal>

            <FeatureGrid />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
