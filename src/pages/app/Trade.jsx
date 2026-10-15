import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import TradeErrorBanner from "../../components/app/trade/TradeErrorBanner";
import { useAutoTrade } from "../../components/app/trade/useAutoTrade";
import { useLiveMarket } from "../../components/app/market/useLiveMarket";
import { useMarkets } from "../../lib/useMarkets";
import { tradeApi } from "../../lib/api";
import { profitOf } from "../../lib/tradeEngine";
import { emit } from "../../lib/events";
import { getApiError } from "../../lib/apiError";
import { loadConfig } from "../../lib/configCache";

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
const MANUAL_MS_DEFAULT = 60_000;
const MIN_STAKE = 1;

export default function Trade() {
  const { store, botResult, clearBotResult } = useOutletContext();
  const { markets, loading: marketsLoading, error: marketsError } = useMarkets();

  const [activeId, setActiveId] = useState(null);
  const activeMarket = useMemo(
    () =>
      markets.find((m) => m.id === activeId) ??
      markets.find((m) => m.active) ??
      markets[0] ??
      null,
    [markets, activeId]
  );

  useEffect(() => {
    if (!activeId && activeMarket) setActiveId(activeMarket.id);
  }, [activeMarket, activeId]);

  const [windowSize, setWindowSize] = useState(80);
  const { price, change, series, lastDigit } = useLiveMarket({
    marketId: activeMarket?.id ?? "R_10",
    basePrice: activeMarket?.base ?? 9532.87,
    windowSize,
  });

  // Keyed on price, not on lastDigit. If two consecutive ticks end in the
  // same digit, the digit value does not change and React would skip the
  // update — dropping the repeat from the strip. Price changes every tick.
  const [recentDigits, setRecentDigits] = useState([]);
  useEffect(() => {
    if (lastDigit == null) return;
    setRecentDigits((prev) => [...prev.slice(-99), lastDigit]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const [category, setCategory] = useState("evenodd");
  const [mode, setMode] = useState("manual");
  const [stake, setStake] = useState(10);
  const [target, setTarget] = useState(0);
  const [stop, setStop] = useState(0);
  const [multiplier, setMultiplier] = useState(2);
  const [autoCount, setAutoCount] = useState(5);
  const [botBanner, setBotBanner] = useState(null);

  const [runState, setRunState] = useState("idle");
  const [activeSide, setActiveSide] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [activePositionId, setActivePositionId] = useState(null);
  const [manualMs, setManualMs] = useState(MANUAL_MS_DEFAULT);
  const [secondsLeft, setSecondsLeft] = useState(null);

  const [tradeError, setTradeError] = useState(null);
  const [configError, setConfigError] = useState(null);

  const resultTimer = useRef(null);
  const countdownTimer = useRef(null);

  const payout = +(stake + profitOf(stake)).toFixed(2);

  const handleAutoTick = useCallback(() => {
    store.refreshInFlight();
    emit("trade:refresh");
  }, [store]);

  const handleAutoFinish = useCallback(() => {
    store.refresh();
    emit("auto:stopped");
  }, [store]);

  const auto = useAutoTrade({
    onTick: handleAutoTick,
    onFinish: handleAutoFinish,
  });

  const canZoomIn = windowSize > ZOOM_MIN;
  const canZoomOut = windowSize < ZOOM_MAX;
  const zoomIn  = () => { if (canZoomIn)  setWindowSize((w) => Math.max(ZOOM_MIN, Math.round(w / ZOOM_STEP))); };
  const zoomOut = () => { if (canZoomOut) setWindowSize((w) => Math.min(ZOOM_MAX, Math.round(w * ZOOM_STEP))); };

  // /config is fetched once per session and shared. The hook keeps local
  // state so the page can render even if the request is slow or fails.
  useEffect(() => {
    let cancelled = false;
    loadConfig()
      .then((config) => {
        if (cancelled) return;
        if (Number.isFinite(config?.manualTradeMs)) setManualMs(config.manualTradeMs);
      })
      .catch((error) => {
        if (cancelled) return;
        setConfigError(
          getApiError(error, "Could not load trade settings. The default duration will be used.")
        );
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, []);

  const clearCountdown = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setSecondsLeft(null);
  };

  const validateManualTrade = () => {
    if (!activeMarket) return "Select a market before placing a trade.";
    if (!Number.isFinite(stake) || stake < MIN_STAKE) {
      return `Enter a stake of at least $${MIN_STAKE.toFixed(2)}.`;
    }
    if (store.balance != null && stake > Number(store.balance)) {
      return "Your balance is too low for this stake.";
    }
    return null;
  };

  const handleManualPlace = async (side) => {
    if (!activeMarket || activeSide) return;

    const validationError = validateManualTrade();
    if (validationError) {
      setTradeError(validationError);
      return;
    }

    setTradeError(null);
    setActiveSide(side);
    setRunState("starting");

    try {
      const position = await store.placeTrade({
        contract: side,
        stake,
        market: activeMarket.name,
        marketId: activeMarket.id,
      });

      if (!position?.id) {
        throw new Error("The trade was accepted but no position was returned.");
      }

      setActivePositionId(position.id);
      setRunState("running");

      emit("trade:placed", {
        id: position.id,
        marketId: activeMarket.id,
        market: activeMarket.name,
        contract: side,
        stake,
      });

      store.refreshInFlight();

      const total = Math.max(1, Math.round(manualMs / 1000));
      setSecondsLeft(total);

      if (countdownTimer.current) clearInterval(countdownTimer.current);
      countdownTimer.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s == null || s <= 1) {
            clearInterval(countdownTimer.current);
            countdownTimer.current = null;
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (error) {
      setActiveSide(null);
      setActivePositionId(null);
      setRunState("idle");
      clearCountdown();
      setTradeError(getApiError(error, "Your trade could not be placed."));
      emit("trade:error", { message: getApiError(error, "Trade failed") });
    }
  };

  const handleManualStop = async () => {
    setTradeError(null);

    if (!activePositionId) {
      setActiveSide(null);
      setRunState("idle");
      clearCountdown();
      return;
    }

    emit("trade:stopping", {
      id: activePositionId,
      marketId: activeMarket?.id,
      side: activeSide,
    });

    clearCountdown();
    setRunState("stopping");

    try {
      // The server decides the outcome; the client cannot influence it.
      // This just asks for settlement now instead of waiting for the reaper.
      await tradeApi.settle(activePositionId);
      store.refreshInFlight();
    } catch (error) {
      // If settlement fails the reaper will still close the trade when the
      // window expires, so we surface the error without resetting run state.
      setTradeError(getApiError(error, "Could not stop the trade. It will settle automatically."));
      setRunState("running");
      emit("trade:error", { message: getApiError(error, "Stop failed") });
    }
  };

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
    clearCountdown();

    emit("trade:stopped", { id: settled.id });
    store.refresh();

    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setLastResult(null), RESULT_FLASH_MS);
  }, [store.closed, activePositionId, activeSide]);

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
    setTradeError(null);

    if (!activeMarket) {
      setTradeError("Select a market before starting auto-trade.");
      return;
    }

    if (!Number.isFinite(stake) || stake < MIN_STAKE) {
      setTradeError(`Enter an auto-trade stake of at least $${MIN_STAKE.toFixed(2)}.`);
      return;
    }

    if (!Number.isFinite(autoCount) || autoCount < 1) {
      setTradeError("Set at least one auto-trade.");
      return;
    }

    if (store.balance != null && stake > Number(store.balance)) {
      setTradeError("Your balance is too low for this auto-trade stake.");
      return;
    }

    auto.start({
      count: autoCount,
      stake,
      targetProfit: target,
      stopLoss: stop,
      market: botBanner?.market?.name ?? activeMarket?.name ?? "Volatility 10",
    });

    emit("auto:started", {
      marketId: activeMarket.id,
      market: activeMarket.name,
      count: autoCount,
      stake,
    });
  };

  const handleAutoStop = () => {
    auto.stop();
    emit("auto:stopping");
  };

  const showMarketLoader = marketsLoading || !activeMarket;

  if (showMarketLoader && marketsError) {
    return (
      <div className="trade">
        <TradeErrorBanner
          sources={[
            {
              label: "Markets could not load",
              message: getApiError(marketsError, "Check your connection and try again."),
            },
          ]}
        />
      </div>
    );
  }

  if (showMarketLoader) {
    return <MarketLoader />;
  }

  const errorSources = [
    { label: "Trade problem", message: tradeError, clear: () => setTradeError(null) },
    { label: "Auto-trade problem", message: auto.error },
    { label: "Notice", message: configError, clear: () => setConfigError(null) },
    { label: "Market problem", message: marketsError },
  ];

  return (
    <div className="trade">
      <CategoryTabs value={category} onChange={setCategory} />

      <TradeErrorBanner sources={errorSources} />

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
            onChange={(m) => {
              setTradeError(null);
              setActiveId(m.id);
            }}
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
            secondsLeft={secondsLeft}
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
          onStop={handleAutoStop}
        />
      )}
    </div>
  );
}
