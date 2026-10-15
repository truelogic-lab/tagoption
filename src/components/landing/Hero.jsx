import React from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuSparkles } from "react-icons/lu";

import Reveal from "../ui/Reveal";
import Typewriter from "../ui/Typewriter";
import heroImg from "../../assets/hero.png";

export default function Hero() {
  return (
    <section className="hero hero--cinematic">
      <div className="container hero__inner">
        <div className="hero__content">
          <Reveal delay={40}>
            <span className="section-eyebrow">
              See the Market Differently.
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="hero__title">
              <span className="hero__title-lead">Trade With</span>
              <span className="hero__title-accent">
                <Typewriter
                  text="More Clarity."
                  speed={100}
                  holdMs={2200}
                  eraseMs={55}
                  gapMs={500}
                />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="hero__subtitle">
              Explore volatility indices, follow live market movements,
              and use intuitive trading tools designed to help you make
              informed decisions.
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div className="hero__actions">
              <Link to="/auth" className="btn btn-primary hero__btn">
                <LuSparkles aria-hidden="true" />
                <span>Create Your Account</span>
              </Link>

              <Link
                to="/online-trading"
                className="btn btn-ghost hero__btn"
              >
                <span>Explore the Platform</span>
                <LuArrowRight aria-hidden="true" />
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

      <div className="hero__bg hero__bg--cinematic" aria-hidden="true">
        <div className="hero__visual">
          <img
            src={heroImg}
            alt=""
            className="hero__bg-image"
            draggable="false"
          />
        </div>

        <span className="hero__bg-fade" />
      </div>
    </section>
  );
}
