"""
Settle manual trades that have passed their window.

Run on a loop (Render cron job, or `python manage.py reap --loop` in dev).
    python manage.py reap             # one pass
    python manage.py reap --loop      # every 2 seconds until Ctrl+C
"""
import time
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from django.utils import timezone

from accounts.models import new_id
from accounts.notifications import Notification
from trading.models import Trade
from trading.settlement import effective_win_rate, roll_outcome
from wallet.models import Balance, Transaction


def new_tx_id():
    return new_id("t")


def settle_one(trade):
    with db_transaction.atomic():
        try:
            trade = Trade.objects.select_for_update().get(id=trade.id)
        except Trade.DoesNotExist:
            return None

        if trade.status != Trade.STATUS_OPEN:
            return None

        win_rate, _ = effective_win_rate(trade.user)
        result = roll_outcome(win_rate)
        won = result == "won"

        balance = Balance.objects.select_for_update().get(user=trade.user)
        stake_cents = trade.stake_cents
        profit_cents = trade.profit_cents

        balance.escrow_cents -= stake_cents
        credit_cents = 0

        if won:
            credit_cents = stake_cents + profit_cents
            balance.balance_cents += credit_cents
            balance.platform_cents -= profit_cents
        else:
            balance.platform_cents += stake_cents

        balance.save()

        trade.status = Trade.STATUS_WON if won else Trade.STATUS_LOST
        trade.closed_at = timezone.now()
        trade.save()

        Transaction.objects.create(
            id=new_tx_id(),
            user=trade.user,
            type="trade-settle",
            amount_cents=credit_cents,
            reference=trade.id,
            status="completed",
        )

        Notification.objects.create(
            user=trade.user,
            type="trade",
            title=f"Won ${profit_cents / 100:.2f}" if won else f"Lost ${stake_cents / 100:.2f}",
            body=(
                f"{trade.contract} on {trade.market} settled in your favour"
                if won else
                f"{trade.contract} on {trade.market} did not settle your way"
            ),
            reference=f"trade:{trade.id}",
        )

        return {
            "id": trade.id,
            "user_id": trade.user_id,
            "market": trade.market,
            "contract": trade.contract,
            "result": result,
            "stake": stake_cents / 100,
            "profit": profit_cents / 100,
            "credit": credit_cents / 100,
        }


def reap_pass():
    window = timedelta(milliseconds=settings.MANUAL_TRADE_MS)
    cutoff = timezone.now() - window

    open_trades = Trade.objects.filter(
        status=Trade.STATUS_OPEN,
        auto=False,
        opened_at__lt=cutoff,
    )[:100]

    settled = []
    for trade in open_trades:
        result = settle_one(trade)
        if result:
            settled.append(result)

    return settled


class Command(BaseCommand):
    help = "Settle manual trades that have passed their window."

    def add_arguments(self, parser):
        parser.add_argument("--loop", action="store_true", help="Run continuously")

    def handle(self, *args, **options):
        if options["loop"]:
            self.stdout.write("Reaper running. Ctrl+C to stop.")
            try:
                while True:
                    self._pass()
                    time.sleep(2)
            except KeyboardInterrupt:
                self.stdout.write("Reaper stopped.")
        else:
            self._pass()

    def _pass(self):
        settled = reap_pass()
        if settled:
            for row in settled:
                self.stdout.write(
                    f"Settled {row['id']} {row['result']} stake=${row['stake']} credit=${row['credit']}"
                )
