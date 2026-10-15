import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuSparkles } from "react-icons/lu";

import Reveal from "../ui/Reveal";
import Typewriter from "../ui/Typewriter";
import { useScrollProgress } from "../../lib/useScrollProgress";
import heroImg from "../../assets/hero.png";

const ROLL_RANGE_PX = 700;

export default function Hero() {
  const [entered, setEntered] = useState(false);
  const progress = useScrollProgress(ROLL_RANGE_PX);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const enterX = entered || reducedMotion ? 0 : -110;
  const scrollX = reducedMotion ? 0 : -progress * 110;

  return (
    <section
      className={`hero ${
        progress > 0 && !reducedMotion ? "is-scrolling" : ""
      }`}
    >
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

      <div className="hero__bg" aria-hidden="true">
        <img
          src={heroImg}
          alt=""
          className="hero__bg-image"
          style={{
            "--enter-x": `${enterX}%`,
            "--scroll-x": `${scrollX}%`,
          }}
          draggable="false"
        />

        <span className="hero__bg-fade" />
      </div>
    </section>
  );
}
