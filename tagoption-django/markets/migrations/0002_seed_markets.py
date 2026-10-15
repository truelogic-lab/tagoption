"""
Seed the market registry. Values mirror server/src/lib/markets.js exactly so
the client sees identical ids, names, and base prices on both backends during
cutover testing.

Only R_10 is enabled by default, matching `active: true` in the Fastify
registry. Admin can enable others from the dashboard.
"""
from django.db import migrations

MARKETS = [
    ("R_10",     "Volatility 10 Index",  "9532.87",  0,  True),
    ("R_25",     "Volatility 25 Index",  "2418.50",  1,  False),
    ("R_50",     "Volatility 50 Index",  "342.19",   2,  False),
    ("R_75",     "Volatility 75 Index",  "51204.31", 3,  False),
    ("R_100",    "Volatility 100 Index", "1274.68",  4,  False),
    ("BOOM500",  "Boom 500 Index",       "9642.11",  5,  False),
    ("BOOM1K",   "Boom 1000 Index",      "12045.30", 6,  False),
    ("CRASH500", "Crash 500 Index",      "8231.45",  7,  False),
    ("CRASH1K",  "Crash 1000 Index",     "10432.18", 8,  False),
    ("STEP",     "Step Index",           "9102.90",  9,  False),
    ("RB100",    "Range Break 100",      "6800.42",  10, False),
    ("RB200",    "Range Break 200",      "4450.77",  11, False),
    ("JD10",     "Jump 10 Index",        "3021.78",  12, False),
    ("JD25",     "Jump 25 Index",        "4125.60",  13, False),
    ("JD50",     "Jump 50 Index",        "5310.45",  14, False),
]


def seed(apps, schema_editor):
    Market = apps.get_model("markets", "Market")
    for market_id, name, base, sort_order, enabled in MARKETS:
        Market.objects.update_or_create(
            id=market_id,
            defaults={
                "name": name,
                "base": base,
                "enabled": enabled,
                "sort_order": sort_order,
            },
        )


def unseed(apps, schema_editor):
    Market = apps.get_model("markets", "Market")
    Market.objects.filter(id__in=[m[0] for m in MARKETS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("markets", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
