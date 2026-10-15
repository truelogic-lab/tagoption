from decimal import Decimal

from django.conf import settings

from .models import PlatformConfig


def get_config():
    """
    Effective platform config: DB override if set, else the settings default.
    Returns (win_rate, payout_mult) as Decimals.
    """
    row = PlatformConfig.objects.filter(id=1).first()
    win_rate = row.win_rate if row and row.win_rate is not None else Decimal(str(settings.WIN_RATE))
    payout = row.payout_mult if row and row.payout_mult is not None else Decimal(str(settings.PAYOUT_MULT))
    return win_rate, payout


def set_config(win_rate=None, payout_mult=None):
    row, _ = PlatformConfig.objects.get_or_create(id=1)
    if win_rate is not None:
        row.win_rate = Decimal(str(win_rate))
    if payout_mult is not None:
        row.payout_mult = Decimal(str(payout_mult))
    row.save()
    return get_config()
