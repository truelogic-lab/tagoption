import React from "react";
import { Link } from "react-router-dom";
import {
  LuActivity,
  LuTrendingUp,
  LuStepForward,
  LuRuler,
  LuRocket,
  LuArrowRight,
} from "react-icons/lu";
import Reveal from "../ui/Reveal";

const markets = [
  { Icon: LuActivity,   title: "Volatility Indices" },
  { Icon: LuTrendingUp, title: "Boom & Crash" },
  { Icon: LuStepForward,title: "Step Index" },
  { Icon: LuRuler,      title: "Range Break" },
  { Icon: LuRocket,     title: "Jump Index" },
];

export default function Explore() {
  return (
    <section className="explore">
      <div className="container">
        <Reveal className="explore__head">
          <span className="section-eyebrow">Explore the Platform</span>
          <h2 className="section-title">
            Find Your Next <span className="accent">Market</span> to Learn About.
          </h2>
        </Reveal>

        <div className="explore__grid">
          {markets.map(({ Icon, title }, i) => (
            <Reveal key={title} delay={i * 60} className="explore__item">
              <div className="explore__item-icon"><Icon /></div>
              <span className="explore__item-title">{title}</span>
            </Reveal>
          ))}
        </div>

        <Reveal as="p" delay={320} className="explore__note">
          Market availability and contract terms vary. Confirm the details
          shown on the platform before trading.
        </Reveal>

        <Reveal delay={380} className="explore__cta">
          <Link to="/online-trading" className="btn btn-primary">
            Explore Available Markets <LuArrowRight />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
