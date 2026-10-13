/**
 * Settles orphaned open trades.
 * Runs every 30s. Any trade open for > 60s is force-settled so escrow
 * doesn't get stuck. Result uses the same 95.2% win chance.
 */
import { pushNotification } from "./notify.js";

import { rollOutcome } from "./settlement.js";

const STALE_MS = 1_500;

export function startReaper(sql) {
  const tick = async () => {
    try {
      const stale = await sql`
        select id, user_id, stake_cents, profit_cents, status
        from trades
        where status = 'open'
          and opened_at < now() - interval '60 seconds'
      `;

      for (const trade of stale) {
        const result = rollOutcome();
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

          let balance = Number(bal.balance_cents);
          let platform = Number(bal.platform_cents);
          let escrow = Number(bal.escrow_cents);

          if (escrow < stakeCents) return;
          escrow -= stakeCents;

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
            values (
              ${`t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
              ${trade.user_id},
              'trade-settle',
              ${creditCents},
              ${trade.id}
            )
          `;
        });

        // Deduped notification — safe if the reaper runs twice
        await pushNotification(sql, {
          userId: trade.user_id,
          type: "trade",
          title: won ? "Trade won" : "Trade lost",
          body: won
            ? `+$${(profitCents / 100).toFixed(2)} profit credited.`
            : `-$${(stakeCents / 100).toFixed(2)} stake lost.`,
          reference: `trade:${trade.id}`,
        });
      }
    } catch (e) {
      console.error("[reaper] error:", e.message);
    }
  };

  const id = setInterval(tick, 800);
  tick();
  return () => clearInterval(id);
}
