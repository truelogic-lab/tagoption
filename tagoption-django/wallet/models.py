from django.conf import settings
from django.db import models

from accounts.models import new_id


def new_tx_id():
    return new_id("t")


def new_withdrawal_id():
    return new_id("w")


class Balance(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="balance",
    )
    balance_cents = models.BigIntegerField(default=0)
    escrow_cents = models.BigIntegerField(default=0)
    platform_cents = models.BigIntegerField(default=0)
    volume_cents = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def balance(self):
        return self.balance_cents / 100

    @property
    def escrow(self):
        return self.escrow_cents / 100

    @property
    def platform(self):
        return self.platform_cents / 100

    @property
    def volume(self):
        return self.volume_cents / 100


class Transaction(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=new_tx_id, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    type = models.CharField(max_length=32)
    amount_cents = models.BigIntegerField()
    method = models.CharField(max_length=40, blank=True, null=True)
    reference = models.CharField(max_length=64, blank=True, null=True)
    status = models.CharField(max_length=16, default="completed")
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-at"]
        indexes = [
            models.Index(fields=["user", "-at"]),
            models.Index(fields=["reference"]),
        ]


class Withdrawal(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    id = models.CharField(primary_key=True, max_length=40, default=new_withdrawal_id, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="withdrawals",
    )
    amount_cents = models.BigIntegerField()
    method = models.CharField(max_length=40)
    destination = models.CharField(max_length=120)
    status = models.CharField(max_length=16, default=STATUS_PENDING)
    reason = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_withdrawals",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-at"]
        indexes = [
            models.Index(fields=["user", "-at"]),
            models.Index(fields=["status", "-at"]),
        ]
