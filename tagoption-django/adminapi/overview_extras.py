"""
Extended aggregates for the admin overview endpoint.

Kept in a separate module so the main view stays readable and this can be
dropped without touching the rest of the file.
"""
from datetime import timedelta

from django.db.models import BigIntegerField, Case, Count, F, Q, Sum, When
from django.utils import timezone

from accounts.models import User
from trading.models import Trade

PNL_EXPR = Sum(
    Case(
        When(status=Trade.STATUS_WON, then=-F("profit_cents")),
        default=F("stake_cents"),
        output_field=BigIntegerField(),
    )
)


def _pnl_cents(qs):
    return (qs.aggregate(total=PNL_EXPR)["total"] or 0)


def previous_and_current():
    """
    Returns { current: {...}, previous: {...} } — 30-day windows so the KPI
    cards can show period-over-period deltas without inventing values.
    """
    now = timezone.now()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)

    def window(start, end=None):
        user_q = Q(created_at__gte=start)
        settle_q = Q(closed_at__gte=start, status__in=[Trade.STATUS_WON, Trade.STATUS_LOST])
        pnl_q = Q(closed_at__gte=start, status__in=[Trade.STATUS_WON, Trade.STATUS_LOST])
        if end is not None:
            user_q &= Q(created_at__lt=end)
            settle_q &= Q(closed_at__lt=end)
            pnl_q &= Q(closed_at__lt=end)
        return {
            "users": User.objects.filter(user_q).count(),
            "settled": Trade.objects.filter(settle_q).count(),
            "pnl": _pnl_cents(Trade.objects.filter(pnl_q)) / 100,
        }

    return {
        "current": window(current_start),
        "previous": window(previous_start, current_start),
    }


def seven_day_trend():
    """
    Seven daily data points ending today. Used for KPI card sparklines.
    Returns arrays of { day, users, settled, pnl }.
    """
    now = timezone.now()
    out = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        users = User.objects.filter(
            created_at__gte=day_start, created_at__lt=day_end
        ).count()
        settled = Trade.objects.filter(
            closed_at__gte=day_start, closed_at__lt=day_end,
            status__in=[Trade.STATUS_WON, Trade.STATUS_LOST],
        ).count()
        pnl = _pnl_cents(
            Trade.objects.filter(
                closed_at__gte=day_start, closed_at__lt=day_end,
                status__in=[Trade.STATUS_WON, Trade.STATUS_LOST],
            )
        ) / 100

        out.append({"day": day_start, "users": users, "settled": settled, "pnl": pnl})

    return out
