import React from "react";
import {
  LuActivity,
  LuEye,
  LuChartLine,
  LuWallet,
  LuShieldCheck,
  LuSmartphone,
} from "react-icons/lu";
import Reveal from "../ui/Reveal";

const features = [
  {
    Icon: LuActivity,
    title: "A Platform That Keeps Pace",
    desc: "Navigate your markets, monitor prices, and manage your trading activity through a streamlined interface.",
  },
  {
    Icon: LuEye,
    title: "Insights at a Glance",
    desc: "Explore market data and analytical tools that help you identify patterns. Tools provide information, not guaranteed predictions.",
  },
  {
    Icon: LuChartLine,
    title: "Charts Built for Clarity",
    desc: "Follow price movements with clear, responsive charts and accessible market information.",
  },
  {
    Icon: LuWallet,
    title: "Convenient Account Funding",
    desc: "Explore supported deposit and withdrawal options, with clear information about processing times, fees, and eligibility.",
  },
  {
    Icon: LuShieldCheck,
    title: "Security at Every Step",
    desc: "Access account protection features and transparent information about how your data and funds are handled.",
  },
  {
    Icon: LuSmartphone,
    title: "Your Platform, Your Devices",
    desc: "Access your account on supported devices and keep your trading tools within reach.",
  },
];

export default function Features() {
  return (
    <section className="features">
      <div className="container">
        <Reveal className="features__head">
          <span className="section-eyebrow">Why TagOption</span>
          <h2 className="section-title">
            Your Trading Experience, <span className="accent">Simplified</span>.
          </h2>
        </Reveal>

        <div className="features__grid">
          {features.map(({ Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 60} className="feature">
              <div className="feature__icon"><Icon /></div>
              <h3 className="feature__title">{title}</h3>
              <p className="feature__desc">{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
