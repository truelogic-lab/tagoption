from django.conf import settings
from django.db import models

from accounts.models import new_id


def new_audit_id():
    return new_id("a")


class AdminAudit(models.Model):
    """
    Every admin mutation lands here. The `reason` field is stored but stripped
    before the record is returned to any client — it's for internal forensics,
    not for display.
    """
    id = models.CharField(primary_key=True, max_length=40, default=new_audit_id, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="admin_actions",
    )
    actor_email = models.EmailField(blank=True, default="")
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=32, blank=True, default="")
    target_id = models.CharField(max_length=64, blank=True, default="")
    reason = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-at"]
        indexes = [
            models.Index(fields=["-at"]),
            models.Index(fields=["actor", "-at"]),
            models.Index(fields=["action", "-at"]),
        ]
