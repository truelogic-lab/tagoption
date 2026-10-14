import { z } from "zod";
import { sql } from "../db/index.js";
import { pushNotification } from "../lib/notify.js";
import {
  getConfig, setConfig, effectiveWinRate,
} from "../lib/settlement.js";

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

  /* ---------- overview ---------- */

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

  /* ---------- users list ---------- */

  fastify.get("/admin/users", async (req) => {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit) || 50, 500);

    let rows;
    if (q) {
      const like = `%${q}%`;
      rows = await sql`
        select u.id, u.email, u.name, u.role, u.created_at, u.win_rate_override, u.banned,
               coalesce(b.balance_cents, 0)::bigint as balance_cents,
               coalesce(b.volume_cents, 0)::bigint as volume_cents
        from users u left join balances b on b.user_id = u.id
        where u.email ilike ${like} or u.name ilike ${like} or u.id = ${q}
        order by u.created_at desc limit ${limit}
      `;
    } else {
      rows = await sql`
        select u.id, u.email, u.name, u.role, u.created_at, u.win_rate_override, u.banned,
               coalesce(b.balance_cents, 0)::bigint as balance_cents,
               coalesce(b.volume_cents, 0)::bigint as volume_cents
        from users u left join balances b on b.user_id = u.id
        order by u.created_at desc limit ${limit}
      `;
    }
    return rows.map((r) => ({
      id: r.id, email: r.email, name: r.name, role: r.role,
      createdAt: r.created_at,
      balance: Number(r.balance_cents) / 100,
      volume: Number(r.volume_cents) / 100,
      winRateOverride: r.win_rate_override != null ? Number(r.win_rate_override) : null,
      banned: r.banned,
    }));
  });

  /* ---------- user detail (feature #1) ---------- */

  fastify.get("/admin/users/:id", async (req, reply) => {
    const id = req.params.id;
    const userRows = await sql`
      select u.*, coalesce(b.balance_cents, 0)::bigint as balance_cents,
             coalesce(b.escrow_cents, 0)::bigint as escrow_cents,
             coalesce(b.platform_cents, 0)::bigint as platform_cents,
             coalesce(b.volume_cents, 0)::bigint as volume_cents
      from users u left join balances b on b.user_id = u.id
      where u.id = ${id} limit 1
    `;
    if (!userRows.length) return reply.code(404).send({ error: "User not found" });
    const u = userRows[0];

    const trades = await sql`
      select id, market, contract, stake_cents, profit_cents, status, auto,
             opened_at, closed_at, win_rate_applied
      from trades where user_id = ${id} order by opened_at desc limit 100
    `;
    const txs = await sql`
      select id, type, amount_cents, method, status, reference, at
      from transactions where user_id = ${id} order by at desc limit 100
    `;
    const adjustments = await sql`
      select a.id, a.action, a.payload, a.at
      from admin_audit a
      where a.target_type = 'user' and a.target_id = ${id}
      order by a.at desc limit 50
    `;

    const won = trades.filter((t) => t.status === "won").length;
    const lost = trades.filter((t) => t.status === "lost").length;
    const totalStaked = trades.reduce((s, t) => s + Number(t.stake_cents), 0) / 100;
    const netPnl = trades.reduce((s, t) => {
      if (t.status === "won") return s + Number(t.profit_cents) / 100;
      if (t.status === "lost") return s - Number(t.stake_cents) / 100;
      return s;
    }, 0);

    return {
      user: {
        id: u.id, email: u.email, name: u.name, role: u.role,
        banned: u.banned, verified: u.verified, createdAt: u.created_at,
        winRateOverride: u.win_rate_override != null ? Number(u.win_rate_override) : null,
        balance: Number(u.balance_cents) / 100,
        escrow: Number(u.escrow_cents) / 100,
        platform: Number(u.platform_cents) / 100,
        volume: Number(u.volume_cents) / 100,
      },
      stats: {
        trades: trades.length, won, lost,
        winRate: won + lost ? won / (won + lost) : 0,
        totalStaked, netPnl,
      },
      trades: trades.map((t) => ({
        id: t.id, market: t.market, contract: t.contract,
        stake: Number(t.stake_cents) / 100,
        payout: Number(t.profit_cents) / 100,
        status: t.status, auto: t.auto,
        openedAt: t.opened_at, closedAt: t.closed_at,
        winRateApplied: t.win_rate_applied != null ? Number(t.win_rate_applied) : null,
      })),
      transactions: txs.map((t) => ({
        id: t.id, type: t.type, amount: Number(t.amount_cents) / 100,
        method: t.method, status: t.status, reference: t.reference, at: t.at,
      })),
      adjustments: adjustments.map((a) => {
        // Drop the human reason — internal-only
        const { reason, ...rest } = a.payload || {};
        return { id: a.id, action: a.action, payload: rest, at: a.at };
      }),
    };
  });

  /* ---------- per-user win-rate override (feature #4) ---------- */

  const overrideBody = z.object({
    winRate: z.number().min(0).max(1).nullable(),
    reason: z.string().min(3).max(200),
  });

  fastify.post("/admin/users/:id/win-rate", async (req, reply) => {
    const parse = overrideBody.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const { winRate, reason } = parse.data;

    await sql`
      update users set win_rate_override = ${winRate} where id = ${req.params.id}
    `;

    await audit(req, "user.win_rate", { type: "user", id: req.params.id }, { winRate, reason });

    return { ok: true, winRate };
  });

  /* ---------- adjust balance ---------- */

  const adjust = z.object({
    amount: z.number(),
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

  /* ---------- manual deposit credit (feature #2) ---------- */

  fastify.post("/admin/transactions/:id/credit", async (req, reply) => {
    const rows = await sql`select * from transactions where id = ${req.params.id} limit 1`;
    if (!rows.length) return reply.code(404).send({ error: "Not found" });
    const tx = rows[0];
    if (tx.status === "completed") return reply.code(409).send({ error: "Already credited" });

    const amount = Number(tx.amount_cents) / 100;

    await sql.begin(async (t) => {
      await t`update transactions set status = 'completed' where id = ${tx.id}`;
      await t`
        update balances set balance_cents = balance_cents + ${Number(tx.amount_cents)}, updated_at = now()
        where user_id = ${tx.user_id}
      `;
    });

    await audit(req, "tx.manual_credit", { type: "transaction", id: tx.id }, { amount });
    await pushNotification(sql, {
      userId: tx.user_id,
      type: "deposit",
      title: "Deposit received",
      body: `$${amount.toFixed(2)} · manual approval`,
      reference: `deposit:${tx.id}`,
    });

    return { ok: true };
  });

  /* ---------- manual withdrawal approval (feature #3) ---------- */

  const approveWithdraw = z.object({
    providerRef: z.string().max(120).optional(),
  });

  fastify.post("/admin/transactions/:id/approve-withdraw", async (req, reply) => {
    const parse = approveWithdraw.safeParse(req.body || {});
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });

    const rows = await sql`select * from transactions where id = ${req.params.id} limit 1`;
    if (!rows.length) return reply.code(404).send({ error: "Not found" });
    const tx = rows[0];
    if (tx.type !== "withdraw") return reply.code(400).send({ error: "Not a withdrawal" });
    if (tx.status === "completed") return reply.code(409).send({ error: "Already approved" });

    await sql`
      update transactions set status = 'completed', reference = ${parse.data.providerRef || tx.reference || null}
      where id = ${tx.id}
    `;

    await audit(req, "tx.withdraw_approved", { type: "transaction", id: tx.id }, parse.data);
    return { ok: true };
  });

  /* ---------- platform P&L (feature #5) ---------- */

  fastify.get("/admin/pnl", async (req) => {
    const days = Math.min(Number(req.query.days) || 14, 90);

    const rows = await sql`
      select
        date_trunc('day', closed_at) as day,
        sum(case when status = 'won' then -profit_cents else stake_cents end)::bigint as pnl_cents,
        count(*) filter (where status = 'won')::int as wins,
        count(*) filter (where status = 'lost')::int as losses
      from trades
      where closed_at > now() - interval '1 day' * ${days}
        and status in ('won', 'lost')
      group by day
      order by day asc
    `;

    return rows.map((r) => ({
      day: r.day,
      pnl: Number(r.pnl_cents) / 100,
      wins: r.wins,
      losses: r.losses,
    }));
  });

  /* ---------- global config (win rate / payout) ---------- */

  fastify.get("/admin/config", async () => getConfig());

  const configBody = z.object({
    winRate: z.number().min(0).max(1).optional(),
    payoutMult: z.number().min(0).max(5).optional(),
  });

  fastify.post("/admin/config", async (req, reply) => {
    const parse = configBody.safeParse(req.body);
    if (!parse.success) return reply.code(400).send({ error: "Invalid input" });
    const result = await setConfig(parse.data);
    await audit(req, "config.update", {}, parse.data);
    return result;
  });

  /* ---------- global search (feature #6) ---------- */

  fastify.get("/admin/search", async (req) => {
    const q = String(req.query.q || "").trim();
    if (!q) return { users: [], trades: [], transactions: [] };
    const like = `%${q}%`;

    const users = await sql`
      select id, email, name from users
      where email ilike ${like} or name ilike ${like} or id = ${q}
      limit 10
    `;
    const trades = await sql`
      select id, market, contract, status from trades where id = ${q}
      limit 10
    `;
    const txs = await sql`
      select id, type, status, reference from transactions
      where id = ${q} or reference = ${q}
      limit 10
    `;

    return { users, trades, transactions: txs };
  });

  /* ---------- trades list ---------- */

  fastify.get("/admin/trades", async (req) => {
    const status = req.query.status || "all";
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    let rows;
    if (status === "all") {
      rows = await sql`
        select t.*, u.email from trades t join users u on u.id = t.user_id
        order by t.opened_at desc limit ${limit}
      `;
    } else {
      rows = await sql`
        select t.*, u.email from trades t join users u on u.id = t.user_id
        where t.status = ${status} order by t.opened_at desc limit ${limit}
      `;
    }
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, email: r.email,
      market: r.market, contract: r.contract,
      stake: Number(r.stake_cents) / 100,
      payout: Number(r.profit_cents) / 100,
      status: r.status, auto: r.auto,
      openedAt: r.opened_at, closedAt: r.closed_at,
      winRateApplied: r.win_rate_applied != null ? Number(r.win_rate_applied) : null,
    }));
  });

  fastify.post("/admin/trades/:id/settle", async (req, reply) => {
    const parse = z.object({ result: z.enum(["won", "lost"]) }).safeParse(req.body);
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
        update balances set balance_cents = ${balance}, platform_cents = ${platform},
          escrow_cents = ${escrow}, updated_at = now()
        where user_id = ${trade.user_id}
      `;
      await tx`update trades set status = ${result}, closed_at = now() where id = ${trade.id}`;
      await tx`
        insert into transactions (id, user_id, type, amount_cents, reference, status)
        values (${newId("t")}, ${trade.user_id}, 'trade-settle', ${credit}, ${trade.id}, 'completed')
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

  /* ---------- transactions list ---------- */

  fastify.get("/admin/transactions", async (req) => {
    const type = req.query.type || "all";
    const status = req.query.status || "all";
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const rows = await sql`
      select t.*, u.email from transactions t join users u on u.id = t.user_id
      where (${type} = 'all' or t.type = ${type})
        and (${status} = 'all' or t.status = ${status})
      order by t.at desc limit ${limit}
    `;
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, email: r.email,
      type: r.type, amount: Number(r.amount_cents) / 100,
      method: r.method, reference: r.reference, status: r.status, at: r.at,
    }));
  });

  /* ---------- audit ---------- */

  fastify.get("/admin/audit", async (req) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await sql`
      select id, action, target_type, target_id, payload, at
      from admin_audit
      order by at desc limit ${limit}
    `;
    return rows.map((r) => {
      const { reason, ...rest } = r.payload || {};
      return {
        id: r.id,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        payload: rest,
        at: r.at,
      };
    });
  });
}
