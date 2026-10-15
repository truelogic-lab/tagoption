"""
Settlement engine. Single source of truth for win rate, payout multiplier,
and the arithmetic used to open and settle trades. Every trade records the
values that were applied so the ledger is auditable.

Values come from config_api, which reads a DB override if present and falls
back to settings otherwise. `settings.WIN_RATE` / `settings.PAYOUT_MULT` are
the defaults, not the live values — changing them requires an admin override
or a settings change and redeploy.
"""

import random
from decimal import Decimal

from django.conf import settings


def _platform_config():
    from config_api.service import get_config
    return get_config()


def effective_win_rate(user):
    if user is not None and user.win_rate_override is not None:
        return Decimal(user.win_rate_override), "user-override"
    win_rate, _ = _platform_config()
    return win_rate, "platform"


def effective_payout_mult():
    _, payout = _platform_config()
    return payout


def roll_outcome(win_rate):
    return "won" if random.random() < float(win_rate) else "lost"


def profit_cents(stake_cents, payout_mult=None):
    if payout_mult is None:
        payout_mult = effective_payout_mult()
    return int(round(stake_cents * float(payout_mult)))


def to_cents(amount):
    return int(round(float(amount) * 100))


def from_cents(cents):
    return cents / 100
