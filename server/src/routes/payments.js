import { z } from "zod";
import { sql } from "../db/index.js";
import { pushNotification } from "../lib/notify.js";
import { getUsdKesRate, usdToKes } from "../lib/fx/index.js";
import {
  submitOrder,
  getTransactionStatus,
  isCompleted,
  isFailed,
} from "../lib/payments/pesapal.js";

const deposit = z.object({
  amount: z.number().positive().max(500000),   // USD
  method: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function paymentsRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);

  fastify.post("/payments/deposit", async (req, reply) => {
    const parse = deposit.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { amount: usdAmount, method, phone, email } = parse.data;

    const user = await sql`select email from users where id = ${req.userId}`;
    const userEmail = email || user[0]?.email;

    // Get live FX rate and compute the KES charge
    const { rate } = await getUsdKesRate();
    const kesAmount = usdToKes(usdAmount, rate);

    // Pre-create transaction as pending — store USD amount + KES amount + rate
    const ref = newId("t");
    await sql`
      insert into transactions (
        id, user_id, type, amount_cents, method, reference, status
      )
      values (
        ${ref}, ${req.userId}, 'deposit',
        ${Math.round(usdAmount * 100)},
        ${method}, ${null}, 'pending'
      )
    `;

    let order;
    try {
      order = await submitOrder({
        amount: kesAmount,          // what Pesapal charges
        currency: "KES",
        reference: ref,
        email: userEmail,
        phone,
        description: `Deposit $${usdAmount.toFixed(2)} USD`,
      });
    } catch (e) {
      await sql`update transactions set status = 'failed' where id = ${ref}`;
      return reply.code(502).send({ error: e.message || "Payment could not be started" });
    }

    await sql`
      update transactions
      set reference = ${order.order_tracking_id}
      where id = ${ref}
    `;

    return {
      id: ref,
      orderTrackingId: order.order_tracking_id,
      redirectUrl: order.redirect_url,
      usd: usdAmount,
      kes: kesAmount,
      rate,
      status: "pending",
    };
  });

  fastify.get("/payments/status/:orderTrackingId", async (req, reply) => {
    const { orderTrackingId } = req.params;

    const txs = await sql`
      select * from transactions
      where user_id = ${req.userId} and reference = ${orderTrackingId}
      limit 1
    `;
    if (!txs.length) return reply.code(404).send({ error: "Not found" });
    const tx = txs[0];

    if (tx.status === "completed") {
      return { status: "completed", amount: Number(tx.amount_cents) / 100 };
    }
    if (tx.status === "failed") {
      return { status: "failed", amount: Number(tx.amount_cents) / 100 };
    }

    let remote;
    try {
      remote = await getTransactionStatus(orderTrackingId);
    } catch (e) {
      return reply.code(502).send({ error: e.message });
    }

    if (isCompleted(remote.payment_status_description)) {
      await creditDeposit({
        userId: req.userId,
        txId: tx.id,
        amountUsd: Number(tx.amount_cents) / 100,
        method: tx.method,
      });
      return { status: "completed", amount: Number(tx.amount_cents) / 100 };
    }
    if (isFailed(remote.payment_status_description)) {
      await sql`update transactions set status = 'failed' where id = ${tx.id}`;
      return { status: "failed", amount: Number(tx.amount_cents) / 100 };
    }
    return { status: "pending", amount: Number(tx.amount_cents) / 100 };
  });

  fastify.register(async (ipn) => {
    ipn.post("/payments/ipn", async (req, reply) => {
      const body = req.body || {};
      const trackingId = body.OrderTrackingId || body.orderTrackingId;
      const merchantRef = body.OrderMerchantReference || body.orderMerchantReference;

      if (!trackingId) {
        reply.code(200).send({ status: 200 });
        return;
      }

      try {
        const remote = await getTransactionStatus(trackingId);

        const rows = merchantRef
          ? await sql`select * from transactions where id = ${merchantRef} limit 1`
          : await sql`select * from transactions where reference = ${trackingId} limit 1`;

        if (rows.length) {
          const tx = rows[0];

          if (tx.status !== "completed" && isCompleted(remote.payment_status_description)) {
            await creditDeposit({
              userId: tx.user_id,
              txId: tx.id,
              amountUsd: Number(tx.amount_cents) / 100,
              method: tx.method,
            });
          } else if (tx.status !== "completed" && isFailed(remote.payment_status_description)) {
            await sql`update transactions set status = 'failed' where id = ${tx.id}`;
          }
        }

        reply.code(200).send({ status: 200 });
      } catch (e) {
        fastify.log.error("[ipn] " + e.message);
        reply.code(200).send({ status: 200 });
      }
    });
  });

  async function creditDeposit({ userId, txId, amountUsd, method }) {
    await sql.begin(async (tx) => {
      const rows = await tx`
        select status from transactions where id = ${txId} for update
      `;
      if (!rows.length || rows[0].status === "completed") return;

      await tx`
        update balances
        set balance_cents = balance_cents + ${Math.round(amountUsd * 100)}, updated_at = now()
        where user_id = ${userId}
      `;

      await tx`
        update transactions set status = 'completed' where id = ${txId}
      `;

      await pushNotification(sql, {
        userId,
        type: "deposit",
        title: "Deposit received",
        body: `$${amountUsd.toFixed(2)} via ${method || "Payment"}`,
        reference: `deposit:${txId}`,
      });
    });
  }
}
