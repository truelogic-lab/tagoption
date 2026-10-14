import { pushNotification } from "./notify.js";
import { rollOutcome, effectiveWinRate, getConfig } from "./settlement.js";

const SETTLE_MS = 1400;
const INTERTRADE_MS = 150;
const STALE_MS = 60_000;
const HEARTBEAT_MS = 3_000;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function newId(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

async function ensureTable(sql) {
  await sql`
    create table if not exists auto_runs (
      user_id       text primary key references users(id) on delete cascade,
      run_id        text not null,
      running       boolean not null default false,
      cancel        boolean not null default false,
      count         int not null,
      done          int not null default 0,
      wins          int not null default 0,
      losses        int not null default 0,
      stake_cents   bigint not null,
      target_cents  bigint not null default 0,
      stop_cents    bigint not null default 0,
      market        text not null,
      pnl_cents     bigint not null default 0,
      error         text,
      started_at    timestamptz not null default now(),
      ended_at      timestamptz,
      heartbeat_at  timestamptz not null default now()
    )
  `;
}

async function openTrade({ sql, userId, market, contract, stake }) {
  const stakeCents = Math.round(stake * 100);
  const { rate: appliedRate } = await effectiveWinRate(userId);
  const { payoutMult } = getConfig();
  const profitCents = Math.round(stake * 100 * payoutMult);
  const id = newId("p");

  await sql.begin(async (tx) => {
    const balRows = await tx`
      select balance_cents, escrow_cents from balances where user_id = ${userId} for update
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
      insert into trades (id, user_id, market, contract, stake_cents, profit_cents, status, auto, win_rate_applied, payout_mult_applied)
      values (${id}, ${userId}, ${market}, ${contract}, ${stakeCents}, ${profitCents}, 'open', true, ${appliedRate}, ${payoutMult})
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
    if (trade.status !== "open") return { id: tradeId, result: trade.status, credit: 0 };

    const stakeCents = Number(trade.stake_cents);
    const profitCents = Number(trade.profit_cents);

    const balRows = await tx`
      select balance_cents, platform_cents, escrow_cents from balances where user_id = ${userId} for update
    `;
    const row = balRows[0];

    let balance = Number(row.balance_cents);
    let platform = Number(row.platform_cents);
    let escrow = Number(row.escrow_cents);
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
      set balance_cents = ${balance}, platform_cents = ${platform},
          escrow_cents = ${escrow}, updated_at = now()
      where user_id = ${userId}
    `;
    await tx`update trades set status = ${result}, closed_at = now() where id = ${tradeId}`;
    await tx`
      insert into transactions (id, user_id, type, amount_cents, reference)
      values (${newId("t")}, ${userId}, 'trade-settle', ${creditCents}, ${tradeId})
    `;

    return {
      id: tradeId, result,
      credit: creditCents / 100,
      stake: stakeCents / 100,
      profit: profitCents / 100,
    };
  });
}

export async function getRun(sql, userId) {
  await ensureTable(sql);
  const rows = await sql`select * from auto_runs where user_id = ${userId}`;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    runId: r.run_id,
    running: r.running,
    progress: { done: r.done, total: r.count, wins: r.wins, losses: r.losses },
    pnl: Number(r.pnl_cents) / 100,
    error: r.error,
    startedAt: r.started_at,
    endedAt: r.ended_at,
  };
}

export async function stopAuto(sql, userId) {
  await ensureTable(sql);
  const rows = await sql`select user_id from auto_runs where user_id = ${userId} and running = true`;
  if (!rows.length) return false;
  await sql`update auto_runs set cancel = true where user_id = ${userId}`;
  return true;
}

