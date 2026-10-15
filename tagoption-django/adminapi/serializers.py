from rest_framework import serializers


class AdminUserSerializer(serializers.Serializer):
    id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()
    role = serializers.CharField()
    verified = serializers.BooleanField()
    banned = serializers.BooleanField()
    win_rate_override = serializers.DecimalField(max_digits=5, decimal_places=4, allow_null=True)
    created_at = serializers.DateTimeField()
    balance = serializers.FloatField()
    escrow = serializers.FloatField()


class AdminTradeSerializer(serializers.Serializer):
    id = serializers.CharField()
    user_id = serializers.CharField()
    user_email = serializers.EmailField()
    market = serializers.CharField()
    contract = serializers.CharField()
    stake = serializers.FloatField()
    payout = serializers.FloatField()
    status = serializers.CharField()
    auto = serializers.BooleanField()
    win_rate_applied = serializers.FloatField(allow_null=True)
    payout_mult_applied = serializers.FloatField(allow_null=True)
    opened_at = serializers.DateTimeField()
    closed_at = serializers.DateTimeField(allow_null=True)


class AdminTransactionSerializer(serializers.Serializer):
    id = serializers.CharField()
    user_id = serializers.CharField()
    user_email = serializers.EmailField()
    type = serializers.CharField()
    amount = serializers.FloatField()
    method = serializers.CharField(allow_null=True, allow_blank=True)
    reference = serializers.CharField(allow_null=True, allow_blank=True)
    status = serializers.CharField()
    at = serializers.DateTimeField()


class AdminWithdrawalSerializer(serializers.Serializer):
    id = serializers.CharField()
    user_id = serializers.CharField()
    user_email = serializers.EmailField()
    amount = serializers.FloatField()
    method = serializers.CharField()
    destination = serializers.CharField()
    status = serializers.CharField()
    reason = serializers.CharField(allow_blank=True)
    at = serializers.DateTimeField()
    reviewed_at = serializers.DateTimeField(allow_null=True)


class AdminAuditSerializer(serializers.Serializer):
    # `reason` is deliberately absent from the wire — stored but never returned.
    id = serializers.CharField()
    actor_email = serializers.EmailField()
    action = serializers.CharField()
    target_type = serializers.CharField()
    target_id = serializers.CharField()
    metadata = serializers.DictField()
    at = serializers.DateTimeField()
