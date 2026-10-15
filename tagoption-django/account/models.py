from django.conf import settings
from django.db import models


class Verification(models.Model):
    """
    Minimal KYC record. No vendor integration yet — submissions land in a
    PENDING state and an admin marks them approved manually. The client only
    needs status.
    """
    STATUS_NONE = "none"
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="verification",
    )
    status = models.CharField(max_length=16, default=STATUS_NONE)
    payload = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
