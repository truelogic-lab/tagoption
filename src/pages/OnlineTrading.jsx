import React from "react";
import {
  LuActivity, LuTrendingUp, LuTrendingDown, LuStepForward, LuRuler, LuRocket,
} from "react-icons/lu";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";

const products = [
  { Icon: LuActivity, title: "Volatility Indices", desc: "Markets that move with a fixed volatility, from Vol 10 to Vol 100. Available every second of every day, including weekends.", list: ["Volatility 10", "Volatility 25", "Volatility 50", "Volatility 75", "Volatility 100"] },
  { Icon: LuTrendingUp, title: "Boom Indices", desc: "Markets that drift down steadily and spike up at random. For traders who like to buy the dip and wait for the burst.", list: ["Boom 300", "Boom 500", "Boom 1000"] },
  { Icon: LuTrendingDown, title: "Crash Indices", desc: "Markets that drift up and drop sharply at random. The mirror of Boom — for traders who like to short the top.", list: ["Crash 300", "Crash 500", "Crash 1000"] },
  { Icon: LuStepForward, title: "Step Index", desc: "A market that moves in clean, equal steps. Predictable rhythm, useful for practising entry timing.", list: ["Step Index"] },
  { Icon: LuRuler, title: "Range Break", desc: "Markets that stay inside a range, then break out. For traders who wait for the squeeze.", list: ["Range Break 100", "Range Break 200"] },
  { Icon: LuRocket, title: "Jump Indices", desc: "Markets that stay flat most of the time, then jump. High risk, high reward, not for the impatient.", list: ["Jump 10", "Jump 25", "Jump 50", "Jump 75", "Jump 100"] },
];

export default function OnlineTrading() {
  return (
    <PageShell
      eyebrow="Online Trading"
      title="Pick your market. Trade it your way."
      lead="Every market on TagOption runs 24 hours a day, 7 days a week. Choose one, choose your contract length, choose how much you want to put on the line."
    >
      <section className="page__section">
        <div className="container">
          <div className="page__section-head">
            <h2 className="page__section-title">Markets we offer</h2>
            <p className="page__section-sub">
              Six families of synthetic markets. All driven by the same transparent algorithm — no news shocks, no weekend gaps.
            </p>
          </div>

          <div className="page__grid">
            {products.map(({ Icon, title, desc, list }, i) => (
              <Reveal key={title} delay={i * 60} className="page__item">
                <div className="page__item-icon"><Icon /></div>
                <h3 className="page__item-title">{title}</h3>
                <p className="page__item-desc">{desc}</p>
                <ul className="page__item-list">
                  {list.map((l) => <li key={l}>{l}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page__cta">
        <div className="container">
          <h2 className="page__cta-title">Ready to place your first trade?</h2>
          <p className="page__cta-sub">
            Open an account in under a minute. No paperwork, no waiting for approval.
          </p>
          <div className="page__cta-actions">
            <a href="#auth" className="btn btn-primary">Create Free Account</a>
            <a href="/markets" className="btn btn-ghost">See Live Prices</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
