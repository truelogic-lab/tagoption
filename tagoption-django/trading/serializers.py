from rest_framework import serializers

from .models import Trade


class TradeSerializer(serializers.ModelSerializer):
    stake = serializers.SerializerMethodField()
    payout = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()

    class Meta:
        model = Trade
        fields = ("id", "market", "contract", "stake", "payout", "result", "auto", "opened_at", "closed_at")

    def get_stake(self, obj):
        return obj.stake_cents / 100

    def get_payout(self, obj):
        return obj.profit_cents / 100

    def get_result(self, obj):
        return None if obj.status == Trade.STATUS_OPEN else obj.status
