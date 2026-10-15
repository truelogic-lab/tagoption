import React from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuSparkles } from "react-icons/lu";
import Reveal from "../ui/Reveal";
import Typewriter from "../ui/Typewriter";
import heroImg from "../../assets/hero.png";

/**
 * Landing hero. The illustration bleeds off the right edge behind the copy.
 * The headline's second clause types itself in and cycles.
 */
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <img src={heroImg} alt="" className="hero__bg-image" />
        <span className="hero__bg-fade" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <Reveal delay={40}>
            <span className="section-eyebrow">See the Market Differently.</span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="hero__title">
              Trade With{" "}
              <span className="accent">
                <Typewriter text="More Clarity." speed={100} holdMs={2200} />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="hero__subtitle">
              Explore volatility indices, follow live market movements, and use
              intuitive trading tools designed to help you make informed decisions.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div className="hero__actions">
              <Link to="/auth" className="btn btn-primary hero__btn">
                <LuSparkles /> Create Your Account
              </Link>
              <Link to="/online-trading" className="btn btn-ghost hero__btn">
                Explore the Platform <LuArrowRight />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="hero__disclaimer">
              Trading involves risk. Understand the risks before you begin.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
