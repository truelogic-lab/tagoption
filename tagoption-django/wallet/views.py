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

    amount = request.data.get("amount")
    method = (request.data.get("method") or "").strip()
    destination = (request.data.get("destination") or "").strip()

    if not amount or not method or not destination:
        return Response({"error": "amount, method, and destination are required"}, status=400)

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return Response({"error": "Invalid amount"}, status=400)

    if amount <= 0:
        return Response({"error": "Invalid amount"}, status=400)

    amount_cents = int(round(amount * 100))

    with db_transaction.atomic():
        Balance.objects.get_or_create(user=request.user)
        bal = Balance.objects.select_for_update().get(user=request.user)
        if bal.balance_cents < amount_cents:
            return Response({"error": "Insufficient balance"}, status=400)

        # Hold the funds by moving them out of the spendable balance and into
        # escrow. If the withdrawal is rejected, the admin reverses this.
        bal.balance_cents -= amount_cents
        bal.escrow_cents += amount_cents
        bal.save()

        w = Withdrawal.objects.create(
            user=request.user,
            amount_cents=amount_cents,
            method=method,
            destination=destination,
        )

        Transaction.objects.create(
            id=new_id("t"),
            user=request.user,
            type="withdrawal-request",
            amount_cents=-amount_cents,
            method=method,
            reference=w.id,
            status="pending",
        )

        Notification.objects.create(
            user=request.user,
            type="wallet",
            title=f"Withdrawal requested: ${amount:.2f}",
            body=f"Pending review. Reference {w.id}.",
            reference=f"withdrawal:{w.id}",
        )

    return Response(WithdrawalSerializer(w).data, status=201)
