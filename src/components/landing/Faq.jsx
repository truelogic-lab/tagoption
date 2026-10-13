import React, { useState } from "react";
import { LuPlus, LuMinus } from "react-icons/lu";
import Reveal from "../ui/Reveal";

const faqs = [
  {
    q: "What is TagOption?",
    a: "TagOption is a trading platform designed to provide access to supported volatility indices and related trading tools. Available instruments and features depend on the platform's current offering.",
  },
  {
    q: "What can I trade here?",
    a: "Explore the markets listed on the platform, including supported volatility indices and other available instruments. Each market has its own characteristics and risks.",
  },
  {
    q: "How do deposits and withdrawals work?",
    a: "Available methods, processing times, fees, and eligibility depend on your account and location. Review the current payment terms before depositing.",
  },
  {
    q: "How much do I need to start?",
    a: "The minimum deposit and minimum trade size depend on the supported account and contract options. Check the current terms before funding your account.",
  },
  {
    q: "What does the AI scanner do?",
    a: "An AI-powered scanner can help analyze market data and flag patterns for further review. Its outputs are not guarantees of future price movements or profitable trades.",
  },
  {
    q: "Is my money safe?",
    a: "Trading carries financial risk, and no platform can eliminate market losses. Review TagOption's security measures, custody arrangements, regulatory status, and withdrawal terms before depositing funds.",
  },
];

function Item({ item, isOpen, onToggle }) {
  return (
    <div className={`faq__item ${isOpen ? "is-open" : ""}`}>
      <button className="faq__q" onClick={onToggle} aria-expanded={isOpen}>
        <span>{item.q}</span>
        <span className="faq__icon">{isOpen ? <LuMinus /> : <LuPlus />}</span>
      </button>
      <div className="faq__a"><p>{item.a}</p></div>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="platforms">
      <div className="container">
        <Reveal className="platforms__head">
          <div className="platforms__head-left">
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">
              Questions, <span className="accent">answered</span>.
            </h2>
            <p className="platforms__lead">
              Straight answers to the things people ask us most.
            </p>
          </div>
        </Reveal>

        <div className="faq">
          {faqs.map((item, i) => (
            <Reveal key={item.q} delay={i * 40}>
              <Item
                item={item}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? -1 : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
