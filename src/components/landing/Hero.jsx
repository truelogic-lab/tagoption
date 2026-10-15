import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuSparkles } from "react-icons/lu";
import Reveal from "../ui/Reveal";
import Typewriter from "../ui/Typewriter";
import { useScrollProgress } from "../../lib/useScrollProgress";
import heroImg from "../../assets/hero.png";

/**
 * The illustration rolls in from the left on first paint, then rolls back
 * out to the left as the user scrolls — tied 1:1 to scroll position so it
 * feels physical, not animated.
 *
 * On mount: `entered` goes false → true, which transitions the CSS
 * `translateX` from -110% to the scroll-driven value. The two compose:
 *   transform: translateX(calc(var(--enter-x) + var(--scroll-x)))
 */
const ROLL_RANGE_PX = 700;   // how far the user scrolls to fully hide it

export default function Hero() {
  const [entered, setEntered] = useState(false);
  const progress = useScrollProgress(ROLL_RANGE_PX);

  // Trigger the entry transition on the next frame so the CSS transition
  // from -110% has something to interpolate against.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const enterX = entered ? 0 : -110;                 // percent
  const scrollX = -progress * 110;                   // percent

  return (
    <section className={`hero ${progress > 0 ? "is-scrolling" : ""}`}>
      <div className="hero__bg" aria-hidden="true">
        <img
          src={heroImg}
          alt=""
          className="hero__bg-image"
          style={{
            "--enter-x": `${enterX}%`,
            "--scroll-x": `${scrollX}%`,
          }}
        />
        <span className="hero__bg-fade" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <Reveal delay={40}>
            <span className="section-eyebrow">See the Market Differently.</span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="hero__title">
              <span className="hero__title-lead">Trade With</span>
              <span className="hero__title-accent">
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
