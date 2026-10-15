from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User, new_id
from accounts.notifications import Notification
from ops.models import AdminAudit
from trading.models import Trade
from wallet.models import Balance, Transaction, Withdrawal

from .audit import record
from .permissions import require_admin
from .serializers import (
    AdminUserSerializer,
    AdminTradeSerializer,
    AdminTransactionSerializer,
    AdminWithdrawalSerializer,
    AdminAuditSerializer,
)


def _user_row(user):
    bal = Balance.objects.filter(user=user).first()
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "verified": user.verified,
        "banned": user.banned,
        "win_rate_override": user.win_rate_override,
        "created_at": user.created_at,
        "balance": (bal.balance_cents / 100) if bal else 0.0,
        "escrow": (bal.escrow_cents / 100) if bal else 0.0,
    }


def _trade_row(t):
    return {
        "id": t.id,
        "user_id": t.user_id,
        "user_email": t.user.email,
        "market": t.market,
        "contract": t.contract,
        "stake": t.stake_cents / 100,
        "payout": t.profit_cents / 100,
        "status": t.status,
        "auto": t.auto,
        "win_rate_applied": float(t.win_rate_applied) if t.win_rate_applied is not None else None,
        "payout_mult_applied": float(t.payout_mult_applied) if t.payout_mult_applied is not None else None,
        "opened_at": t.opened_at,
        "closed_at": t.closed_at,
    }


def _tx_row(t):
    return {
        "id": t.id,
        "user_id": t.user_id,
        "user_email": t.user.email,
        "type": t.type,
        "amount": t.amount_cents / 100,
        "method": t.method,
        "reference": t.reference,
        "status": t.status,
        "at": t.at,
    }


def _withdrawal_row(w):
    return {
        "id": w.id,
        "user_id": w.user_id,
        "user_email": w.user.email,
        "amount": w.amount_cents / 100,
        "method": w.method,
        "destination": w.destination,
        "status": w.status,
        "reason": w.reason,
        "at": w.at,
        "reviewed_at": w.reviewed_at,
    }


