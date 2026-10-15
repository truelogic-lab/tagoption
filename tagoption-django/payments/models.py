from django.conf import settings
from django.db import models

from accounts.models import new_id


def new_deposit_id():
    return new_id("d")


class PesapalConfig(models.Model):
    """
    Single-row table caching the IPN id Pesapal returns on registration.
    In-memory caching doesn't survive Render restarts, and re-registering on
    every cold start will eventually get rate-limited. One row, always id 1.
    """
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    ipn_id = models.CharField(max_length=80)
    ipn_url = models.CharField(max_length=200)
    registered_at = models.DateTimeField(auto_now=True)


class Deposit(models.Model):
    """
    One row per deposit attempt.

    `reference` is our internal id, sent to Pesapal as merchant_reference.
    `order_tracking_id` is Pesapal's id — the client uses it to poll status.
    Both are unique so re-submitting an order never double-credits.

    Crediting happens exactly once, gated on the state transition from PENDING
    to COMPLETED. If a webhook arrives twice, the second is a no-op.
    """
    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_REVERSED = "reversed"

    id = models.CharField(primary_key=True, max_length=40, default=new_deposit_id, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="deposits",
    )
    amount_cents = models.BigIntegerField()
    currency = models.CharField(max_length=8, default="KES")
    method = models.CharField(max_length=40, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")

    reference = models.CharField(max_length=64, unique=True)
    order_tracking_id = models.CharField(max_length=80, unique=True, null=True, blank=True)
    redirect_url = models.URLField(max_length=400, blank=True, default="")
    confirmation_code = models.CharField(max_length=64, blank=True, default="")

    status = models.CharField(max_length=16, default=STATUS_PENDING)
    credited_at = models.DateTimeField(null=True, blank=True)
    last_status_payload = models.JSONField(default=dict, blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-at"]
        indexes = [
            models.Index(fields=["user", "-at"]),
            models.Index(fields=["status", "-at"]),
            models.Index(fields=["order_tracking_id"]),
        ]
