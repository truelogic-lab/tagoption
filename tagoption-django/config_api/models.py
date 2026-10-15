from django.db import models


class PlatformConfig(models.Model):
    """
    Single-row trading engine config. Values are read on every /config hit
    and on every trade settle, so they must always resolve to something sane.
    """
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    win_rate = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    payout_mult = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class SiteConfig(models.Model):
    """
    Single-row branding config. Name and logo shown in the header, auth page,
    admin sidebar, browser tab, and favicon. Edited from /admin/settings.

    Empty strings mean "use the built-in defaults" — the client supplies those,
    so a fresh install renders correctly before anyone touches this row.
    """
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=60, blank=True, default="")
    logo_url = models.URLField(max_length=400, blank=True, default="")
    favicon_url = models.URLField(max_length=400, blank=True, default="")
    support_email = models.EmailField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)
