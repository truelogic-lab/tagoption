"""
Server-side auto-trade runner. One active run per user, stored in AutoRun.
The loop runs in a background thread started by the start endpoint.
"""
import random
import threading
import time
import uuid
from datetime import timedelta

from django.db import transaction as db_transaction
from django.utils import timezone

from accounts.models import new_id
from accounts.notifications import Notification
from wallet.models import Balance, Transaction

from .models import AutoRun, Trade
from .settlement import effective_payout_mult, effective_win_rate, roll_outcome

SETTLE_SECONDS = 1.4
INTER_TRADE_SECONDS = 0.15
STALE_SECONDS = 60


def new_tx_id():
    return new_id("t")


def new_run_id():
    return f"auto_{uuid.uuid4().hex[:16]}"


def _log(user, type_, amount_cents, reference=None):
    Transaction.objects.create(
        id=new_tx_id(),
        user=user,
        type=type_,
        amount_cents=amount_cents,
        reference=reference,
        status="completed",
    )


def _open_trade(user, market, contract, stake_cents, profit_cents, win_rate):
    with db_transaction.atomic():
        balance = Balance.objects.select_for_update().get(user=user)
        if balance.balance_cents < stake_cents:
            raise RuntimeError("Insufficient balance")

        balance.balance_cents -= stake_cents
        balance.escrow_cents += stake_cents
        balance.volume_cents += stake_cents
        balance.save()

        trade = Trade.objects.create(
            user=user,
            market=market,
            contract=contract,
            stake_cents=stake_cents,
            profit_cents=profit_cents,
            status=Trade.STATUS_OPEN,
            auto=True,
            win_rate_applied=win_rate,
            payout_mult_applied=effective_payout_mult(),
        )

        _log(user, "trade-open", -stake_cents, reference=trade.id)
        return trade


def _settle_trade(trade, result):
    won = result == "won"

    with db_transaction.atomic():
        trade = Trade.objects.select_for_update().get(id=trade.id)
        if trade.status != Trade.STATUS_OPEN:
            return None

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

        _log(trade.user, "trade-settle", credit_cents, reference=trade.id)

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

        return {"credit": credit_cents, "profit": profit_cents, "stake": stake_cents}


def _run_loop(run_pk):
    try:
        while True:
            try:
                run = AutoRun.objects.get(pk=run_pk)
            except AutoRun.DoesNotExist:
                return

            if run.cancel or not run.running:
                return
            if run.done >= run.count:
                break

            user = run.user
            stake = run.stake_cents / 100
            stake_cents = run.stake_cents
            win_rate, _ = effective_win_rate(user)
            profit_cents = int(round(stake_cents * float(effective_payout_mult())))
            contract = "Even" if run.done % 2 == 0 else "Odd"

            try:
                trade = _open_trade(user, run.market, contract, stake_cents, profit_cents, win_rate)
            except Exception as exc:
                AutoRun.objects.filter(pk=run_pk).update(
                    running=False,
                    error=str(exc),
                    ended_at=timezone.now(),
                )
                return

            time.sleep(SETTLE_SECONDS)

            result = roll_outcome(win_rate)
            settled = _settle_trade(trade, result)

            if settled is None:
                AutoRun.objects.filter(pk=run_pk).update(
                    running=False,
                    error="settle-failed",
                    ended_at=timezone.now(),
                )
                return

            won = result == "won"
            delta_cents = settled["profit"] if won else -settled["stake"]

            with db_transaction.atomic():
                run = AutoRun.objects.select_for_update().get(pk=run_pk)
                run.done += 1
                run.wins += 1 if won else 0
                run.losses += 0 if won else 1
                run.pnl_cents += delta_cents
                run.save()

                remaining = run.count - run.done
                hit_target = run.target_cents > 0 and run.pnl_cents >= run.target_cents
                hit_stop = run.stop_cents > 0 and run.pnl_cents <= -run.stop_cents

            if remaining <= 0 or hit_target or hit_stop:
                AutoRun.objects.filter(pk=run_pk).update(
                    running=False, ended_at=timezone.now()
                )
                break

            time.sleep(INTER_TRADE_SECONDS)

        final = AutoRun.objects.get(pk=run_pk)
        if not final.ended_at:
            final.running = False
            final.ended_at = timezone.now()
            final.save()

        Notification.objects.create(
            user=final.user,
            type="trade",
            title=f"Auto trade finished ({final.wins}W / {final.losses}L)",
            body=f"{'+' if final.pnl_cents >= 0 else '-'}${abs(final.pnl_cents) / 100:.2f} net",
            reference=f"autorun:{final.run_id}",
        )
    except Exception as exc:
        try:
            AutoRun.objects.filter(pk=run_pk).update(
                running=False,
                error=str(exc),
                ended_at=timezone.now(),
            )
        except Exception:
            pass


def start_auto(user, count, stake, target_profit, stop_loss, market):
    stake_cents = int(round(stake * 100))
    target_cents = int(round(target_profit * 100))
    stop_cents = int(round(stop_loss * 100))

    existing = AutoRun.objects.filter(user=user).first()
    if existing and existing.running:
        age = (timezone.now() - existing.heartbeat_at).total_seconds()
        if age < STALE_SECONDS:
            raise RuntimeError("Auto trade already running")
        existing.running = False
        existing.ended_at = timezone.now()
        existing.save()

    run_id = new_run_id()

    AutoRun.objects.update_or_create(
        user=user,
        defaults={
            "run_id": run_id,
            "running": True,
            "cancel": False,
            "count": count,
            "done": 0,
            "wins": 0,
            "losses": 0,
            "stake_cents": stake_cents,
            "target_cents": target_cents,
            "stop_cents": stop_cents,
            "market": market,
            "pnl_cents": 0,
            "error": None,
            "ended_at": None,
        },
    )

    run = AutoRun.objects.get(user=user)
    thread = threading.Thread(target=_run_loop, args=(run.pk,), daemon=True)
    thread.start()
    return run


def stop_auto(user):
    run = AutoRun.objects.filter(user=user, running=True).first()
    if not run:
        return False
    run.cancel = True
    run.save()
    return True


def get_run(user):
    run = AutoRun.objects.filter(user=user).first()
    if not run:
        return None
    return {
        "runId": run.run_id,
        "running": run.running,
        "progress": {
            "done": run.done,
            "total": run.count,
            "wins": run.wins,
            "losses": run.losses,
        },
        "pnl": run.pnl_cents / 100,
        "error": run.error,
        "startedAt": run.started_at,
        "endedAt": run.ended_at,
    }
