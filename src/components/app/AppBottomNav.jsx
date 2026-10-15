import React from "react";
import { NavLink } from "react-router-dom";
import { LuChartCandlestick, LuClock, LuZap } from "react-icons/lu";

export default function AppBottomNav({ onAi, positionCount = 0 }) {
  return (
    <nav className="bottomnav">
      <NavLink
        to="/trade"
        className={({ isActive }) => `bottomnav__btn ${isActive ? "is-active" : ""}`}
      >
        <LuChartCandlestick size={28} strokeWidth={2} />
        <span>Trade</span>
      </NavLink>

      <button className="bottomnav__btn bottomnav__btn--ai" onClick={onAi}>
        <span className="bottomnav__ai-badge"><LuZap /></span>
        <span>AI</span>
      </button>

      <NavLink
        to="/positions"
        className={({ isActive }) => `bottomnav__btn ${isActive ? "is-active" : ""}`}
      >
        <span className="bottomnav__icon-wrap">
          <LuClock />
          {positionCount > 0 && <span className="bottomnav__count">{positionCount}</span>}
        </span>
        <span>Positions</span>
      </NavLink>
    </nav>
  );
}
