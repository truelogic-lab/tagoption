from django.db import models


class PlatformConfig(models.Model):
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    win_rate = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    payout_mult = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class SiteConfig(models.Model):
    """
    Single-row branding config.

    `logo_data` and `favicon_data` hold base64 data URIs. Small images only —
    the client caps uploads at 200 KB before sending, and the view rejects
    anything larger. When object storage is added, these become URLs and
    the columns stay for backwards compatibility.
    """
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=60, blank=True, default="")
    logo_url = models.URLField(max_length=400, blank=True, default="")
    logo_data = models.TextField(blank=True, default="")
    favicon_url = models.URLField(max_length=400, blank=True, default="")
    favicon_data = models.TextField(blank=True, default="")
    support_email = models.EmailField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
