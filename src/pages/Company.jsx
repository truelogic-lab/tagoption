import React from "react";
import { LuMail, LuMapPin, LuMessageCircle, LuBriefcase, LuNewspaper, LuUsers } from "react-icons/lu";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";

export default function Company() {
  return (
    <PageShell
      eyebrow="Company"
      title="A small team, focused on one thing."
      lead="We build for traders who want a straightforward place to trade volatility indices. That's the whole mission."
    >
      <section className="page__section">
        <div className="container">
          <div className="prose">
            <h2>About us</h2>
            <p>
              TagOption started because trading platforms were getting more complicated, not less.
              We wanted a place where a new trader could open an account, fund it with M-Pesa,
              and place a trade — in under five minutes, without a manual.
            </p>
            <p>
              So we built it. Simple interface, real-time charts, honest fees, and support that
              actually replies. Everything else is noise.
            </p>

            <h2>Careers</h2>
            <p>
              We're a remote-first team of engineers, traders, and support staff. We hire slowly
              and carefully — people who care about the details and want to build something
              traders trust.
            </p>
            <ul>
              <li>Senior frontend engineer — React, TypeScript</li>
              <li>Backend engineer — Node, PostgreSQL</li>
              <li>Customer support — English + Swahili</li>
            </ul>

            <h2>Contact</h2>
            <p>Questions, feedback, or press — pick the inbox that fits.</p>
            <ul>
              <li>General: <a href="mailto:hello@tagoption.ke">hello@tagoption.ke</a></li>
              <li>Support: <a href="mailto:support@tagoption.ke">support@tagoption.ke</a></li>
              <li>Press: <a href="mailto:press@tagoption.ke">press@tagoption.ke</a></li>
            </ul>

            <h2>Offices</h2>
            <p>
              Registered in Nairobi, Kenya. Remote-first — our team works from Nairobi,
              Kampala, and Lagos.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
