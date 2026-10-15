from django.conf import settings
from django.db import models

from accounts.models import new_id


def new_trade_id():
    return new_id("p")


class Trade(models.Model):
    STATUS_OPEN = "open"
    STATUS_WON = "won"
    STATUS_LOST = "lost"

    id = models.CharField(primary_key=True, max_length=40, default=new_trade_id, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trades")
    market = models.CharField(max_length=80)
    contract = models.CharField(max_length=16)
    stake_cents = models.BigIntegerField()
    profit_cents = models.BigIntegerField()
    status = models.CharField(max_length=8, default=STATUS_OPEN)
    auto = models.BooleanField(default=False)
    win_rate_applied = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    payout_mult_applied = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-opened_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["opened_at"]),
        ]


class AutoRun(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="auto_run",
    )
    run_id = models.CharField(max_length=40)
    running = models.BooleanField(default=False)
    cancel = models.BooleanField(default=False)
    count = models.IntegerField()
    done = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    stake_cents = models.BigIntegerField()
    target_cents = models.BigIntegerField(default=0)
    stop_cents = models.BigIntegerField(default=0)
    market = models.CharField(max_length=80)
    pnl_cents = models.BigIntegerField(default=0)
    error = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    heartbeat_at = models.DateTimeField(auto_now=True)
