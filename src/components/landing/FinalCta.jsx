import React from "react";
import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import Reveal from "../ui/Reveal";

export default function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container">
        <Reveal className="final-cta__inner">
          <h2 className="final-cta__title">
            Your Next Move Starts <span className="accent">With Knowledge</span>.
          </h2>
          <p className="final-cta__sub">
            Explore the platform, learn how the markets work, and make decisions
            with a clear understanding of the risks.
          </p>
          <div className="final-cta__actions">
            <Link to="/auth" className="btn btn-primary">
              Explore TagOption <LuArrowRight />
            </Link>
            <Link to="/help" className="btn btn-ghost">
              Learn Before You Trade
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
