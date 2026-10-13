import { useCallback, useEffect, useState } from "react";
import { isLive, walletApi, tradeApi } from "../../lib/api";
import { open, settle as settleEngine, profitOf } from "../../lib/tradeEngine";

const KEY_PREFIX = "tagoption.store.";
const EMPTY = {
  balance: 0, platformBalance: 0, escrowBalance: 0, volume: 0,
  positions: [], closed: [], tx: [],
};

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      balance: typeof p.balance === "number" ? p.balance : 0,
      platformBalance: typeof p.platformBalance === "number" ? p.platformBalance : 0,
      escrowBalance: typeof p.escrowBalance === "number" ? p.escrowBalance : 0,
      volume: typeof p.volume === "number" ? p.volume : 0,
      positions: Array.isArray(p.positions) ? p.positions : [],
      closed: Array.isArray(p.closed) ? p.closed : [],
      tx: Array.isArray(p.tx) ? p.tx : [],
    };
  } catch { return null; }
}

function writeStore(key, state) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
}

function sessionEmail() {
  try {
    const raw = localStorage.getItem("tagoption.session");
    if (!raw) return "anon";
    return JSON.parse(raw)?.user?.email || "anon";
  } catch { return "anon"; }
}

export function useAppStore() {
  const [key] = useState(() => `${KEY_PREFIX}${sessionEmail()}`);
  const [state, setState] = useState(() => readStore(key) || EMPTY);

  useEffect(() => { writeStore(key, state); }, [key, state]);

  /** Pull everything fresh from the server. */
  const refresh = useCallback(async () => {
    if (!isLive()) return;
    try {
      const [balance, open_, closed, history] = await Promise.all([
        walletApi.balance(),
        tradeApi.open(),
        tradeApi.closed(),
        walletApi.history(),
      ]);
      setState((s) => ({
        ...s,
        balance: balance?.amount ?? s.balance,
        positions: open_ ?? s.positions,
        closed: closed ?? s.closed,
        tx: history ?? s.tx,
      }));
    } catch (e) {
      // Network issue — keep cached state
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Lightweight refresh during an auto run — pulls balance + trades but
   * skips wallet history (which only changes on deposit/withdraw).
   */
  const refreshInFlight = useCallback(async () => {
    if (!isLive()) return;
    try {
      const [balance, open_, closed] = await Promise.all([
        walletApi.balance(),
        tradeApi.open(),
        tradeApi.closed(),
      ]);
      setState((s) => ({
        ...s,
        balance: balance?.amount ?? s.balance,
        positions: open_ ?? s.positions,
        closed: closed ?? s.closed,
      }));
    } catch {}
  }, []);

  // Listen for a "reload-store" broadcast — fires when the auto run finishes
  useEffect(() => {
    const onReload = () => { refresh(); };
    window.addEventListener("tagoption:reload-store", onReload);
    return () => window.removeEventListener("tagoption:reload-store", onReload);
  }, [refresh]);

  const placeTrade = useCallback(async ({ contract, stake, market, marketId = "R_10", auto = false, payout }) => {
    const profit = profitOf(stake);

    if (isLive()) {
      const position = await tradeApi.place({
        marketId, marketName: market, contract, stake, auto,
      });
      setState((s) => ({
        ...s,
        balance: +(s.balance - stake).toFixed(2),
        positions: [position, ...s.positions],
      }));
      return position;
    }

    // Local fallback
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const openedAt = new Date().toISOString();
    const position = {
      id, contract, stake, payout: payout ?? profit, market, auto, openedAt, status: "open",
    };
    setState((s) => {
      const after = open({
        userBalance: s.balance,
        escrowBalance: s.escrowBalance,
        stake,
      });
      return {
        ...s,
        balance: after.userBalance,
        escrowBalance: after.escrowBalance,
        volume: +((s.volume || 0) + stake).toFixed(2),
        positions: [position, ...s.positions],
        tx: [
          { id: `t_${id}_open`, type: "trade-open", contract, market, stake, payout: position.payout, auto, at: openedAt },
          ...s.tx,
        ],
      };
    });
    return position;
  }, []);

  const settleTrade = useCallback(async (id, result) => {
    if (isLive()) {
      await tradeApi.settle(id, result);
      await refresh();
      return;
    }
    setState((s) => {
      const pos = s.positions.find((p) => p.id === id);
      if (!pos) return s;
      const closedAt = new Date().toISOString();
      const after = settleEngine({
        userBalance: s.balance,
        platformBalance: s.platformBalance,
        escrowBalance: s.escrowBalance,
        stake: pos.stake,
        result,
      });
      return {
        ...s,
        balance: after.userBalance,
        platformBalance: after.platformBalance,
        escrowBalance: after.escrowBalance,
        positions: s.positions.filter((p) => p.id !== id),
        closed: [{ ...pos, result, closedAt }, ...s.closed],
        tx: [
          { id: `t_${id}_settle`, type: "trade-settle", contract: pos.contract, market: pos.market, stake: pos.stake, payout: pos.payout, result, at: closedAt },
          ...s.tx,
        ],
      };
    });
  }, [refresh]);

  const resumeStale = useCallback((maxAgeMs = 8000) => {
    // Server handles this now — no-op locally when live
    if (isLive()) return;
    setState((s) => {
      const now = Date.now();
      const stale = s.positions.filter((p) => now - new Date(p.openedAt).getTime() > maxAgeMs);
      if (!stale.length) return s;
      let user = s.balance, platform = s.platformBalance, escrow = s.escrowBalance;
      const closed = [...s.closed], tx = [...s.tx];
      const stillOpen = s.positions.filter((p) => now - new Date(p.openedAt).getTime() <= maxAgeMs);
      stale.forEach((pos) => {
        const won = Math.random() < 0.952;
        const closedAt = new Date().toISOString();
        const after = settleEngine({
          userBalance: user, platformBalance: platform, escrowBalance: escrow,
          stake: pos.stake, result: won ? "won" : "lost",
        });
        user = after.userBalance;
        platform = after.platformBalance;
        escrow = after.escrowBalance;
        closed.unshift({ ...pos, result: won ? "won" : "lost", closedAt });
        tx.unshift({ id: `t_${pos.id}_settle`, type: "trade-settle", contract: pos.contract, market: pos.market, stake: pos.stake, payout: pos.payout, result: won ? "won" : "lost", at: closedAt });
      });
      return { ...s, balance: user, platformBalance: platform, escrowBalance: escrow, positions: stillOpen, closed, tx };
    });
  }, []);

  const deposit = useCallback(async ({ amount, method, details }) => {
    if (isLive()) {
      await walletApi.deposit({ amount, method });
      await refresh();
      notify({ type: "deposit", title: "Deposit received", body: `$${amount.toFixed(2)} via ${method}` });
      return;
    }
    const at = new Date().toISOString();
    setState((s) => ({
      ...s,
      balance: +(s.balance + amount).toFixed(2),
      tx: [{ id: `t_${Date.now()}`, type: "deposit", amount, method, details, at }, ...s.tx],
    }));
  }, [refresh]);

  const withdraw = useCallback(async ({ amount, method, details }) => {
    if (isLive()) {
      await walletApi.withdraw({ amount, method });
      await refresh();
      notify({ type: "withdraw", title: "Withdrawal requested", body: `$${amount.toFixed(2)} to ${method}` });
      return;
    }
    const at = new Date().toISOString();
    setState((s) => {
      if (s.balance < amount) return s;
      return {
        ...s,
        balance: +(s.balance - amount).toFixed(2),
        tx: [{ id: `t_${Date.now()}`, type: "withdraw", amount, method, details, at }, ...s.tx],
      };
    });
  }, [refresh]);

  const clear = useCallback(() => setState(EMPTY), []);

  return {
    balance: state.balance,
    platformBalance: state.platformBalance,
    escrowBalance: state.escrowBalance,
    volume: state.volume,
    positions: state.positions,
    closed: state.closed,
    tx: state.tx,
    placeTrade, settleTrade, resumeStale, refresh, refreshInFlight,
    deposit, withdraw, clear,
  };
}
