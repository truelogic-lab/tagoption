import React from "react";
import {
  LuBot, LuChartLine, LuCalculator, LuRadio, LuBell, LuFileText,
} from "react-icons/lu";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";

const tools = [
  { Icon: LuBot, title: "AI Entry Scanner", desc: "Watches every index and highlights the ones with the most interesting pattern right now. You still decide." },
  { Icon: LuChartLine, title: "Technical Analysis", desc: "Read price action on any market with trend lines, support and resistance, and clean candles." },
  { Icon: LuCalculator, title: "Payout Calculator", desc: "Enter a stake, see exactly what you win if the trade lands. No hidden fee, no surprise." },
  { Icon: LuRadio, title: "Trading Signals", desc: "Curated setups from the desk. Delivered in the app, short and to the point." },
  { Icon: LuBell, title: "Price Alerts", desc: "Set a level on any market. We ping you the moment it gets there." },
  { Icon: LuFileText, title: "Trade Journal", desc: "Every trade you take, auto-logged. Review what worked and what didn't." },
];

export default function Tools() {
  return (
    <PageShell
      eyebrow="Tools"
      title="Tools that help you trade, not distract you."
      lead="Each of these lives inside your TagOption account. No installs, no plugins, no third-party logins."
    >
      <section className="page__section">
        <div className="container">
          <div className="page__grid">
            {tools.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 60} className="page__item">
                <div className="page__item-icon"><Icon /></div>
                <h3 className="page__item-title">{title}</h3>
                <p className="page__item-desc">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page__cta">
        <div className="container">
          <h2 className="page__cta-title">All tools included. No upsell.</h2>
          <p className="page__cta-sub">
            Every account has access to every tool from day one.
          </p>
          <div className="page__cta-actions">
            <a href="#auth" className="btn btn-primary">Open Free Account</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