def _paginate(request, default_limit=50, max_limit=200):
    try:
        page = max(1, int(request.query_params.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        limit = min(max_limit, max(1, int(request.query_params.get("limit", default_limit))))
    except (TypeError, ValueError):
        limit = default_limit
    offset = (page - 1) * limit
    return page, limit, offset


# ---- users ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def users_list(request):
    q = (request.query_params.get("q") or "").strip()
    qs = User.objects.all().order_by("-created_at")
    if q:
        qs = qs.filter(Q(email__icontains=q) | Q(name__icontains=q) | Q(id__icontains=q))

    page, limit, offset = _paginate(request)
    total = qs.count()
    rows = [_user_row(u) for u in qs[offset:offset + limit]]
    return Response({"total": total, "page": page, "limit": limit, "rows": rows})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    trades = Trade.objects.filter(user=user).order_by("-opened_at")[:50]
    txs = Transaction.objects.filter(user=user).order_by("-at")[:50]
    withdrawals = Withdrawal.objects.filter(user=user).order_by("-at")[:50]
    audits = AdminAudit.objects.filter(target_type="user", target_id=str(user.id)).order_by("-at")[:50]

    return Response({
        "user": _user_row(user),
        "trades": [_trade_row(t) for t in trades],
        "transactions": [_tx_row(t) for t in txs],
        "withdrawals": [_withdrawal_row(w) for w in withdrawals],
        "audit": AdminAuditSerializer(audits, many=True).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_admin
def set_win_rate(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    raw = request.data.get("win_rate_override")
    reason = (request.data.get("reason") or "").strip()

    if raw in (None, ""):
        user.win_rate_override = None
    else:
        try:
            val = Decimal(str(raw))
        except Exception:
            return Response({"error": "Invalid win_rate_override"}, status=400)
        if val < 0 or val > 1:
            return Response({"error": "win_rate_override must be between 0 and 1"}, status=400)
        user.win_rate_override = val

    user.save(update_fields=["win_rate_override"])

    record(
        request.user, "user.win_rate",
        target_type="user", target_id=user.id,
        reason=reason,
        metadata={"win_rate_override": str(user.win_rate_override) if user.win_rate_override is not None else None},
    )

    return Response({"id": user.id, "win_rate_override": user.win_rate_override})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_admin
def set_banned(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    banned = bool(request.data.get("banned"))
    reason = (request.data.get("reason") or "").strip()

    user.banned = banned
    user.save(update_fields=["banned"])

    record(
        request.user, "user.ban" if banned else "user.unban",
        target_type="user", target_id=user.id, reason=reason,
    )
    return Response({"id": user.id, "banned": user.banned})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_admin
def manual_deposit(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    amount = request.data.get("amount")
    reason = (request.data.get("reason") or "").strip()

    if not amount:
        return Response({"error": "amount is required"}, status=400)
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return Response({"error": "Invalid amount"}, status=400)
    if amount <= 0:
        return Response({"error": "Invalid amount"}, status=400)

    amount_cents = int(round(amount * 100))

    with db_transaction.atomic():
        bal = Balance.objects.select_for_update().get_or_create(user=user)[0]
        bal.balance_cents += amount_cents
        bal.save()

        Transaction.objects.create(
            id=new_id("t"),
            user=user,
            type="admin-credit",
            amount_cents=amount_cents,
            method="admin",
            reference=request.user.id,
            status="completed",
        )

        Notification.objects.create(
            user=user,
            type="wallet",
            title=f"Account credited: ${amount:.2f}",
            body="Applied by support.",
            reference=f"admin-credit:{request.user.id}",
        )

    record(
        request.user, "user.deposit",
        target_type="user", target_id=user.id, reason=reason,
        metadata={"amount": amount},
    )

    return Response({"id": user.id, "credited": amount, "balance": Balance.objects.get(user=user).balance_cents / 100})


# ---- trades ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def trades_list(request):
    qs = Trade.objects.select_related("user").order_by("-opened_at")

    user_id = request.query_params.get("user_id")
    status = request.query_params.get("status")
    auto = request.query_params.get("auto")
    q = (request.query_params.get("q") or "").strip()

    if user_id:
        qs = qs.filter(user_id=user_id)
    if status:
        qs = qs.filter(status=status)
    if auto in ("true", "false"):
        qs = qs.filter(auto=(auto == "true"))
    if q:
        qs = qs.filter(Q(id__icontains=q) | Q(user__email__icontains=q) | Q(market__icontains=q))

    page, limit, offset = _paginate(request)
    total = qs.count()
    rows = [_trade_row(t) for t in qs[offset:offset + limit]]
    return Response({"total": total, "page": page, "limit": limit, "rows": rows})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_admin
def force_settle(request, trade_id):
    from trading.settlement import effective_win_rate, roll_outcome
    from trading.views import _settle_locked

    result_override = request.data.get("result")
    reason = (request.data.get("reason") or "").strip()

    with db_transaction.atomic():
        try:
            trade = Trade.objects.select_for_update().get(id=trade_id)
        except Trade.DoesNotExist:
            return Response({"error": "Trade not found"}, status=404)

        if trade.status != Trade.STATUS_OPEN:
            return Response({"error": "Already settled"}, status=409)

        if result_override in ("won", "lost"):
            result = result_override
        else:
            win_rate, _ = effective_win_rate(trade.user)
            result = roll_outcome(win_rate)

        _settle_locked(trade, result)

    record(
        request.user, "trade.force_settle",
        target_type="trade", target_id=trade.id, reason=reason,
        metadata={"result": result, "override": result_override in ("won", "lost")},
    )
    return Response({"id": trade.id, "result": result})


# ---- transactions ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def transactions_list(request):
    qs = Transaction.objects.select_related("user").order_by("-at")
    user_id = request.query_params.get("user_id")
    type_ = request.query_params.get("type")
    status = request.query_params.get("status")
    q = (request.query_params.get("q") or "").strip()

    if user_id:
        qs = qs.filter(user_id=user_id)
    if type_:
        qs = qs.filter(type=type_)
    if status:
        qs = qs.filter(status=status)
    if q:
        qs = qs.filter(Q(id__icontains=q) | Q(reference__icontains=q) | Q(user__email__icontains=q))

    page, limit, offset = _paginate(request)
    total = qs.count()
    rows = [_tx_row(t) for t in qs[offset:offset + limit]]
    return Response({"total": total, "page": page, "limit": limit, "rows": rows})


# ---- withdrawals ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def withdrawals_list(request):
    qs = Withdrawal.objects.select_related("user").order_by("-at")
    status = request.query_params.get("status")
    if status:
        qs = qs.filter(status=status)

    page, limit, offset = _paginate(request)
    total = qs.count()
    rows = [_withdrawal_row(w) for w in qs[offset:offset + limit]]
    return Response({"total": total, "page": page, "limit": limit, "rows": rows})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_admin
def withdrawal_review(request, withdrawal_id):
    decision = (request.data.get("decision") or "").strip().lower()
    reason = (request.data.get("reason") or "").strip()

    if decision not in ("approve", "reject"):
        return Response({"error": "decision must be approve or reject"}, status=400)

    with db_transaction.atomic():
        try:
            w = Withdrawal.objects.select_for_update().get(id=withdrawal_id)
        except Withdrawal.DoesNotExist:
            return Response({"error": "Withdrawal not found"}, status=404)

        if w.status != Withdrawal.STATUS_PENDING:
            return Response({"error": "Already reviewed"}, status=409)

        bal = Balance.objects.select_for_update().get(user=w.user)

        if decision == "approve":
            # Funds were held in escrow at request time. Approving removes them
            # from escrow; the actual payout is out-of-band.
            bal.escrow_cents -= w.amount_cents
            bal.save()
            w.status = Withdrawal.STATUS_APPROVED
            Transaction.objects.create(
                id=new_id("t"),
                user=w.user,
                type="withdrawal-approved",
                amount_cents=-w.amount_cents,
                method=w.method,
                reference=w.id,
                status="completed",
            )
            Notification.objects.create(
                user=w.user,
                type="wallet",
                title=f"Withdrawal approved: ${w.amount_cents / 100:.2f}",
                body=f"Reference {w.id}.",
                reference=f"withdrawal:{w.id}",
            )
        else:
            # Rejected: return escrow to spendable balance.
            bal.escrow_cents -= w.amount_cents
            bal.balance_cents += w.amount_cents
            bal.save()
            w.status = Withdrawal.STATUS_REJECTED
            Transaction.objects.create(
                id=new_id("t"),
                user=w.user,
                type="withdrawal-rejected",
                amount_cents=0,
                method=w.method,
                reference=w.id,
                status="completed",
            )
            Notification.objects.create(
                user=w.user,
                type="wallet",
                title=f"Withdrawal rejected: ${w.amount_cents / 100:.2f}",
                body=reason or f"Reference {w.id}.",
                reference=f"withdrawal:{w.id}",
            )

        w.reason = reason
        w.reviewed_by = request.user
        w.reviewed_at = timezone.now()
        w.save()

    record(
        request.user, f"withdrawal.{decision}",
        target_type="withdrawal", target_id=w.id, reason=reason,
        metadata={"amount": w.amount_cents / 100, "user_id": w.user_id},
    )
    return Response(_withdrawal_row(w))


# ---- audit ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def audit_list(request):
    qs = AdminAudit.objects.all().order_by("-at")
    actor = request.query_params.get("actor")
    action = request.query_params.get("action")
    if actor:
        qs = qs.filter(actor_email__icontains=actor)
    if action:
        qs = qs.filter(action__icontains=action)

    page, limit, offset = _paginate(request)
    total = qs.count()
    rows = AdminAuditSerializer(qs[offset:offset + limit], many=True).data
    return Response({"total": total, "page": page, "limit": limit, "rows": rows})


# ---- metrics ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def metrics(request):
    users_total = User.objects.count()
    users_active = User.objects.filter(banned=False).count()

    open_trades = Trade.objects.filter(status=Trade.STATUS_OPEN).count()
    won = Trade.objects.filter(status=Trade.STATUS_WON).count()
    lost = Trade.objects.filter(status=Trade.STATUS_LOST).count()

    platform_sum = Balance.objects.aggregate(total=Sum("platform_cents"))["total"] or 0
    volume_sum = Balance.objects.aggregate(total=Sum("volume_cents"))["total"] or 0
    escrow_sum = Balance.objects.aggregate(total=Sum("escrow_cents"))["total"] or 0

    deposits_sum = Transaction.objects.filter(type="deposit", status="completed").aggregate(t=Sum("amount_cents"))["t"] or 0

    pending_withdrawals = Withdrawal.objects.filter(status=Withdrawal.STATUS_PENDING).count()

    # 24h windows for the chart on the overview page
    since = timezone.now() - timezone.timedelta(hours=24)
    trades_24h = Trade.objects.filter(opened_at__gte=since).count()
    pnl_24h = Trade.objects.filter(closed_at__gte=since).aggregate(t=Sum("profit_cents"))["t"] or 0

    return Response({
        "users": {"total": users_total, "active": users_active},
        "trades": {"open": open_trades, "won": won, "lost": lost, "24h": trades_24h},
        "platform": {
            "pnl": platform_sum / 100,
            "volume": volume_sum / 100,
            "escrow": escrow_sum / 100,
            "pnl_24h": pnl_24h / 100,
        },
        "deposits_total": deposits_sum / 100,
        "pending_withdrawals": pending_withdrawals,
    })


# ---- global search ----

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def search(request):
    q = (request.query_params.get("q") or "").strip()
    if not q or len(q) < 2:
        return Response({"users": [], "trades": [], "transactions": []})

    users = User.objects.filter(
        Q(email__icontains=q) | Q(name__icontains=q) | Q(id__icontains=q)
    )[:10]

    trades = Trade.objects.select_related("user").filter(
        Q(id__icontains=q) | Q(user__email__icontains=q) | Q(market__icontains=q)
    )[:10]

    txs = Transaction.objects.select_related("user").filter(
        Q(id__icontains=q) | Q(reference__icontains=q) | Q(user__email__icontains=q)
    )[:10]

    return Response({
        "users": [_user_row(u) for u in users],
        "trades": [_trade_row(t) for t in trades],
        "transactions": [_tx_row(t) for t in txs],
    })
