import React from "react";
import { LuChartLine, LuGlobe, LuShieldCheck } from "react-icons/lu";
import Reveal from "../ui/Reveal";

const blocks = [
  {
    Icon: LuGlobe,
    title: "One Account. Multiple Markets.",
    desc: "Explore available volatility indices and supported markets from a single account.",
  },
  {
    Icon: LuChartLine,
    title: "Technology With a Purpose",
    desc: "From charting tools to market analysis, every feature should help you better understand your trading environment.",
  },
  {
    Icon: LuShieldCheck,
    title: "Transparency You Can Understand",
    desc: "Know the contract terms, potential payout, applicable fees, and possible losses before committing to a trade.",
  },
];

export default function Welcome() {
  return (
    <section className="welcome">
      <div className="container">
        <Reveal className="welcome__head">
          <span className="section-eyebrow">About TagOption</span>
          <h2 className="section-title">
            Focused on Trading. <span className="accent">Built Around You.</span>
          </h2>
          <p className="welcome__lead">
            We believe trading technology should be understandable, accessible, and transparent.
            That's why TagOption brings market access, trading tools, and account management together in one place.
          </p>
        </Reveal>

        <div className="welcome__grid">
          {blocks.map(({ Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80} className="welcome__block">
              <div className="welcome__icon"><Icon /></div>
              <h3 className="welcome__block-title">{title}</h3>
              <p className="welcome__block-desc">{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
