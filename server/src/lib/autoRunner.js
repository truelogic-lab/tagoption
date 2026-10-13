/**
 * Server-side auto-trade runner.
 *
 * One active run per user (keyed by userId). Runs a sequence of trades,
 * placing and settling each on a server timer. Not persisted across
 * server restarts — acceptable for now, add Redis later for HA.
 *
 *   startAuto({ userId, count, stake, targetProfit, stopLoss, market })
 *     → runId
 *   stopAuto(userId)
 *   getRun(userId)   → { runId, running, progress, pnl, startedAt, endedAt, error }
 */

import { pushNotification } from "./notify.js";

const runs = new Map(); // userId → run state

const SETTLE_MS = 4500;
const INTERTRADE_MS = 700;
const WIN_CHANCE = 0.952;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Placing a trade here mirrors POST /trades — same DB writes, same engine.
 * Keeping it inline avoids HTTP roundtrips during a run.
 */
async function openTrade({ sql, userId, market, contract, stake, auto = true }) {
  const stakeCents = Math.round(stake * 100);
  const profitCents = Math.round(stake * 100 * 0.952);
  const id = newId("p");

  await sql.begin(async (tx) => {
    const balRows = await tx`
      select balance_cents, escrow_cents from balances
      where user_id = ${userId} for update
    `;
    const row = balRows[0];
    if (!row) throw new Error("No balance record");
    if (Number(row.balance_cents) < stakeCents) throw new Error("Insufficient balance");

    await tx`
      update balances
      set balance_cents = balance_cents - ${stakeCents},
          escrow_cents = escrow_cents + ${stakeCents},
          volume_cents = volume_cents + ${stakeCents},
          updated_at = now()
      where user_id = ${userId}
    `;

    await tx`
      insert into trades (id, user_id, market, contract, stake_cents, profit_cents, status, auto)
      values (${id}, ${userId}, ${market}, ${contract}, ${stakeCents}, ${profitCents}, 'open', ${auto})
    `;

    await tx`
      insert into transactions (id, user_id, type, amount_cents, reference)
      values (${newId("t")}, ${userId}, 'trade-open', ${-stakeCents}, ${id})
    `;
  });

  return { id, stake, profit: profitCents / 100 };
}

async function settleTrade({ sql, userId, tradeId, result }) {
  return sql.begin(async (tx) => {
    const tradeRows = await tx`
      select * from trades where id = ${tradeId} and user_id = ${userId} for update
    `;
    if (!tradeRows.length) throw new Error("Trade not found");
    const trade = tradeRows[0];
    if (trade.status !== "open") throw new Error("Trade already settled");

    const stakeCents = Number(trade.stake_cents);
    const profitCents = Number(trade.profit_cents);

    const balRows = await tx`
      select balance_cents, platform_cents, escrow_cents from balances
      where user_id = ${userId} for update
    `;
    const row = balRows[0];

    let balance = Number(row.balance_cents);
    let platform = Number(row.platform_cents);
    let escrow = Number(row.escrow_cents);

    // Move stake out of escrow
    escrow -= stakeCents;

    let creditCents = 0;
    if (result === "won") {
      creditCents = stakeCents + profitCents;
      balance += creditCents;
      platform -= profitCents;
    } else {
      platform += stakeCents;
    }

    await tx`
      update balances
      set balance_cents = ${balance},
          platform_cents = ${platform},
          escrow_cents = ${escrow},
          updated_at = now()
      where user_id = ${userId}
    `;

    await tx`
      update trades set status = ${result}, closed_at = now() where id = ${tradeId}
    `;

    await tx`
      insert into transactions (id, user_id, type, amount_cents, reference)
      values (${newId("t")}, ${userId}, 'trade-settle', ${creditCents}, ${tradeId})
    `;

    return { id: tradeId, result, credit: creditCents / 100 };
  });
}

export function getRun(userId) {
  const r = runs.get(userId);
  return r ? {
    runId: r.runId,
    running: r.running,
    progress: r.progress,
    pnl: r.pnl,
    error: r.error,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
  } : null;
}

export function stopAuto(userId) {
  const r = runs.get(userId);
  if (!r) return false;
  r.cancel = true;
  return true;
}

export async function startAuto({ sql, userId, count, stake, targetProfit, stopLoss, market }) {
  if (runs.has(userId) && runs.get(userId).running) {
    throw new Error("Auto trade already running");
  }

  const run = {
    runId: newId("auto"),
    running: true,
    cancel: false,
    progress: { done: 0, total: count, wins: 0, losses: 0 },
    pnl: 0,
    error: null,
    startedAt: new Date().toISOString(),
    endedAt: null,
  };
  runs.set(userId, run);

  // Fire and forget — the client polls GET /trades/auto/status
  (async () => {
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;

    try {
      for (let i = 0; i < count; i++) {
        if (run.cancel) break;

        const contract = i % 2 === 0 ? "Even" : "Odd";

        const position = await openTrade({
          sql, userId, market, contract, stake, auto: true,
        });

        await sleep(SETTLE_MS);
        if (run.cancel) {
          // Force-settle so escrow isn't stranded
          await settleTrade({ sql, userId, tradeId: position.id, result: Math.random() < WIN_CHANCE ? "won" : "lost" });
          break;
        }

        const won = Math.random() < WIN_CHANCE;
        const settled = await settleTrade({
          sql, userId, tradeId: position.id, result: won ? "won" : "lost",
        });

        if (won) {
          wins += 1;
          totalPnl += settled.credit - stake; // net profit
        } else {
          losses += 1;
          totalPnl -= stake;
        }

        run.progress = { done: i + 1, total: count, wins, losses };
        run.pnl = +totalPnl.toFixed(2);

        if (targetProfit > 0 && totalPnl >= targetProfit) break;
        if (stopLoss > 0 && totalPnl <= -stopLoss) break;

        await sleep(INTERTRADE_MS);
      }
    } catch (e) {
      run.error = e.message;
    } finally {
      run.running = false;
      run.endedAt = new Date().toISOString();

      try {
        await pushNotification(sql, {
          userId,
          type: "trade",
          title: `Auto trade finished (${wins}W / ${losses}L)`,
          body: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)} net`,
        });
      } catch {}
    }
  })();

  return run.runId;
}
