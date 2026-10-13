/**
 * Market registry — the source of truth for what users can trade.
 * Later: pull this from a `markets` table so you can enable/disable
 * markets without a deploy.
 */
export const MARKETS = [
  { id: "R_10",    name: "Volatility 10 Index",  symbol: "V10",   base: 9532.87,  tick: 1, category: "volatility", active: true },
  { id: "R_25",    name: "Volatility 25 Index",  symbol: "V25",   base: 2418.50,  tick: 1, category: "volatility", active: false },
  { id: "R_50",    name: "Volatility 50 Index",  symbol: "V50",   base: 342.19,   tick: 1, category: "volatility", active: false },
  { id: "R_75",    name: "Volatility 75 Index",  symbol: "V75",   base: 51204.31, tick: 1, category: "volatility", active: false },
  { id: "R_100",   name: "Volatility 100 Index", symbol: "V100",  base: 1274.68,  tick: 1, category: "volatility", active: false },
  { id: "BOOM500", name: "Boom 500 Index",       symbol: "B500",  base: 9642.11,  tick: 1, category: "boom",       active: false },
  { id: "BOOM1K",  name: "Boom 1000 Index",      symbol: "B1K",   base: 12045.30, tick: 1, category: "boom",       active: false },
  { id: "CRASH500",name: "Crash 500 Index",      symbol: "C500",  base: 8231.45,  tick: 1, category: "crash",      active: false },
  { id: "CRASH1K", name: "Crash 1000 Index",     symbol: "C1K",   base: 10432.18, tick: 1, category: "crash",      active: false },
  { id: "STEP",    name: "Step Index",           symbol: "STEP",  base: 9102.90,  tick: 1, category: "step",       active: false },
  { id: "RB100",   name: "Range Break 100",      symbol: "RB100", base: 6800.42,  tick: 1, category: "range",      active: false },
  { id: "RB200",   name: "Range Break 200",      symbol: "RB200", base: 4450.77,  tick: 1, category: "range",      active: false },
  { id: "JD10",    name: "Jump 10 Index",        symbol: "J10",   base: 3021.78,  tick: 1, category: "jump",       active: false },
  { id: "JD25",    name: "Jump 25 Index",        symbol: "J25",   base: 4125.60,  tick: 1, category: "jump",       active: false },
  { id: "JD50",    name: "Jump 50 Index",        symbol: "J50",   base: 5310.45,  tick: 1, category: "jump",       active: false },
];

export function getMarket(id) {
  return MARKETS.find((m) => m.id === id);
}
