import React from "react";
import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import Reveal from "../ui/Reveal";

const steps = [
  {
    num: "01",
    title: "Create Your Account",
    desc: "Register and complete any required identity verification.",
  },
  {
    num: "02",
    title: "Explore the Markets",
    desc: "Learn how each instrument works and review its contract terms and risks.",
  },
  {
    num: "03",
    title: "Make an Informed Decision",
    desc: "If you choose to trade, understand your stake, possible payout, and maximum potential loss before placing an order.",
  },
];

export default function GettingStarted() {
  return (
    <section className="getting-started">
      <div className="container">
        <Reveal className="getting-started__head">
          <span className="section-eyebrow">Getting Started</span>
          <h2 className="section-title">
            Three Steps to <span className="accent">Get Started</span>.
          </h2>
        </Reveal>

        <div className="getting-started__grid">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 80} className="gs-step">
              <span className="gs-step__num">{s.num}</span>
              <h3 className="gs-step__title">{s.title}</h3>
              <p className="gs-step__desc">{s.desc}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={320} className="getting-started__cta">
          <Link to="/auth" className="btn btn-primary">
            Create Your Account <LuArrowRight />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
