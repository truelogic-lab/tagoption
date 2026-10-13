import { z } from "zod";
import { sql } from "../db/index.js";
import { pushNotification } from "../lib/notify.js";

const deposit = z.object({
  amount: z.number().positive().max(100000),
  method: z.enum(["M-Pesa", "USDT (TRC20)", "Card"]),
});

const withdraw = z.object({
  amount: z.number().positive(),
  method: z.enum(["M-Pesa", "USDT (TRC20)", "Card"]),
});

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function walletRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);

  fastify.get("/wallet/balance", async (req) => {
    const rows = await sql`select balance_cents from balances where user_id = ${req.userId}`;
    const cents = rows[0]?.balance_cents ?? 0n;
    return { amount: Number(cents) / 100 };
  });

  fastify.post("/wallet/deposit", async (req, reply) => {
    const parse = deposit.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { amount, method } = parse.data;
    const cents = Math.round(amount * 100);

    const txId = newId("t");
    await sql.begin(async (tx) => {
      await tx`update balances set balance_cents = balance_cents + ${cents}, updated_at = now() where user_id = ${req.userId}`;
      await tx`insert into transactions (id, user_id, type, amount_cents, method) values (${txId}, ${req.userId}, 'deposit', ${cents}, ${method})`;
    });

    await pushNotification(sql, {
      userId: req.userId,
      type: "deposit",
      title: "Deposit received",
      body: `$${amount.toFixed(2)} via ${method}`,
    });

    return { id: txId, status: "completed", amount, method };
  });

  fastify.post("/wallet/withdraw", async (req, reply) => {
    const parse = withdraw.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { amount, method } = parse.data;
    const cents = Math.round(amount * 100);

    const rows = await sql`select balance_cents from balances where user_id = ${req.userId} for update`;
    const balance = Number(rows[0]?.balance_cents ?? 0);
    if (balance < cents) return reply.code(400).send({ error: "Insufficient balance" });

    const txId = newId("t");
    await sql.begin(async (tx) => {
      await tx`update balances set balance_cents = balance_cents - ${cents}, updated_at = now() where user_id = ${req.userId}`;
      await tx`insert into transactions (id, user_id, type, amount_cents, method) values (${txId}, ${req.userId}, 'withdraw', ${-cents}, ${method})`;
    });

    await pushNotification(sql, {
      userId: req.userId,
      type: "withdraw",
      title: "Withdrawal requested",
      body: `$${amount.toFixed(2)} to ${method}`,
    });

    return { id: txId, status: "pending", amount, method };
  });

  fastify.get("/wallet/history", async (req) => {
    const rows = await sql`
      select id, type, amount_cents, method, reference, at
      from transactions
      where user_id = ${req.userId}
      order by at desc
      limit 200
    `;
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount_cents) / 100,
      method: r.method,
      reference: r.reference,
      at: r.at,
    }));
  });
}
