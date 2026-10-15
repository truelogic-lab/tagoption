from django.db import models


class PlatformConfig(models.Model):
    """
    Single-row platform configuration. Values are read on every /config hit
    and on every trade settle, so they must always resolve to something sane.
    Defaults come from settings; the row only stores overrides.
    """
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    win_rate = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    payout_mult = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
