import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { LuBot, LuX } from "react-icons/lu";
import MarketLoader from "../../components/app/trade/MarketLoader";
import CategoryTabs from "../../components/app/trade/CategoryTabs";
import Chart from "../../components/app/trade/Chart";
import MarketSelect from "../../components/app/trade/MarketSelect";
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
import { tradeApi } from "../../lib/api";

const BOT_PRESETS = {
  all:       { count: 10, stake: 5 },
  evenodd:   { count: 10, stake: 5 },
  matches:   { count: 8,  stake: 5 },
  overunder: { count: 12, stake: 3 },
};

const ZOOM_MIN = 20;
const ZOOM_MAX = 320;
const ZOOM_STEP = 1.4;
const RESULT_FLASH_MS = 1600;

export default function Trade() {
  const { store, botResult, clearBotResult } = useOutletContext();
  const { markets, loading: marketsLoading } = useMarkets();

  const [activeId, setActiveId] = useState(null);
  const activeMarket = markets.find((m) => m.id === activeId)
    ?? markets.find((m) => m.active)
    ?? markets[0];

  useEffect(() => {
    if (!activeId && activeMarket) setActiveId(activeMarket.id);
  }, [activeMarket, activeId]);

  const [windowSize, setWindowSize] = useState(80);
  const { price, change, series, lastDigit } = useLiveMarket({
    marketId: activeMarket?.id ?? "R_10",
    basePrice: activeMarket?.base ?? 9532.87,
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
  const [target, setTarget] = useState(0);
  const [stop, setStop] = useState(0);
  const [multiplier, setMultiplier] = useState(2);
  const [autoCount, setAutoCount] = useState(5);
  const [botBanner, setBotBanner] = useState(null);

  const [runState, setRunState] = useState("idle"); // idle | starting | running
  const [activeSide, setActiveSide] = useState(null);
  const [lastResult, setLastResult] = useState(null); // { result, amount }
  const [activePositionId, setActivePositionId] = useState(null);

  const resultTimer = useRef(null);

  const payout = +(stake + profitOf(stake)).toFixed(2);

  const auto = useAutoTrade({
    onTick: () => store.refreshInFlight(),
    onFinish: () => store.refresh(),
  });

  const canZoomIn = windowSize > ZOOM_MIN;
  const canZoomOut = windowSize < ZOOM_MAX;
  const zoomIn  = () => { if (canZoomIn)  setWindowSize((w) => Math.max(ZOOM_MIN, Math.round(w / ZOOM_STEP))); };
  const zoomOut = () => { if (canZoomOut) setWindowSize((w) => Math.min(ZOOM_MAX, Math.round(w * ZOOM_STEP))); };

  /* ---------- place a manual trade ---------- */
  const handleManualPlace = async (side) => {
    if (!activeMarket || activeSide) return;
    setActiveSide(side);
    setRunState("starting");
    try {
      const position = await store.placeTrade({
        contract: side,
        stake,
        market: activeMarket.name,
        marketId: activeMarket.id,
      });
      setActivePositionId(position?.id ?? null);
      setRunState("running");
    } catch (e) {
      setActiveSide(null);
      setRunState("idle");
      alert(e.message || "Trade failed");
    }
  };

  /* ---------- STOP is instant: settle the open position now ---------- */
  const handleManualStop = async () => {
    if (!activePositionId) {
      setActiveSide(null);
      setRunState("idle");
      return;
    }
    const side = activeSide;
    try {
      await tradeApi.settle(activePositionId, Math.random() < 0.5 ? "won" : "lost");
      await store.refreshInFlight();
      // The closed list will pick up the result — the effect below flashes it.
    } catch {
      // If settling failed, still let the user out
    }
    setActivePositionId(null);
    setActiveSide(null);
    setRunState("idle");
  };

  /* ---------- detect when the active trade settled ---------- */
  useEffect(() => {
    if (!activePositionId) return;
    const settled = store.closed.find((c) => c.id === activePositionId);
    if (!settled) return;

    const won = settled.result === "won";
    const amount = won ? Number(settled.payout || 0) : Number(settled.stake || 0);

    setLastResult({ result: settled.result, amount, side: activeSide });

    setActivePositionId(null);
    setActiveSide(null);
    setRunState("idle");

    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setLastResult(null), RESULT_FLASH_MS);
  }, [store.closed, activePositionId, activeSide]);

  /* ---------- bot banner ---------- */
  useEffect(() => {
    if (!botResult) return;
    const preset = BOT_PRESETS[botResult.category] ?? BOT_PRESETS.evenodd;
    setCategory(botResult.category ?? "evenodd");
    setMode("auto");
    setAutoCount(preset.count);
    setStake(preset.stake);
    if (botResult.market?.id) setActiveId(botResult.market.id);
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

  const handleAutoStart = () => {
    auto.start({
      count: autoCount,
      stake,
      targetProfit: target,
      stopLoss: stop,
      market: botBanner?.market?.name ?? activeMarket?.name ?? "Volatility 10",
    });
  };

  if (marketsLoading || !activeMarket) {
    return <MarketLoader />;
  }

  return (
    <div className="trade">
      <CategoryTabs value={category} onChange={setCategory} />

      <div className="trade__chart-wrap">
        <Chart
          market={activeMarket}
          price={price}
          change={change}
          series={series}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          hideHeader
        />
        <div className="trade__market-select-wrap">
          <MarketSelect
            markets={markets.map((m) =>
              m.id === activeMarket.id ? { ...m, price, change } : m
            )}
            current={{ ...activeMarket, price, change }}
            onChange={(m) => setActiveId(m.id)}
          />
        </div>
      </div>

      <DigitStrip active={lastDigit} recentDigits={recentDigits} lastResult={lastResult} />

      {botBanner && !auto.running && (
        <div className="bot-banner">
          <div className="bot-banner__icon"><LuBot /></div>
          <div className="bot-banner__body">
            <strong>Scanner picked {botBanner.market?.name}</strong>
            <span>
              {botBanner.signal} · {botBanner.confidence}% · preset{" "}
              {botBanner.preset.count} trades · ${botBanner.preset.stake}/trade
            </span>
          </div>
          <button className="bot-banner__dismiss" onClick={() => setBotBanner(null)} aria-label="Dismiss">
            <LuX />
          </button>
        </div>
      )}

      <ModeToggle value={mode} onChange={setMode} disabled={auto.running || runState !== "idle"} />

      {mode === "manual" ? (
        <>
          <StakePanel value={stake} onChange={setStake} />
          <StakeChips value={stake} onChange={setStake} />
          <SettingsRow target={target} stop={stop} multiplier={multiplier} onChange={onSetting} />
          <TradeButtons
            onPlace={handleManualPlace}
            onStop={handleManualStop}
            disabled={auto.running}
            runState={runState}
            activeSide={activeSide}
            lastResult={lastResult}
          />
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
