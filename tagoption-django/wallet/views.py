from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Balance, Transaction
from .serializers import BalanceSerializer, TransactionSerializer


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
