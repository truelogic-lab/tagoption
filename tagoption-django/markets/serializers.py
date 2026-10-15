from rest_framework import serializers

from .models import Market


class MarketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Market
        fields = ("id", "name", "base", "enabled", "payout_mult")
