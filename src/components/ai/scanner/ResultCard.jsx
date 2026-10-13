import React from "react";
import { LuTrendingUp } from "react-icons/lu";

export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="scan-result">
      <div className="scan-result__head">
        <span className="scan-result__badge">
          <LuTrendingUp /> Best market found
        </span>
      </div>

      <div className="scan-result__row">
        <span>Market</span>
        <strong>{result.market.name}</strong>
      </div>
      <div className="scan-result__row">
        <span>Suggested entry</span>
        <strong className="scan-result__signal">{result.signal}</strong>
      </div>
      <div className="scan-result__row">
        <span>Confidence</span>
        <strong>{result.confidence}%</strong>
      </div>

      {result.alternates?.length > 0 && (
        <div className="scan-result__alts">
          <span className="scan-result__alts-title">Also worth watching</span>
          {result.alternates.map((a) => (
            <div className="scan-result__alt" key={a.market.id}>
              <span>{a.market.name}</span>
              <span>{a.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
