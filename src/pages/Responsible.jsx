import React from "react";
import { LuShieldAlert, LuClock, LuBan, LuLifeBuoy } from "react-icons/lu";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";

const points = [
  { Icon: LuShieldAlert, title: "Trading is risky", desc: "You can lose the money you put on a trade. There is no guaranteed win rate and no strategy that always works. Treat every trade as money you're willing to lose." },
  { Icon: LuClock, title: "Set your limits before you start", desc: "Decide how much you're willing to lose in a session, and stop when you reach it. If you find yourself chasing losses, close the app and come back tomorrow." },
  { Icon: LuBan, title: "Never trade with money you need", desc: "Rent, school fees, savings — those don't belong in a trading account. Only use money that's genuinely spare." },
  { Icon: LuLifeBuoy, title: "If it stops being fun", desc: "Trading should never feel like a way out of debt, or a compulsion you can't switch off. If it does, take a break, talk to someone you trust, or reach out to a support service in your country." },
];

export default function Responsible() {
  return (
    <PageShell
      eyebrow="Responsible Trading"
      title="Trade like an adult. Protect yourself first."
      lead="Volatility indices move fast, and it's easy to get carried away. These are the rules we recommend every trader set for themselves before they start."
    >
      <section className="page__section">
        <div className="container">
          <div className="page__grid">
            {points.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 60} className="page__item">
                <div className="page__item-icon"><Icon /></div>
                <h3 className="page__item-title">{title}</h3>
                <p className="page__item-desc">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page__section">
        <div className="container">
          <div className="prose">
            <h2>Tools we give you</h2>
            <ul>
              <li><strong>Stop loss on every trade</strong> — cap your loss before you enter.</li>
              <li><strong>Session limits</strong> — set a maximum stake per day in account settings.</li>
              <li><strong>Self-exclusion</strong> — lock yourself out of the platform for a period you choose.</li>
              <li><strong>Transaction history</strong> — every trade visible, forever.</li>
            </ul>

            <h2>Need help?</h2>
            <p>
              If you think your trading has stopped being healthy, reach out.
              We'll help you close your account or set a pause — no questions asked.
              Email <a href="mailto:support@tagoption.ke">support@tagoption.ke</a>.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
