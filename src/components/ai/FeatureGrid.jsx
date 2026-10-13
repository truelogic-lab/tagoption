import React from "react";
import { FEATURES } from "./data";
import Reveal from "../ui/Reveal";

export default function FeatureGrid() {
  return (
    <div className="ai-features">
      {FEATURES.map(({ Icon, title, desc }, i) => (
        <Reveal key={title} delay={i * 60} className="ai-feature">
          <div className="ai-feature__icon"><Icon /></div>
          <h3 className="ai-feature__title">{title}</h3>
          <p className="ai-feature__desc">{desc}</p>
        </Reveal>
      ))}
    </div>
  );
}
