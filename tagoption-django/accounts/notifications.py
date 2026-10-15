from django.conf import settings
from django.db import models

from accounts.models import new_id


def new_notification_id():
    return new_id("n")


class Notification(models.Model):
    id = models.CharField(primary_key=True, max_length=40, default=new_notification_id, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=16)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=300, blank=True, default="")
    read = models.BooleanField(default=False)
    reference = models.CharField(max_length=64, blank=True, null=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-at"]
        indexes = [
            models.Index(fields=["user", "-at"]),
            models.Index(fields=["user", "read"]),
        ]
