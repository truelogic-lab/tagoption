import test from "node:test";
import assert from "node:assert/strict";

import {
  profitOf,
  creditOnWin,
  open,
  settle,
  runTrade,
} from "../tradeEngine.js";

/* Deterministic RNG so statistical tests are reproducible across runs */
function withSeededRandom(seed, callback) {
  const originalRandom = Math.random;
  let state = seed >>> 0;

  Math.random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

/* ---------- unit ---------- */

test("profitOf(10) === 9.52", () => {
  assert.equal(profitOf(10), 9.52);
});

test("creditOnWin(10) === 19.52", () => {
  assert.equal(creditOnWin(10), 19.52);
});

test("open moves stake from user to escrow exactly", () => {
  const result = open({ userBalance: 500, escrowBalance: 0, stake: 10 });
  assert.deepEqual(result, { userBalance: 490, escrowBalance: 10 });
});

test("settle lost moves escrow to platform exactly", () => {
  const afterOpen = open({ userBalance: 500, escrowBalance: 0, stake: 10 });
  const result = settle({
    userBalance: afterOpen.userBalance,
    platformBalance: 0,
    escrowBalance: afterOpen.escrowBalance,
    stake: 10,
    result: "lost",
  });
  assert.deepEqual(result, {
    userBalance: 490,
    platformBalance: 10,
    escrowBalance: 0,
    profit: 9.52,
    won: false,
  });
});

test("settle won moves escrow to user and charges profit to platform", () => {
  const afterOpen = open({ userBalance: 500, escrowBalance: 0, stake: 10 });
  const result = settle({
    userBalance: afterOpen.userBalance,
    platformBalance: 0,
    escrowBalance: afterOpen.escrowBalance,
    stake: 10,
    result: "won",
  });
  assert.deepEqual(result, {
    userBalance: 509.52,
    platformBalance: -9.52,
    escrowBalance: 0,
    profit: 9.52,
    won: true,
  });
});

test("conservation holds before and after one trade", () => {
  const before = { userBalance: 500, platformBalance: 100, escrowBalance: 20 };
  const result = runTrade({ ...before, stake: 10, result: "won" });
  const totalBefore = before.userBalance + before.platformBalance + before.escrowBalance;
  const totalAfter = result.userBalance + result.platformBalance + result.escrowBalance;
  assert.equal(totalAfter, totalBefore);
});

/* ---------- statistical ---------- */

test("infinite-bankroll edge is within tolerance", () => {
  withSeededRandom(1, () => {
    const N = 500_000;
    const stake = 10;

    let userBalance = 1_000_000_000;
    let platformBalance = 0;
    let escrowBalance = 0;
    let volume = 0;

    for (let i = 0; i < N; i++) {
      const result = Math.random() < 0.5 ? "won" : "lost";
      const trade = runTrade({
        userBalance, platformBalance, escrowBalance, stake, result,
      });
      userBalance = trade.userBalance;
      platformBalance = trade.platformBalance;
      escrowBalance = trade.escrowBalance;
      volume += stake;
    }

    assert.ok(
      Math.abs(platformBalance / volume - 0.024) < 0.0015,
      `Observed edge: ${platformBalance / volume}`
    );
    assert.equal(escrowBalance, 0);
  });
});

test("population edge is within tolerance", () => {
  withSeededRandom(1, () => {
    const users = 200;
    const maxTrades = 1000;
    const stake = 10;

    let platformBalance = 0;
    let volume = 0;

    for (let u = 0; u < users; u++) {
      let userBalance = 500;
      for (let i = 0; i < maxTrades; i++) {
        if (userBalance < stake) break;
        const result = Math.random() < 0.5 ? "won" : "lost";
        const trade = runTrade({
          userBalance, platformBalance, escrowBalance: 0, stake, result,
        });
        userBalance = trade.userBalance;
        platformBalance = trade.platformBalance;
        volume += stake;
      }
    }

    assert.ok(volume > 0);
    assert.ok(
      Math.abs(platformBalance / volume - 0.024) < 0.0025,
      `Observed edge: ${platformBalance / volume}`
    );
  });
});

test("account life averages between 100 and 4000 trades", () => {
  withSeededRandom(1, () => {
    const users = 200;
    const maxTrades = 1000;
    const stake = 10;

    let totalTrades = 0;

    for (let u = 0; u < users; u++) {
      let userBalance = 500;
      let trades = 0;
      while (trades < maxTrades && userBalance >= stake) {
        const result = Math.random() < 0.5 ? "won" : "lost";
        const trade = runTrade({
          userBalance, platformBalance: 0, escrowBalance: 0, stake, result,
        });
        userBalance = trade.userBalance;
        trades++;
      }
      totalTrades += trades;
    }

    const avg = totalTrades / users;
    assert.ok(
      avg >= 100 && avg <= 4000,
      `Average account life: ${avg}`
    );
  });
});
