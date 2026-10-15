from rest_framework import serializers

from .models import Market


class MarketSerializer(serializers.ModelSerializer):
    # The client reads `active` — that name comes from the Fastify registry.
    # The DB column is `enabled`. Alias here so the wire shape matches the
    # existing client without a schema rename.
    active = serializers.BooleanField(source="enabled")

    class Meta:
        model = Market
        fields = ("id", "name", "base", "active", "payout_mult")
