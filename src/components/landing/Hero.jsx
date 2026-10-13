import React from "react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuRocket, LuLayoutDashboard } from "react-icons/lu";
import Reveal from "../ui/Reveal";
import { useAuth } from "../../lib/useAuth";
import heroImg from "../../assets/hero.png";

export default function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <Reveal as="h1" delay={0} className="hero__title">
            See the Market Differently.<br />
            <span className="accent">Trade With More Clarity.</span>
          </Reveal>

          <Reveal as="p" delay={80} className="hero__subtitle">
            Explore volatility indices, follow live market movements, and use
            intuitive trading tools designed to help you make informed decisions.
          </Reveal>

          <Reveal delay={160} className="hero__actions">
            {isAuthenticated ? (
              <Link to="/trade" className="btn btn-primary hero__btn">
                <LuLayoutDashboard /> Open Dashboard
              </Link>
            ) : (
              <Link to="/auth" className="btn btn-primary hero__btn">
                <LuRocket /> Create Your Account
              </Link>
            )}
            <Link to="/online-trading" className="btn btn-ghost hero__btn">
              Explore the Platform <LuArrowRight />
            </Link>
          </Reveal>

          <Reveal as="p" delay={220} className="hero__disclaimer">
            Trading involves risk. Understand the risks before you begin.
          </Reveal>
        </div>

        <Reveal delay={120} className="hero__visual">
          <img src={heroImg} alt="Trading preview" className="hero__image" />
        </Reveal>
      </div>
    </section>
  );
}
