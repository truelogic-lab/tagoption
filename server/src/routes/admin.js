import { z } from "zod";
import { sql } from "../db/index.js";
import { pushNotification } from "../lib/notify.js";

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function audit(req, action, target = {}, payload = {}) {
  await sql`
    insert into admin_audit (id, admin_id, action, target_type, target_id, payload)
    values (
      ${newId("a")}, ${req.adminId}, ${action},
      ${target.type ?? null}, ${target.id ?? null},
      ${payload ? JSON.stringify(payload) : null}
    )
  `;
}

export default async function adminRoutes(fastify) {
  fastify.addHook("preHandler", fastify.requireAuth);
  fastify.addHook("preHandler", fastify.requireAdmin);

  /* ---------------- overview ---------------- */

  fastify.get("/admin/overview", async () => {
    const [users] = await sql`select count(*)::int as n from users`;
    const [balances] = await sql`
      select
        coalesce(sum(balance_cents), 0)::bigint as total_user_balance,
        coalesce(sum(platform_cents), 0)::bigint as total_platform,
        coalesce(sum(escrow_cents), 0)::bigint as total_escrow,
        coalesce(sum(volume_cents), 0)::bigint as total_volume
      from balances
    `;
    const [trades] = await sql`
      select
        count(*)::int as total,
        count(*) filter (where status = 'open')::int as open,
        count(*) filter (where status = 'won')::int as won,
        count(*) filter (where status = 'lost')::int as lost
      from trades
    `;
    const [tx] = await sql`
      select
        count(*) filter (where type = 'deposit' and status = 'completed')::int as deposits,
        count(*) filter (where type = 'withdraw' and status = 'completed')::int as withdrawals,
        count(*) filter (where status = 'pending')::int as pending
      from transactions
    `;

    const totalSettled = trades.won + trades.lost;
    const winRate = totalSettled ? trades.won / totalSettled : 0;
    const volume = Number(balances.total_volume) / 100;
    const platform = Number(balances.total_platform) / 100;
    const edge = volume > 0 ? platform / volume : 0;

    return {
      users: users.n,
      totalUserBalance: Number(balances.total_user_balance) / 100,
      totalPlatform: platform,
      totalEscrow: Number(balances.total_escrow) / 100,
      totalVolume: volume,
      trades,
      transactions: tx,
      winRate,
      edge,
    };
  });

  /* ---------------- users ---------------- */

  fastify.get("/admin/users", async (req) => {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 50, 500);

    let rows;
    if (q) {
      const like = `%${q}%`;
      rows = await sql`
        select u.id, u.email, u.name, u.role, u.created_at,
               coalesce(b.balance_cents, 0)::bigint as balance_cents,
               coalesce(b.platform_cents, 0)::bigint as platform_cents,
               coalesce(b.volume_cents, 0)::bigint as volume_cents
        from users u
        left join balances b on b.user_id = u.id
        where u.email ilike ${like} or u.name ilike ${like} or u.id = ${q}
        order by u.created_at desc
        limit ${limit}
      `;
    } else {
      rows = await sql`
        select u.id, u.email, u.name, u.role, u.created_at,
               coalesce(b.balance_cents, 0)::bigint as balance_cents,
               coalesce(b.platform_cents, 0)::bigint as platform_cents,
               coalesce(b.volume_cents, 0)::bigint as volume_cents
        from users u
        left join balances b on b.user_id = u.id
        order by u.created_at desc
        limit ${limit}
      `;
    }

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
      balance: Number(r.balance_cents) / 100,
      platform: Number(r.platform_cents) / 100,
      volume: Number(r.volume_cents) / 100,
    }));
  });

  /* ---------------- trades ---------------- */

  fastify.get("/admin/trades", async (req) => {
    const status = req.query.status || "all";
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    let rows;
    if (status === "all") {
      rows = await sql`
        select t.*, u.email from trades t
        join users u on u.id = t.user_id
        order by t.opened_at desc limit ${limit}
      `;
    } else {
      rows = await sql`
        select t.*, u.email from trades t
        join users u on u.id = t.user_id
        where t.status = ${status}
        order by t.opened_at desc limit ${limit}
      `;
    }

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      email: r.email,
      market: r.market,
      contract: r.contract,
      stake: Number(r.stake_cents) / 100,
      payout: Number(r.profit_cents) / 100,
      status: r.status,
      auto: r.auto,
      openedAt: r.opened_at,
      closedAt: r.closed_at,
    }));
  });

  /* ---------------- transactions ---------------- */

  fastify.get("/admin/transactions", async (req) => {
    const type = req.query.type || "all";
    const status = req.query.status || "all";
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const rows = await sql`
      select t.*, u.email from transactions t
      join users u on u.id = t.user_id
      where (${type} = 'all' or t.type = ${type})
        and (${status} = 'all' or t.status = ${status})
      order by t.at desc limit ${limit}
    `;

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      email: r.email,
      type: r.type,
      amount: Number(r.amount_cents) / 100,
      method: r.method,
      reference: r.reference,
      status: r.status,
      at: r.at,
    }));
  });

  /* ---------------- force settle a trade ---------------- */

  const forceSettle = z.object({
    result: z.enum(["won", "lost"]),
  });

  fastify.post("/admin/trades/:id/settle", async (req, reply) => {
    const parse = forceSettle.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { result } = parse.data;

    const out = await sql.begin(async (tx) => {
      const tradeRows = await tx`select * from trades where id = ${req.params.id} for update`;
      if (!tradeRows.length) throw new Error("Trade not found");
      const trade = tradeRows[0];
      if (trade.status !== "open") throw new Error("Trade already settled");

      const stakeCents = Number(trade.stake_cents);
      const profitCents = Number(trade.profit_cents);

      const balRows = await tx`
        select balance_cents, platform_cents, escrow_cents
        from balances where user_id = ${trade.user_id} for update
      `;
      const bal = balRows[0];

      let balance = Number(bal.balance_cents);
      let platform = Number(bal.platform_cents);
      let escrow = Number(bal.escrow_cents);

      if (escrow < stakeCents) throw new Error("Escrow mismatch");

      escrow -= stakeCents;
      let credit = 0;

      if (result === "won") {
        credit = stakeCents + profitCents;
        balance += credit;
        platform -= profitCents;
      } else {
        platform += stakeCents;
      }

      await tx`
        update balances set
          balance_cents = ${balance},
          platform_cents = ${platform},
          escrow_cents = ${escrow},
          updated_at = now()
        where user_id = ${trade.user_id}
      `;

      await tx`
        update trades set status = ${result}, closed_at = now()
        where id = ${trade.id}
      `;

      await tx`
        insert into transactions (id, user_id, type, amount_cents, reference, status)
        values (
          ${newId("t")}, ${trade.user_id}, 'trade-settle',
          ${credit}, ${trade.id}, 'completed'
        )
      `;

      return { id: trade.id, userId: trade.user_id, result, credit: credit / 100 };
    });

    await audit(req, "trade.settle", { type: "trade", id: out.id }, { result });
    await pushNotification(sql, {
      userId: out.userId,
      type: "trade",
      title: result === "won" ? "Trade won" : "Trade lost",
      body: result === "won" ? `+$${out.credit.toFixed(2)} credited.` : "Stake lost.",
      reference: `trade:${out.id}`,
    });

    return out;
  });

  /* ---------------- adjust user balance ---------------- */

  const adjust = z.object({
    amount: z.number(),     // dollars, + or -
    reason: z.string().min(1).max(200),
  });

  fastify.post("/admin/users/:id/adjust", async (req, reply) => {
    const parse = adjust.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { amount, reason } = parse.data;

    const cents = Math.round(amount * 100);

    await sql.begin(async (tx) => {
      await tx`
        update balances set balance_cents = balance_cents + ${cents}, updated_at = now()
        where user_id = ${req.params.id}
      `;
      await tx`
        insert into transactions (id, user_id, type, amount_cents, reference, status)
        values (
          ${newId("t")}, ${req.params.id}, ${cents >= 0 ? "deposit" : "withdraw"},
          ${Math.abs(cents)}, ${`admin:${req.adminId}`}, 'completed'
        )
      `;
    });

    await audit(req, "user.adjust", { type: "user", id: req.params.id }, { amount, reason });
    await pushNotification(sql, {
      userId: req.params.id,
      type: cents >= 0 ? "deposit" : "withdraw",
      title: cents >= 0 ? "Balance credited" : "Balance adjusted",
      body: `${cents >= 0 ? "+" : ""}$${amount.toFixed(2)} · ${reason}`,
      reference: `admin-adjust:${Date.now()}`,
    });

    return { ok: true };
  });

  /* ---------------- audit log ---------------- */

  fastify.get("/admin/audit", async (req) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await sql`
      select a.*, u.email from admin_audit a
      join users u on u.id = a.admin_id
      order by a.at desc limit ${limit}
    `;
    return rows.map((r) => ({
      id: r.id,
      adminEmail: r.email,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      payload: r.payload,
      at: r.at,
    }));
  });

  /* ---------------- market config ---------------- */

  fastify.get("/admin/markets", async () => {
    const rows = await sql`
      select id, name, symbol, base_price_cents, category, active
      from markets order by id
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      symbol: r.symbol,
      base: Number(r.base_price_cents) / 100,
      category: r.category,
      active: r.active,
    }));
  });
}
