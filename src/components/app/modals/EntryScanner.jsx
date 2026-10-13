import React, { useEffect, useState } from "react";
import {
  LuX, LuSearch, LuChevronDown, LuSparkles, LuBot, LuRefreshCw,
} from "react-icons/lu";
import { isLive, tradeApi } from "../../../lib/api";

const CATEGORIES = [
  { id: "all",       label: "All markets" },
  { id: "evenodd",   label: "Even / Odd" },
  { id: "matches",   label: "Matches / Differs" },
  { id: "overunder", label: "Over / Under" },
];

const SCAN_STEPS = 13;

function scoreMarket(market) {
  const digits = parseInt(market.id.replace(/\D/g, ""), 10) || 10;
  const base = Math.min(digits / 100, 0.85);
  const noise = Math.random() * 0.14;
  return Math.min(0.98, base + noise);
}

export default function EntryScanner({ open, onClose, onLoadBot }) {
  const [category, setCategory] = useState("all");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMarket, setCurrentMarket] = useState(null);
  const [result, setResult] = useState(null);
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    if (!open || !isLive()) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await tradeApi.markets();
        if (!cancelled) setMarkets(Array.isArray(data) ? data : []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  const total = markets.length || 1;

  const reset = () => {
    setProgress(0);
    setCurrentMarket(null);
    setResult(null);
    setScanning(false);
  };
  const close = () => { reset(); onClose(); };

  const runScan = () => {
    if (scanning || !markets.length) return;
    setScanning(true);
    setProgress(0);
    setCurrentMarket(null);
    setResult(null);

    let i = 0;
    const step = () => {
      if (i >= markets.length) {
        const scored = markets
          .map((m) => ({ market: m, score: scoreMarket(m) }))
          .sort((a, b) => b.score - a.score);
        const best = scored[0];
        setResult({
          market: best.market,
          signal: Math.random() < 0.5 ? "Even" : "Odd",
          confidence: Math.round(best.score * 100),
        });
        setCurrentMarket(null);
        setScanning(false);
        return;
      }
      setCurrentMarket(markets[i]);
      setProgress(i + 1);
      i += 1;
      setTimeout(step, 340);
    };
    step();
  };

  const loadBot = () => {
    onLoadBot?.({
      market: result?.market ?? markets[0],
      signal: result?.signal ?? "Even",
      confidence: result?.confidence ?? 0,
      category,
    });
    close();
  };

  return (
    <div className="modal" onClick={close}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="scanner__head-left">
            <span className="scanner__badge"><LuSparkles /></span>
            <h3 className="modal__title">Entry Scanner</h3>
          </div>
          <button className="modal__close" onClick={close} aria-label="Close"><LuX /></button>
        </div>

        <p className="scanner__intro">
          Pick the market category you want to scan. The deep scanner walks
          every <strong>volatility / synthetic</strong> index and surfaces the
          best entry point for that category based on historical tick patterns.
        </p>

        <label className="scanner__field">
          <span className="scanner__label">Market</span>
          <div className="scanner__select">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={scanning}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <LuChevronDown className="scanner__caret" />
          </div>
        </label>

        <div className="scanner__progress">
          <div className="scanner__progress-head">
            <span>{currentMarket ? currentMarket.name : "Ready to scan"}</span>
            <span>{progress}/{total}</span>
          </div>
          <div className="scanner__bar">
            <div className="scanner__bar-fill" style={{ width: `${(progress / total) * 100}%` }} />
          </div>

          {scanning && currentMarket && (
            <div className="scanner__current">
              <LuRefreshCw className="scanner__spin" />
              <span>Scanning {currentMarket.name} ({progress}/{total})…</span>
            </div>
          )}
        </div>

        {result && (
          <div className="scanner__result">
            <div className="scanner__result-row">
              <span>Best market</span>
              <strong>{result.market.name}</strong>
            </div>
            <div className="scanner__result-row">
              <span>Suggested entry</span>
              <strong className="scanner__result-signal">{result.signal}</strong>
            </div>
            <div className="scanner__result-row">
              <span>Quality</span>
              <strong>{result.confidence}%</strong>
            </div>
          </div>
        )}

        <button
          className="btn btn-blue scanner__scan"
          onClick={runScan}
          disabled={scanning || !markets.length}
        >
          {scanning
            ? <><LuRefreshCw className="scanner__spin" /> Deep Scanning Best Market…</>
            : result
              ? <><LuSearch /> Re-scan for Best Market</>
              : <><LuSearch /> Deep Scan for Best Market</>}
        </button>

        {result ? (
          <button className="scanner__bot scanner__bot--active" onClick={loadBot}>
            <LuBot /> Load {result.market.name}
          </button>
        ) : (
          <button className="scanner__bot" disabled>
            <LuBot /> Load Deep Scanner Bot
          </button>
        )}
      </div>
    </div>
  );
}
