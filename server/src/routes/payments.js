import { z } from "zod";
import { sql } from "../db/index.js";
import { pushNotification } from "../lib/notify.js";
import {
  submitOrder,
  getTransactionStatus,
  isCompleted,
  isFailed,
} from "../lib/payments/pesapal.js";

const deposit = z.object({
  amount: z.number().positive().max(500000),
  method: z.string().min(1),           // "M-Pesa", "Card", "USDT (TRC20)"
  phone: z.string().optional(),
  email: z.string().email().optional(),
  currency: z.string().optional(),
});

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default async function paymentsRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);

  /* ---------- start a deposit ---------- */

  fastify.post("/payments/deposit", async (req, reply) => {
    const parse = deposit.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { amount, method, phone, email, currency } = parse.data;

    const user = await sql`select email from users where id = ${req.userId}`;
    const userEmail = email || user[0]?.email;

    // Pre-create the transaction as pending with a reference we control
    const ref = newId("t");
    await sql`
      insert into transactions (id, user_id, type, amount_cents, method, reference, status)
      values (${ref}, ${req.userId}, 'deposit', ${Math.round(amount * 100)}, ${method}, ${null}, 'pending')
    `;

    let order;
    try {
      order = await submitOrder({
        amount,
        currency: currency || "KES",
        reference: ref,
        email: userEmail,
        phone,
      });
    } catch (e) {
      await sql`update transactions set status = 'failed' where id = ${ref}`;
      return reply.code(502).send({ error: e.message || "Pesapal rejected the request" });
    }

    // Attach the tracking id to the tx so the webhook can find it
    await sql`
      update transactions
      set reference = ${order.order_tracking_id}
      where id = ${ref}
    `;

    return {
      id: ref,
      orderTrackingId: order.order_tracking_id,
      redirectUrl: order.redirect_url,
      status: "pending",
    };
  });

  /* ---------- client polls for status after redirect ---------- */

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

    // Ask Pesapal the real status
    let remote;
    try {
      remote = await getTransactionStatus(orderTrackingId);
    } catch (e) {
      return reply.code(502).send({ error: e.message });
    }

    if (isCompleted(remote.payment_status_description)) {
      await creditDeposit({ userId: req.userId, txId: tx.id, amount: Number(tx.amount_cents) / 100, method: tx.method });
      return { status: "completed", amount: Number(tx.amount_cents) / 100 };
    }
    if (isFailed(remote.payment_status_description)) {
      await sql`update transactions set status = 'failed' where id = ${tx.id}`;
      return { status: "failed", amount: Number(tx.amount_cents) / 100 };
    }
    return { status: "pending", amount: Number(tx.amount_cents) / 100 };
  });

  /* ---------- Pesapal webhook (IPN) ---------- */

  // NOTE: not authenticated by requireAuth — Pesapal hits this directly
  fastify.register(async (ipn) => {
    ipn.post("/payments/ipn", async (req, reply) => {
      // Pesapal's IPN body has orderTrackingId + orderMerchantReference
      const body = req.body || {};
      const trackingId = body.OrderTrackingId || body.orderTrackingId;
      const merchantRef = body.OrderMerchantReference || body.orderMerchantReference;

      if (!trackingId) {
        reply.code(200).send({ status: 200 });  // ack, nothing to do
        return;
      }

      try {
        // Fetch authoritative status
        const remote = await getTransactionStatus(trackingId);

        // Locate our tx — prefer merchant ref, fall back to tracking id
        const rows = merchantRef
          ? await sql`select * from transactions where id = ${merchantRef} limit 1`
          : await sql`select * from transactions where reference = ${trackingId} limit 1`;

        if (rows.length) {
          const tx = rows[0];

          if (tx.status !== "completed" && isCompleted(remote.payment_status_description)) {
            await creditDeposit({
              userId: tx.user_id,
              txId: tx.id,
              amount: Number(tx.amount_cents) / 100,
              method: tx.method,
            });
          } else if (tx.status !== "completed" && isFailed(remote.payment_status_description)) {
            await sql`update transactions set status = 'failed' where id = ${tx.id}`;
          }
        }

        reply.code(200).send({ status: 200 });
      } catch (e) {
        fastify.log.error("[pesapal ipn] " + e.message);
        // Ack anyway so Pesapal doesn't retry forever; the status endpoint
        // will still pick up the true state on the next client poll
        reply.code(200).send({ status: 200 });
      }
    });
  });

  /* ---------- internal: credit a deposit idempotently ---------- */

  async function creditDeposit({ userId, txId, amount, method }) {
    await sql.begin(async (tx) => {
      // Guard: only credit if still pending
      const rows = await tx`
        select status from transactions where id = ${txId} for update
      `;
      if (!rows.length || rows[0].status === "completed") return;

      await tx`
        update balances
        set balance_cents = balance_cents + ${Math.round(amount * 100)}, updated_at = now()
        where user_id = ${userId}
      `;

      await tx`
        update transactions set status = 'completed' where id = ${txId}
      `;

      await pushNotification(sql, {
        userId,
        type: "deposit",
        title: "Deposit received",
        body: `$${amount.toFixed(2)} via ${method || "Pesapal"}`,
        reference: `deposit:${txId}`,
      });
    });
  }
}
