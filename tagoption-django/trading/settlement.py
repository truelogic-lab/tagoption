"""
Settlement engine. Single source of truth for win rate, payout multiplier,
and the arithmetic used to open and settle trades. Every trade records the
values that were applied so the ledger is auditable.
"""

import random
from decimal import Decimal

from django.conf import settings

DEFAULT_WIN_RATE = Decimal(str(settings.WIN_RATE))
DEFAULT_PAYOUT_MULT = Decimal(str(settings.PAYOUT_MULT))


def effective_win_rate(user):
    if user is not None and user.win_rate_override is not None:
        return Decimal(user.win_rate_override), "user-override"
    return DEFAULT_WIN_RATE, "default"


def roll_outcome(win_rate):
    return "won" if random.random() < float(win_rate) else "lost"


def profit_cents(stake_cents, payout_mult=DEFAULT_PAYOUT_MULT):
    return int(round(stake_cents * float(payout_mult)))


def to_cents(amount):
    return int(round(float(amount) * 100))


def from_cents(cents):
    return cents / 100
