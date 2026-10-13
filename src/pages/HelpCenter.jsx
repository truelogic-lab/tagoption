import React from "react";
import {
  LuWallet, LuShieldCheck, LuUser, LuChartLine, LuCreditCard, LuLifeBuoy,
} from "react-icons/lu";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";

const categories = [
  { Icon: LuUser, title: "Account", desc: "Sign up, sign in, verification, and account settings." },
  { Icon: LuWallet, title: "Deposits & Withdrawals", desc: "How to add money and how to get it back." },
  { Icon: LuChartLine, title: "Trading", desc: "Contracts, stakes, payouts, and market types." },
  { Icon: LuShieldCheck, title: "Security", desc: "Two-factor, passwords, and keeping your account safe." },
  { Icon: LuCreditCard, title: "Payment Methods", desc: "M-Pesa, USDT, card — limits and processing times." },
  { Icon: LuLifeBuoy, title: "Contact Support", desc: "Reach a human when the FAQ doesn't have your answer." },
];

const topQuestions = [
  "How do I reset my password?",
  "Why hasn't my M-Pesa deposit arrived?",
  "What is the minimum withdrawal?",
  "How long do card withdrawals take?",
  "Can I trade on weekends?",
  "How do I enable two-factor authentication?",
];

export default function HelpCenter() {
  return (
    <PageShell
      eyebrow="Help Center"
      title="Answers to the questions people ask us most."
      lead="Browse by topic, or scan the top questions below. If you're stuck, live chat is open 24/7."
    >
      <section className="page__section">
        <div className="container">
          <div className="page__section-head">
            <h2 className="page__section-title">Browse by topic</h2>
          </div>

          <div className="card-grid">
            {categories.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 60}>
                <a href="#" className="card-link">
                  <div className="card-link__icon"><Icon /></div>
                  <h3 className="card-link__title">{title}</h3>
                  <p className="card-link__desc">{desc}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page__section">
        <div className="container">
          <div className="page__section-head">
            <h2 className="page__section-title">Top questions</h2>
          </div>

          <div className="faq">
            {topQuestions.map((q, i) => (
              <Reveal key={q} delay={i * 40}>
                <div className="faq__item">
                  <a href="#" className="faq__q">
                    <span>{q}</span>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
