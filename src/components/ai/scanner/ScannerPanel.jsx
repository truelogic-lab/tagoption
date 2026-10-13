import React, { useState } from "react";
import { LuSearch, LuRotateCcw } from "react-icons/lu";
import { useScanner } from "../useScanner";
import CategorySelect from "./CategorySelect";
import ProgressBar from "./ProgressBar";
import ResultCard from "./ResultCard";

export default function ScannerPanel() {
  const [category, setCategory] = useState("all");
  const { running, progress, total, result, start, reset } = useScanner();

  const handleScan = () => start(category);
  const handleReset = () => reset();

  return (
    <div className="scanner-panel">
      <div className="scanner-panel__intro">
        <h2 className="scanner-panel__title">Entry Scanner</h2>
        <p className="scanner-panel__text">
          Pick a market category and run the scan. The engine walks every
          supported index and surfaces the strongest setup it finds.
        </p>
      </div>

      <CategorySelect value={category} onChange={setCategory} disabled={running} />

      <ProgressBar value={progress} total={total} />

      <ResultCard result={result} />

      <div className="scanner-panel__actions">
        <button
          className="btn btn-primary scanner-panel__scan"
          onClick={handleScan}
          disabled={running}
        >
          <LuSearch /> {running ? "Scanning…" : "Run Deep Scan"}
        </button>

        {result && !running && (
          <button className="scanner-panel__reset" onClick={handleReset}>
            <LuRotateCcw /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
