from django.db import transaction as db_transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import new_id
from accounts.notifications import Notification

from .models import Balance, Transaction, Withdrawal
from .serializers import BalanceSerializer, TransactionSerializer, WithdrawalSerializer


def get_balance(user):
    balance, _ = Balance.objects.get_or_create(user=user)
    return balance


def _create_withdrawal(user, amount, method, destination):
    """
    Hold the funds by moving them out of the spendable balance and into escrow.
    If the withdrawal is rejected, the admin reverses this. Shared by the
    POST /wallet/withdraw and POST /wallet/withdrawals paths.
    """
    with db_transaction.atomic():
        Balance.objects.get_or_create(user=user)
        bal = Balance.objects.select_for_update().get(user=user)
        amount_cents = int(round(amount * 100))
        if bal.balance_cents < amount_cents:
            return None, "Insufficient balance"

        bal.balance_cents -= amount_cents
        bal.escrow_cents += amount_cents
        bal.save()

        w = Withdrawal.objects.create(
            user=user,
            amount_cents=amount_cents,
            method=method,
            destination=destination,
        )

        Transaction.objects.create(
            id=new_id("t"),
            user=user,
            type="withdrawal-request",
            amount_cents=-amount_cents,
            method=method,
            reference=w.id,
            status="pending",
        )

        Notification.objects.create(
            user=user,
            type="wallet",
            title=f"Withdrawal requested: ${amount:.2f}",
            body=f"Pending review. Reference {w.id}.",
            reference=f"withdrawal:{w.id}",
        )

    return w, None


def _parse_withdrawal_body(request, require_destination):
    amount = request.data.get("amount")
    method = (request.data.get("method") or "").strip()
    destination = (request.data.get("destination") or "").strip()

    if not amount or not method:
        return None, None, None, "amount and method are required"
    if require_destination and not destination:
        return None, None, None, "destination is required"

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return None, None, None, "Invalid amount"

    if amount <= 0:
        return None, None, None, "Invalid amount"

    return amount, method, destination or method, None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def balance(request):
    return Response(BalanceSerializer(get_balance(request.user)).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def history(request):
    qs = Transaction.objects.filter(user=request.user)[:200]
    return Response(TransactionSerializer(qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def withdrawals(request):
    if request.method == "GET":
        qs = Withdrawal.objects.filter(user=request.user)[:100]
        return Response(WithdrawalSerializer(qs, many=True).data)

    amount, method, destination, err = _parse_withdrawal_body(request, require_destination=True)
    if err:
        return Response({"error": err}, status=400)

    w, err = _create_withdrawal(request.user, amount, method, destination)
    if err:
        return Response({"error": err}, status=400)

    return Response(WithdrawalSerializer(w).data, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def withdraw(request):
    """
    Client-facing path. Same semantics as POST /wallet/withdrawals but
    destination is optional (the client only sends amount and method).
    """
    amount, method, destination, err = _parse_withdrawal_body(request, require_destination=False)
    if err:
        return Response({"error": err}, status=400)

    w, err = _create_withdrawal(request.user, amount, method, destination)
    if err:
        return Response({"error": err}, status=400)

    return Response(WithdrawalSerializer(w).data, status=201)
