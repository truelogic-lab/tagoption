import {
  LuActivity,
  LuTrendingUp,
  LuTrendingDown,
  LuStepForward,
  LuRuler,
  LuRocket,
  LuZap,
} from "react-icons/lu";

export const CATEGORIES = [
  { id: "all",        label: "All markets",     Icon: LuActivity },
  { id: "volatility", label: "Volatility",      Icon: LuActivity },
  { id: "boom",       label: "Boom",            Icon: LuTrendingUp },
  { id: "crash",      label: "Crash",           Icon: LuTrendingDown },
  { id: "step",       label: "Step Index",      Icon: LuStepForward },
  { id: "range",      label: "Range Break",     Icon: LuRuler },
  { id: "jump",       label: "Jump",            Icon: LuRocket },
];

export const MARKETS = [
  { id: "R_10",   name: "Volatility 10 Index",  category: "volatility", symbol: "V10",  base: 9532.87 },
  { id: "R_25",   name: "Volatility 25 Index",  category: "volatility", symbol: "V25",  base: 2418.50 },
  { id: "R_50",   name: "Volatility 50 Index",  category: "volatility", symbol: "V50",  base: 342.19 },
  { id: "R_75",   name: "Volatility 75 Index",  category: "volatility", symbol: "V75",  base: 51204.31 },
  { id: "R_100",  name: "Volatility 100 Index", category: "volatility", symbol: "V100", base: 1274.68 },
  { id: "BOOM500",name: "Boom 500 Index",       category: "boom",       symbol: "B500", base: 9642.11 },
  { id: "BOOM1000",name:"Boom 1000 Index",      category: "boom",       symbol: "B1K",  base: 12045.30 },
  { id: "CRASH500",name:"Crash 500 Index",      category: "crash",      symbol: "C500", base: 8231.45 },
  { id: "CRASH1000",name:"Crash 1000 Index",    category: "crash",      symbol: "C1K",  base: 10432.18 },
  { id: "STEP",   name: "Step Index",           category: "step",       symbol: "STEP", base: 9102.90 },
  { id: "RB100",  name: "Range Break 100",      category: "range",      symbol: "RB100",base: 6800.42 },
  { id: "RB200",  name: "Range Break 200",      category: "range",      symbol: "RB200",base: 4450.77 },
  { id: "JD10",   name: "Jump 10 Index",        category: "jump",       symbol: "J10",  base: 3021.78 },
  { id: "JD25",   name: "Jump 25 Index",        category: "jump",       symbol: "J25",  base: 4125.60 },
  { id: "JD50",   name: "Jump 50 Index",        category: "jump",       symbol: "J50",  base: 5310.45 },
];

export const SCAN_STEPS = 13;

export const FEATURES = [
  {
    Icon: LuZap,
    title: "Pattern detection",
    desc: "Reads tick history across every supported market and flags repeating formations as they develop.",
  },
  {
    Icon: LuActivity,
    title: "Volatility scoring",
    desc: "Ranks each market by how much it's moving relative to its own baseline, so you can see what's actually active.",
  },
  {
    Icon: LuRuler,
    title: "Entry zones",
    desc: "Marks price levels where prior reactions occurred. Support, resistance, and everything in between.",
  },
  {
    Icon: LuRocket,
    title: "Signal confidence",
    desc: "Every signal carries a confidence score built from how often that pattern has worked historically.",
  },
];