export async function startAuto({ sql, userId, count, stake, targetProfit, stopLoss, market }) {
  await ensureTable(sql);

  const existing = await sql`select * from auto_runs where user_id = ${userId}`;
  if (existing.length && existing[0].running) {
    const age = Date.now() - new Date(existing[0].heartbeat_at).getTime();
    if (age < STALE_MS) throw new Error("Auto trade already running");
    await sql`update auto_runs set running = false, ended_at = now() where user_id = ${userId}`;
  }

  const runId = newId("auto");
  const stakeCents = Math.round(stake * 100);
  const targetCents = Math.round(targetProfit * 100);
  const stopCents = Math.round(stopLoss * 100);

  await sql`
    insert into auto_runs (
      user_id, run_id, running, cancel,
      count, done, wins, losses,
      stake_cents, target_cents, stop_cents,
      market, pnl_cents, started_at, heartbeat_at
    )
    values (
      ${userId}, ${runId}, true, false,
      ${count}, 0, 0, 0,
      ${stakeCents}, ${targetCents}, ${stopCents},
      ${market}, 0, now(), now()
    )
    on conflict (user_id) do update set
      run_id = excluded.run_id,
      running = true,
      cancel = false,
      count = excluded.count,
      done = 0, wins = 0, losses = 0,
      stake_cents = excluded.stake_cents,
      target_cents = excluded.target_cents,
      stop_cents = excluded.stop_cents,
      market = excluded.market,
      pnl_cents = 0,
      error = null,
      started_at = now(),
      ended_at = null,
      heartbeat_at = now()
  `;

  runLoop({ sql, userId, runId }).catch(() => {});
  return runId;
}

async function runLoop({ sql, userId, runId }) {
  let lastHeartbeat = 0;

  try {
    while (true) {
      const rows = await sql`select * from auto_runs where user_id = ${userId} and run_id = ${runId}`;
      if (!rows.length) return;
      const run = rows[0];

      if (run.cancel) break;
      if (!run.running) return;
      if (run.done >= run.count) break;

      const stake = Number(run.stake_cents) / 100;
      const targetCents = Number(run.target_cents);
      const stopCents = Number(run.stop_cents);

      const now = Date.now();
      if (now - lastHeartbeat > HEARTBEAT_MS) {
        await sql`update auto_runs set heartbeat_at = now() where user_id = ${userId}`;
        lastHeartbeat = now;
      }

      const contract = run.done % 2 === 0 ? "Even" : "Odd";

      let position;
      try {
        position = await openTrade({ sql, userId, market: run.market, contract, stake });
      } catch (e) {
        await sql`update auto_runs set running = false, error = ${e.message}, ended_at = now() where user_id = ${userId}`;
        return;
      }

      await sleep(SETTLE_MS);

      const { rate } = await effectiveWinRate(userId);
      const won = rollOutcome(rate) === "won";

      let settled;
      try {
        settled = await settleTrade({ sql, userId, tradeId: position.id, result: won ? "won" : "lost" });
      } catch {
        await sql`update auto_runs set running = false, error = 'settle-failed', ended_at = now() where user_id = ${userId}`;
        return;
      }

      const pnlDeltaCents = won
        ? Math.round(settled.profit * 100)
        : -Math.round(stake * 100);

      const updated = await sql`
        update auto_runs set
          done = done + 1,
          wins = wins + ${won ? 1 : 0},
          losses = losses + ${won ? 0 : 1},
          pnl_cents = pnl_cents + ${pnlDeltaCents},
          heartbeat_at = now()
        where user_id = ${userId}
        returning *
      `;
      const next = updated[0];

      const remaining = next.count - next.done;
      if (remaining > 0 && targetCents > 0 && next.pnl_cents >= targetCents) break;
      if (remaining > 0 && stopCents > 0 && next.pnl_cents <= -stopCents) break;

      await sleep(INTERTRADE_MS);
    }
  } finally {
    const endRows = await sql`select * from auto_runs where user_id = ${userId}`;
    const final = endRows[0];

    await sql`
      update auto_runs set running = false, ended_at = now()
      where user_id = ${userId} and run_id = ${runId}
    `;

    if (final) {
      try {
        await pushNotification(sql, {
          userId,
          type: "trade",
          title: `Auto trade finished (${final.wins}W / ${final.losses}L)`,
          body: `${final.pnl_cents >= 0 ? "+" : ""}$${(final.pnl_cents / 100).toFixed(2)} net`,
          reference: `autorun:${runId}`,
        });
      } catch {}
    }
  }
}

export async function resumeOrphans(sql) {
  await ensureTable(sql);
  const rows = await sql`select user_id, run_id, running, heartbeat_at from auto_runs where running = true`;
  for (const r of rows) {
    const age = Date.now() - new Date(r.heartbeat_at).getTime();
    if (age < STALE_MS) {
      runLoop({ sql, userId: r.user_id, runId: r.run_id }).catch(() => {});
    } else {
      await sql`
        update auto_runs set running = false, error = 'orphaned', ended_at = now()
        where user_id = ${r.user_id}
      `;
    }
  }
}
