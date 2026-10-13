import React, { useEffect, useState } from "react";
import { LuSparkles } from "react-icons/lu";

const STEPS = [
  "Connecting to TagOption…",
  "Fetching live markets…",
  "Scanning volatility indices…",
  "Preparing your chart…",
];

export default function MarketLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="market-loader">
      <div className="market-loader__ring">
        <div className="market-loader__ring-spin" />
        <div className="market-loader__ring-glow" />
        <LuSparkles className="market-loader__icon" />
      </div>
      <p className="market-loader__text">{STEPS[step]}</p>
      <div className="market-loader__dots">
        <span /><span /><span />
      </div>
    </div>
  );
}
