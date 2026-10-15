import React from "react";
import {
  LuX, LuSearch, LuSparkles, LuBot, LuRefreshCw,
} from "react-icons/lu";
import { useMarkets } from "../../../lib/useMarkets";
import { useScanner } from "../../ai/useScanner";

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function EntryScanner({ open, onClose, onLoadBot }) {
  const { markets, loading } = useMarkets();

  // Only scan markets the platform currently offers. Disabled markets still
  // exist in the DB and would otherwise be picked and surfaced to the user.
  const enabledMarkets = React.useMemo(
    () => markets.filter((m) => m.active),
    [markets]
  );

  const {
    running, progress, total, currentMarket, result, error, start, reset,
  } = useScanner(enabledMarkets);

  if (!open) return null;

  const close = () => { reset(); onClose(); };

  const loadBot = () => {
    if (!result) return;
    onLoadBot?.({
      market: result.market,
      signal: result.signal,
      // The scanner reports a distribution, not a prediction. `ratio` is the
      // share of the sample that landed on the picked side — the banner
      // shows it as "N% in sample", never as "confidence".
      ratio: result.signal === "Even" ? result.evenRatio : result.oddRatio,
      category: "evenodd",
    });
    close();
  };

  const signalClass = result
    ? result.signal === "Even" ? "scanner__result--even" : "scanner__result--odd"
    : "";

  return (
    <div className="modal" onClick={close}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="scanner__head-left">
            <span className="scanner__badge"><LuSparkles /></span>
            <h3 className="modal__title">Market Scanner</h3>
          </div>
          <button className="modal__close" onClick={close} aria-label="Close"><LuX /></button>
        </div>

        <p className="scanner__intro">
          Reads the last 60 ticks of every active market and ranks them by how far
          their Even/Odd split has drifted from 50/50. The numbers below are the
          actual statistics — you make the call.
        </p>

        <div className="scanner__progress">
          <div className="scanner__progress-head">
            <span>{currentMarket ? currentMarket.name : "Ready to scan"}</span>
            <span>{progress}/{total || 0}</span>
          </div>
          <div className="scanner__bar">
            <div
              className="scanner__bar-fill"
              style={{ width: total ? `${(progress / total) * 100}%` : "0%" }}
            />
          </div>
          {running && currentMarket && (
            <div className="scanner__current">
              <LuRefreshCw className="scanner__spin" />
              <span>Analysing {currentMarket.name}…</span>
            </div>
          )}
        </div>

        {result && (
          <div className={`scanner__result ${signalClass}`}>
            <div className="scanner__result-head">
              <strong>{result.market?.name}</strong>
              <span>{result.sample} ticks analysed</span>
            </div>

            <div className="scanner__result-row">
              <span>Even / Odd</span>
              <strong>{pct(result.evenRatio)} / {pct(result.oddRatio)}</strong>
            </div>

            <div className="scanner__split" aria-hidden="true">
              <div className="scanner__split-even" style={{ width: pct(result.evenRatio) }} />
              <div className="scanner__split-odd"  style={{ width: pct(result.oddRatio) }} />
            </div>

            <div className="scanner__result-row">
              <span>Current streak</span>
              <span className={`scanner__streak scanner__streak--${result.streakType.toLowerCase()}`}>
                {result.streak}× {result.streakType}
              </span>
            </div>

            <div className="scanner__result-row">
              <span>Volatility</span>
              <strong>{result.volatility.toFixed(3)}%</strong>
            </div>

            <div className="scanner__result-row">
              <span>Momentum</span>
              <strong className={result.momentum >= 0 ? "is-pos" : "is-neg"}>
                {result.momentum >= 0 ? "+" : ""}{result.momentum.toFixed(2)}%
              </strong>
            </div>

            <div className="scanner__note">
              Skewed toward <strong>{result.signal}</strong> in this sample.
              Past distribution does not predict future outcomes.
            </div>
          </div>
        )}

        {error && <div className="scanner__error">{error}</div>}

        <button
          className="btn btn-blue scanner__scan"
          onClick={start}
          disabled={running || loading || !enabledMarkets.length}
        >
          {running
            ? <><LuRefreshCw className="scanner__spin" /> Scanning…</>
            : result
              ? <>Scan again</>
              : <><LuSearch /> Scan markets</>}
        </button>

        {result ? (
          <button className="scanner__bot scanner__bot--active" onClick={loadBot}>
            <LuBot /> Load {result.market?.name}
          </button>
        ) : (
          <button className="scanner__bot" disabled>
            <LuBot /> Load bot
          </button>
        )}
      </div>
    </div>
  );
}
