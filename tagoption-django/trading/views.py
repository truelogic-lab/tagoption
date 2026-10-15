from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import new_id
from accounts.notifications import Notification
from wallet.models import Balance, Transaction

from .models import Trade
from .serializers import TradeSerializer
from .auto import start_auto, stop_auto, get_run
from .settlement import (
    effective_payout_mult,
    effective_win_rate,
    from_cents,
    profit_cents,
    roll_outcome,
    to_cents,
)


def _log_transaction(user, type_, amount_cents, reference=None, method=None, status_="completed"):
    Transaction.objects.create(
        id=new_id("t"),
        user=user,
        type=type_,
        amount_cents=amount_cents,
        method=method,
        reference=reference,
        status=status_,
    )


def _settle_locked(trade, result):
    """
    Apply the outcome to a locked trade and its owner's balance.

    Caller must hold the transaction lock on `trade`. Result must already be
    decided by the server (roll_outcome) — this function never trusts client
    input to decide whether the user won.
    """
    won = result == "won"
    balance = Balance.objects.select_for_update().get(user=trade.user)

    stake_cents = trade.stake_cents
    profit_cents_value = trade.profit_cents

    balance.escrow_cents -= stake_cents
    credit_cents = 0

    if won:
        credit_cents = stake_cents + profit_cents_value
        balance.balance_cents += credit_cents
        balance.platform_cents -= profit_cents_value
    else:
        balance.platform_cents += stake_cents

    balance.save()

    trade.status = Trade.STATUS_WON if won else Trade.STATUS_LOST
    trade.closed_at = timezone.now()
    trade.save()

    _log_transaction(trade.user, "trade-settle", credit_cents, reference=trade.id)

    Notification.objects.create(
        user=trade.user,
        type="trade",
        title=f"Won ${profit_cents_value / 100:.2f}" if won else f"Lost ${stake_cents / 100:.2f}",
        body=(
            f"{trade.contract} on {trade.market} settled in your favour"
            if won else
            f"{trade.contract} on {trade.market} did not settle your way"
        ),
        reference=f"trade:{trade.id}",
    )

    return credit_cents


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def trades_collection(request):
    if request.method == "POST":
        return _place(request)
    return _list(request)


def _place(request):
    market = request.data.get("marketName")
    contract = request.data.get("contract")
    stake = request.data.get("stake")

    if not market or not contract or stake in (None, ""):
        return Response({"error": "Invalid input"}, status=400)

    try:
        stake = float(stake)
    except (TypeError, ValueError):
        return Response({"error": "Invalid stake"}, status=400)

    if stake <= 0:
        return Response({"error": "Invalid stake"}, status=400)

    stake_cents = to_cents(stake)
    win_rate, _ = effective_win_rate(request.user)
    profit = profit_cents(stake_cents, effective_payout_mult())

    with db_transaction.atomic():
        # get_or_create + select_for_update in the same atomic block guarantees
        # the row exists and is locked before we read or mutate it.
        Balance.objects.get_or_create(user=request.user)
        balance = Balance.objects.select_for_update().get(user=request.user)

        if balance.balance_cents < stake_cents:
            return Response({"error": "Insufficient balance"}, status=400)

        balance.balance_cents -= stake_cents
        balance.escrow_cents += stake_cents
        balance.volume_cents += stake_cents
        balance.save()

        trade = Trade.objects.create(
            user=request.user,
            market=market,
            contract=contract,
            stake_cents=stake_cents,
            profit_cents=profit,
            status=Trade.STATUS_OPEN,
            auto=False,
            win_rate_applied=win_rate,
            payout_mult_applied=effective_payout_mult(),
        )

        _log_transaction(request.user, "trade-open", -stake_cents, reference=trade.id)

    return Response(
        {
            "id": trade.id,
            "contract": trade.contract,
            "market": trade.market,
            "stake": from_cents(trade.stake_cents),
            "payout": from_cents(trade.profit_cents),
            "status": "open",
            "auto": False,
        },
        status=201,
    )


def _list(request):
    status_filter = request.query_params.get("status")

    qs = Trade.objects.filter(user=request.user)
    if status_filter == "open":
        qs = qs.filter(status=Trade.STATUS_OPEN)
    elif status_filter == "closed":
        qs = qs.filter(status__in=[Trade.STATUS_WON, Trade.STATUS_LOST])

    return Response(TradeSerializer(qs[:200], many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def settle(request, trade_id):
    """
    Manual STOP. Server rolls the outcome; the client cannot influence it.
    Polling picks up the final state — no push event on this backend.
    """
    with db_transaction.atomic():
        try:
            trade = Trade.objects.select_for_update().get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({"error": "Trade not found"}, status=404)

        if trade.status != Trade.STATUS_OPEN:
            return Response({"error": "Already settled"}, status=409)

        win_rate, _ = effective_win_rate(request.user)
        result = roll_outcome(win_rate)

        credit_cents = _settle_locked(trade, result)

    return Response(
        {
            "id": trade.id,
            "contract": trade.contract,
            "market": trade.market,
            "stake": from_cents(trade.stake_cents),
            "payout": from_cents(trade.profit_cents),
            "result": result,
            "credit": from_cents(credit_cents),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def auto_start(request):
    count = request.data.get("count")
    stake = request.data.get("stake")
    market = request.data.get("market")
    target = request.data.get("targetProfit") or 0
    stop_loss = request.data.get("stopLoss") or 0

    if not count or not stake or not market:
        return Response({"error": "Invalid input"}, status=400)

    try:
        count = int(count)
        stake = float(stake)
        target = float(target)
        stop_loss = float(stop_loss)
    except (TypeError, ValueError):
        return Response({"error": "Invalid input"}, status=400)

    if count < 1 or count > 500 or stake <= 0:
        return Response({"error": "Invalid input"}, status=400)

    try:
        run = start_auto(request.user, count, stake, target, stop_loss, market)
    except RuntimeError as exc:
        return Response({"error": str(exc)}, status=400)

    return Response({"runId": run.run_id, "status": "running"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def auto_stop(request):
    stopped = stop_auto(request.user)
    return Response({"stopped": stopped})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auto_status(request):
    run = get_run(request.user)
    if not run:
        return Response({"running": False, "progress": None})
    return Response(run)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trades_history(request):
    """
    Closed-trade history for the client's History page. Same data as
    GET /trades?status=closed but accepts extra filters (from, to, limit).
    """
    qs = Trade.objects.filter(
        user=request.user,
        status__in=[Trade.STATUS_WON, Trade.STATUS_LOST],
    ).order_by("-closed_at")

    limit = request.query_params.get("limit")
    if limit:
        try:
            qs = qs[:max(1, min(500, int(limit)))]
        except (TypeError, ValueError):
            qs = qs[:200]
    else:
        qs = qs[:200]

    return Response(TradeSerializer(qs, many=True).data)
