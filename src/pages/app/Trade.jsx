import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { LuBot, LuX } from "react-icons/lu";
import CategoryTabs from "../../components/app/trade/CategoryTabs";
import Chart from "../../components/app/trade/Chart";
import DigitStrip from "../../components/app/trade/DigitStrip";
import ModeToggle from "../../components/app/trade/ModeToggle";
import StakePanel from "../../components/app/trade/StakePanel";
import StakeChips from "../../components/app/trade/StakeChips";
import SettingsRow from "../../components/app/trade/SettingsRow";
import TradeButtons from "../../components/app/trade/TradeButtons";
import AutoPanel from "../../components/app/trade/AutoPanel";
import { useAutoTrade } from "../../components/app/trade/useAutoTrade";
import { useLiveMarket } from "../../components/app/market/useLiveMarket";
import { useMarkets } from "../../lib/useMarkets";
import { profitOf } from "../../lib/tradeEngine";

const BOT_PRESETS = {
  all:       { count: 10, stake: 5, target: 25, stop: 20 },
  evenodd:   { count: 10, stake: 5, target: 25, stop: 20 },
  matches:   { count: 8,  stake: 5, target: 20, stop: 15 },
  overunder: { count: 12, stake: 3, target: 30, stop: 20 },
};

const ZOOM_MIN = 20;
const ZOOM_MAX = 320;
const ZOOM_STEP = 1.4;

export default function Trade() {
  const { store, onPlaceTrade, botResult, clearBotResult } = useOutletContext();
  const { markets, loading: marketsLoading } = useMarkets();
  const market = markets.find((m) => m.active) ?? markets[0];

  const [windowSize, setWindowSize] = useState(80);
  const { price, change, series, lastDigit } = useLiveMarket({
    marketId: market?.id ?? "R_10",
    basePrice: market?.base ?? 9532.87,
    windowSize,
  });

  const [recentDigits, setRecentDigits] = useState([]);
  useEffect(() => {
    if (lastDigit == null) return;
    setRecentDigits((prev) => [...prev.slice(-99), lastDigit]);
  }, [lastDigit]);

  const [category, setCategory] = useState("evenodd");
  const [mode, setMode] = useState("manual");
  const [stake, setStake] = useState(10);
  const [target, setTarget] = useState(200);
  const [stop, setStop] = useState(999);
  const [multiplier, setMultiplier] = useState(2);
  const [autoCount, setAutoCount] = useState(5);
  const [botBanner, setBotBanner] = useState(null);

  const [lastResult, setLastResult] = useState(null);
  const seenClosedIds = useRef(new Set());

  const profit = profitOf(stake);
  const payout = +(stake + profit).toFixed(2);

  const auto = useAutoTrade({
    balance: store.balance,
    onTick: () => store.refreshInFlight(),
    onFinish: () => store.refresh(),
  });

  const canZoomIn = windowSize > ZOOM_MIN;
  const canZoomOut = windowSize < ZOOM_MAX;
  const zoomIn = () => { if (canZoomIn) setWindowSize((w) => Math.max(ZOOM_MIN, Math.round(w / ZOOM_STEP))); };
  const zoomOut = () => { if (canZoomOut) setWindowSize((w) => Math.min(ZOOM_MAX, Math.round(w * ZOOM_STEP))); };

  // Flash the digit strip whenever a new trade settles (from any source)
  useEffect(() => {
    const latest = store.closed[0];
    if (!latest) return;
    if (seenClosedIds.current.has(latest.id)) return;
    seenClosedIds.current.add(latest.id);
    setLastResult({ result: latest.result, key: latest.id });
  }, [store.closed]);

  useEffect(() => {
    if (!botResult) return;
    const preset = BOT_PRESETS[botResult.category] ?? BOT_PRESETS.evenodd;
    setCategory(botResult.category ?? "evenodd");
    setMode("auto");
    setAutoCount(preset.count);
    setStake(preset.stake);
    setTarget(preset.target);
    setStop(preset.stop);
    setBotBanner({
      market: botResult.market,
      signal: botResult.signal,
      confidence: botResult.confidence,
      preset,
    });
    clearBotResult?.();
  }, [botResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSetting = (key, value) => {
    if (key === "target") setTarget(value);
    if (key === "stop") setStop(value);
    if (key === "multiplier") setMultiplier(value);
  };

  const handleManualPlace = (contract) => {
    if (!market) return;
    store.placeTrade({ contract, stake, market: market.name, marketId: market.id });
  };

  const handleAutoStart = () => {
    auto.start({
      count: autoCount,
      stake,
      targetProfit: target,
      stopLoss: stop,
      market: botBanner?.market?.name ?? market?.name ?? "Volatility 10",
    });
  };

  if (marketsLoading || !market) {
    return <div className="trade trade--loading">Loading market…</div>;
  }

  return (
    <div className="trade">
      <CategoryTabs value={category} onChange={setCategory} />

      <Chart
        market={market}
        price={price}
        change={change}
        series={series}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />

      <DigitStrip active={lastDigit} recentDigits={recentDigits} lastResult={lastResult} />

      {botBanner && !auto.running && (
        <div className="bot-banner">
          <div className="bot-banner__icon"><LuBot /></div>
          <div className="bot-banner__body">
            <strong>Scanner picked {botBanner.market?.name}</strong>
            <span>
              {botBanner.signal} · {botBanner.confidence}% quality · preset{" "}
              {botBanner.preset.count} trades · ${botBanner.preset.stake}/trade
            </span>
          </div>
          <button className="bot-banner__dismiss" onClick={() => setBotBanner(null)} aria-label="Dismiss">
            <LuX />
          </button>
        </div>
      )}

      <ModeToggle value={mode} onChange={setMode} disabled={auto.running} />

      {mode === "manual" ? (
        <>
          <StakePanel value={stake} onChange={setStake} />
          <StakeChips value={stake} onChange={setStake} />
          <SettingsRow target={target} stop={stop} multiplier={multiplier} onChange={onSetting} />
          <TradeButtons stake={stake} payout={payout} onPlace={handleManualPlace} />
        </>
      ) : (
        <AutoPanel
          count={autoCount}
          onCountChange={setAutoCount}
          stake={stake}
          onStakeChange={setStake}
          targetProfit={target}
          stopLoss={stop}
          balance={store.balance}
          running={auto.running}
          progress={auto.progress}
          pnl={auto.pnl}
          error={auto.error}
          onStart={handleAutoStart}
          onStop={auto.stop}
        />
      )}
    </div>
  );
}
