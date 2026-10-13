import { z } from "zod";
import { sql } from "../db/index.js";
import { open, settle, profitOf } from "../lib/tradeEngine.js";
import { startAuto, stopAuto, getRun } from "../lib/autoRunner.js";
import { pushNotification } from "../lib/notify.js";

const place = z.object({
  marketId: z.string(),
  marketName: z.string(),
  contract: z.enum(["Even", "Odd", "Over", "Under", "Matches", "Differs"]),
  stake: z.number().positive(),
  auto: z.boolean().optional(),
});

const settleIn = z.object({
  result: z.enum(["won", "lost"]),
});

const autoStart = z.object({
  count: z.number().int().min(1).max(200),
  stake: z.number().positive(),
  targetProfit: z.number().min(0).optional(),
  stopLoss: z.number().min(0).optional(),
  market: z.string(),
});

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function tradeRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);

  /* ---------- manual ---------- */

  fastify.post("/trades", async (req, reply) => {
    const parse = place.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { marketName, contract, stake, auto = false } = parse.data;

    const stakeCents = Math.round(stake * 100);
    const profitCents = Math.round(stake * 100 * 0.952);

    const id = newId("p");

    try {
      await sql.begin(async (tx) => {
        const balRows = await tx`
          select balance_cents, escrow_cents from balances
          where user_id = ${req.userId} for update
        `;
        const row = balRows[0];
        if (!row) throw new Error("No balance record");

        const afterOpen = open({
          userBalance: Number(row.balance_cents) / 100,
          escrowBalance: Number(row.escrow_cents) / 100,
          stake,
        });

        await tx`
          update balances
          set balance_cents = ${Math.round(afterOpen.userBalance * 100)},
              escrow_cents = ${Math.round(afterOpen.escrowBalance * 100)},
              volume_cents = volume_cents + ${stakeCents},
              updated_at = now()
          where user_id = ${req.userId}
        `;

        await tx`
          insert into trades (id, user_id, market, contract, stake_cents, profit_cents, status, auto)
          values (${id}, ${req.userId}, ${marketName}, ${contract}, ${stakeCents}, ${profitCents}, 'open', ${auto})
        `;

        await tx`
          insert into transactions (id, user_id, type, amount_cents, reference)
          values (${newId("t")}, ${req.userId}, 'trade-open', ${-stakeCents}, ${id})
        `;
      });

      return {
        id, contract, market: marketName, stake,
        payout: Number(profitCents) / 100,
        status: "open", auto,
      };
    } catch (e) {
      if (e.message === "Insufficient balance")
        return reply.code(400).send({ error: "Insufficient balance" });
      fastify.log.error(e);
      return reply.code(500).send({ error: "Trade failed" });
    }
  });

  fastify.post("/trades/:id/settle", async (req, reply) => {
    const parse = settleIn.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { result } = parse.data;

    try {
      const out = await sql.begin(async (tx) => {
        const tradeRows = await tx`
          select * from trades where id = ${req.params.id} and user_id = ${req.userId} for update
        `;
        if (!tradeRows.length) throw new Error("Trade not found");
        const trade = tradeRows[0];
        if (trade.status !== "open") throw new Error("Trade already settled");

        const stake = Number(trade.stake_cents) / 100;

        const balRows = await tx`
          select balance_cents, platform_cents, escrow_cents from balances
          where user_id = ${req.userId} for update
        `;
        const row = balRows[0];

        const after = settle({
          userBalance: Number(row.balance_cents) / 100,
          platformBalance: Number(row.platform_cents) / 100,
          escrowBalance: Number(row.escrow_cents) / 100,
          stake,
          result,
        });

        await tx`
          update balances
          set balance_cents = ${Math.round(after.userBalance * 100)},
              platform_cents = ${Math.round(after.platformBalance * 100)},
              escrow_cents = ${Math.round(after.escrowBalance * 100)},
              updated_at = now()
          where user_id = ${req.userId}
        `;

        await tx`
          update trades set status = ${result}, closed_at = now() where id = ${trade.id}
        `;

        const creditCents = result === "won"
          ? Number(trade.stake_cents) + Number(trade.profit_cents)
          : 0;

        await tx`
          insert into transactions (id, user_id, type, amount_cents, reference)
          values (${newId("t")}, ${req.userId}, 'trade-settle', ${creditCents}, ${trade.id})
        `;

        return {
          id: trade.id, contract: trade.contract, market: trade.market,
          stake, payout: Number(trade.profit_cents) / 100, result,
        };
      });

      await pushNotification(sql, {
        userId: req.userId,
        type: "trade",
        title: result === "won" ? "Trade won" : "Trade lost",
        body: result === "won"
          ? `+$${out.payout.toFixed(2)} profit credited.`
          : `-$${out.stake.toFixed(2)} stake lost.`,
        reference: `trade:${out.id}`,
      });

      return out;
    } catch (e) {
      if (e.message === "Trade not found") return reply.code(404).send({ error: "Trade not found" });
      if (e.message === "Trade already settled") return reply.code(409).send({ error: "Already settled" });
      fastify.log.error(e);
      return reply.code(500).send({ error: "Settle failed" });
    }
  });

  fastify.get("/trades", async (req) => {
    const status = req.query.status === "open" ? "open"
                 : req.query.status === "closed" ? "closed" : null;

    let rows;
    if (status === "open") {
      rows = await sql`
        select * from trades where user_id = ${req.userId} and status = 'open'
        order by opened_at desc
      `;
    } else if (status === "closed") {
      rows = await sql`
        select * from trades where user_id = ${req.userId} and status in ('won','lost')
        order by closed_at desc limit 200
      `;
    } else {
      rows = await sql`
        select * from trades where user_id = ${req.userId}
        order by opened_at desc limit 200
      `;
    }

    return rows.map((r) => ({
      id: r.id,
      contract: r.contract,
      market: r.market,
      stake: Number(r.stake_cents) / 100,
      payout: Number(r.profit_cents) / 100,
      result: r.status === "open" ? undefined : r.status,
      openedAt: r.opened_at,
      closedAt: r.closed_at,
      auto: r.auto,
    }));
  });

  /* ---------- auto ---------- */

  fastify.post("/trades/auto/start", async (req, reply) => {
    const parse = autoStart.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { count, stake, targetProfit = 0, stopLoss = 0, market } = parse.data;

    try {
      const runId = await startAuto({
        sql, userId: req.userId,
        count, stake, targetProfit, stopLoss, market,
      });
      return { runId, status: "running" };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  fastify.post("/trades/auto/stop", async (req) => {
    const ok = await stopAuto(sql, req.userId);
    return { stopped: ok };
  });

  fastify.get("/trades/auto/status", async (req) => {
    const run = await getRun(sql, req.userId);
    return run ?? { running: false, progress: null };
  });
}
