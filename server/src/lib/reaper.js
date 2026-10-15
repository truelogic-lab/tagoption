import { pushNotification } from "./notify.js";
import { rollOutcome, effectiveWinRate } from "./settlement.js";
import { MANUAL_MS } from "./manualWindow.js";

const TICK_MS = 2_000;

function newId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function startReaper(sql) {
  const tick = async () => {
    try {
      const stale = await sql`
        select id, user_id, market, contract, stake_cents, profit_cents, auto
        from trades
        where status = 'open'
          and opened_at < now() - (${MANUAL_MS}::bigint * interval '1 millisecond')
      `;

      for (const trade of stale) {
        const { rate } = await effectiveWinRate(trade.user_id);
        const result = rollOutcome(rate);
        const won = result === "won";

        const stakeCents = Number(trade.stake_cents);
        const profitCents = Number(trade.profit_cents);

        await sql.begin(async (tx) => {
          const balRows = await tx`
            select balance_cents, platform_cents, escrow_cents
            from balances where user_id = ${trade.user_id} for update
          `;
          const bal = balRows[0];
          if (!bal) return;
          if (Number(bal.escrow_cents) < stakeCents) return;

          let balance = Number(bal.balance_cents);
          let platform = Number(bal.platform_cents);
          let escrow = Number(bal.escrow_cents) - stakeCents;

          let creditCents = 0;
          if (won) {
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
            where user_id = ${trade.user_id}
          `;

          await tx`
            update trades set status = ${result}, closed_at = now() where id = ${trade.id}
          `;

          await tx`
            insert into transactions (id, user_id, type, amount_cents, reference)
            values (${newId("t")}, ${trade.user_id}, 'trade-settle', ${creditCents}, ${trade.id})
          `;
        });

        const amountWon = profitCents / 100;
        const amountLost = stakeCents / 100;
        const market = trade.market || "market";

        await pushNotification(sql, {
          userId: trade.user_id,
          type: "trade",
          title: won ? `Won $${amountWon.toFixed(2)}` : `Lost $${amountLost.toFixed(2)}`,
          body: won
            ? `${trade.contract} on ${market} settled in your favour`
            : `${trade.contract} on ${market} did not settle your way`,
          reference: `trade:${trade.id}`,
        });
      }
    } catch (e) {
      console.error("[reaper]", e.message);
    }
  };

  const id = setInterval(tick, TICK_MS);
  tick();
  return () => clearInterval(id);
}
