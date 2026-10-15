from rest_framework import serializers

from .models import Balance, Transaction


class BalanceSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Balance
        fields = ("amount",)

    def get_amount(self, obj):
        return obj.balance


class TransactionSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ("id", "type", "amount", "method", "reference", "status", "at")

    def get_amount(self, obj):
        return obj.amount_cents / 100
