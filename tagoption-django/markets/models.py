from django.db import models


class Market(models.Model):
    """
    A tradable symbol. `enabled` gates placement — admin toggles it from the
    dashboard. `base` is the anchor price; the live feed oscillates within
    +/-2% of it, matching the Fastify tick generator.
    """
    id = models.CharField(primary_key=True, max_length=32)
    name = models.CharField(max_length=80)
    base = models.DecimalField(max_digits=18, decimal_places=8)
    enabled = models.BooleanField(default=True)
    payout_mult = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.id} ({'on' if self.enabled else 'off'})"
