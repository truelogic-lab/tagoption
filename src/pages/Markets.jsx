import React from "react";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";

const markets = [
  { name: "Volatility 10", sym: "V10", price: "9,532.87", change: 0.35 },
  { name: "Volatility 25", sym: "V25", price: "2,418.50", change: -0.12 },
  { name: "Volatility 50", sym: "V50", price: "342.19", change: 0.48 },
  { name: "Volatility 75", sym: "V75", price: "51,204.31", change: -0.26 },
  { name: "Volatility 100", sym: "V100", price: "1,274.68", change: 0.11 },
  { name: "Boom 500", sym: "B500", price: "9,642.11", change: 0.62 },
  { name: "Crash 500", sym: "C500", price: "8,231.45", change: -0.41 },
  { name: "Step Index", sym: "STEP", price: "9,102.90", change: 0.09 },
  { name: "Jump 10", sym: "J10", price: "3,021.78", change: -0.18 },
];

const news = [
  { title: "Vol 75 hits a 30-day high as synthetic momentum builds", time: "12 minutes ago", tag: "Markets" },
  { title: "New AI Entry Scanner update surfaces better signals on Boom & Crash", time: "2 hours ago", tag: "Product" },
  { title: "Understanding Over/Under contracts in under five minutes", time: "Yesterday", tag: "Guides" },
  { title: "Withdrawals now land on M-Pesa in under a minute", time: "3 days ago", tag: "Product" },
];

const events = [
  { time: "13:30", title: "US CPI data release", impact: "High" },
  { time: "15:00", title: "Fed FOMC minutes", impact: "High" },
  { time: "17:00", title: "Crude Oil inventories", impact: "Medium" },
  { time: "20:00", title: "European Central Bank speech", impact: "Low" },
];

export default function Markets() {
  return (
    <PageShell
      eyebrow="Markets"
      title="Live prices, market news, and what's coming next."
      lead="Everything in one place. Prices refresh in real time when you sign in. News and the calendar are here to give you context."
    >
      <section className="page__section">
        <div className="container">
          <div className="page__section-head">
            <h2 className="page__section-title">Live prices</h2>
            <p className="page__section-sub">
              Sample numbers while signed out. Sign in to see live, tick-by-tick updates.
            </p>
          </div>

          <Reveal className="table">
            <div className="table__row table__head">
              <span>Market</span>
              <span>Price</span>
              <span>Change</span>
              <span>Symbol</span>
            </div>
            {markets.map((m) => {
              const up = m.change >= 0;
              return (
                <div className="table__row" key={m.sym}>
                  <span className="table__name">{m.name}</span>
                  <span className="table__value">{m.price}</span>
                  <span className={`table__delta table__delta--${up ? "up" : "down"}`}>
                    {up ? "+" : ""}{m.change.toFixed(2)}%
                  </span>
                  <span className="table__sym">{m.sym}</span>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      <section className="page__section">
        <div className="container">
          <div className="page__section-head">
            <h2 className="page__section-title">Market news</h2>
            <p className="page__section-sub">
              Short reads on what's moving and why.
            </p>
          </div>

          <div className="page__grid">
            {news.map((n, i) => (
              <Reveal key={n.title} delay={i * 60} className="page__item">
                <span className="page__eyebrow">{n.tag}</span>
                <h3 className="page__item-title">{n.title}</h3>
                <p className="page__item-desc">{n.time}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page__section">
        <div className="container">
          <div className="page__section-head">
            <h2 className="page__section-title">Economic calendar</h2>
            <p className="page__section-sub">
              The scheduled events that tend to move traditional markets.
            </p>
          </div>

          <Reveal className="table">
            <div className="table__row table__head">
              <span>Time</span>
              <span>Event</span>
              <span>Impact</span>
              <span />
            </div>
            {events.map((e) => (
              <div className="table__row" key={e.title}>
                <span className="table__name">{e.time}</span>
                <span className="table__value">{e.title}</span>
                <span className={`table__delta ${e.impact === "High" ? "table__delta--down" : "table__delta--up"}`}>
                  {e.impact}
                </span>
                <span />
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
