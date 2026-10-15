"""
Deterministic price feed.

The Fastify implementation keeps state in memory and ticks every 900ms. That
does not survive a multi-worker deploy, so this port derives the price from
(symbol, time_bucket) instead: every worker computes the same value for the
same instant, no shared state, no DB writes.

The bounds and shape mirror the Fastify generator: price stays within +/-2% of
base, and `lastDigit` is the hundredths digit of the current price — the
input the Even/Odd contract resolves against.
"""

import hashlib
import time
from decimal import Decimal

TICK_MS = 900
HISTORY_LEN = 200
CLIENT_HISTORY = 80
BAND = Decimal("0.02")  # +/-2% of base, matches Fastify


def _bucket(t: float | None = None) -> int:
    now = time.time() if t is None else t
    return int(now * 1000 // TICK_MS)


def _unit(symbol: str, bucket: int) -> float:
    """
    Stable pseudo-random in [0, 1) derived from symbol and bucket.
    Same inputs give the same output on every worker, forever.
    """
    h = hashlib.sha256(f"{symbol}:{bucket}".encode("utf-8")).digest()
    n = int.from_bytes(h[:6], "big")
    return n / float(1 << 48)


def _price_at(symbol: str, base: Decimal, bucket: int) -> Decimal:
    """
    Price at a bucket. Two components:
      - a slow sinusoid derived from the bucket index, so price wanders
        smoothly instead of jittering
      - a small per-bucket noise term for texture

    Clamped to +/-BAND around base, matching the Fastify generator.
    """
    base_f = float(base)
    band_f = base_f * float(BAND)

    slow = (_unit(symbol + ":slow", bucket // 60) - 0.5) * 2.0   # [-1, 1)
    fast = (_unit(symbol + ":fast", bucket) - 0.5) * 0.4          # [-0.2, 0.2)
    offset = (slow * 0.8 + fast * 0.2) * band_f

    price = base_f + offset
    lo = base_f - band_f
    hi = base_f + band_f
    price = max(lo, min(hi, price))

    # Match Fastify's 2-decimal rounding (it does toFixed(2)).
    return Decimal(f"{price:.2f}")


def snapshot(symbol: str, base: Decimal, history_len: int = HISTORY_LEN) -> dict:
    """
    Return the current tick with a trailing history window. History is
    recomputed from buckets, so it's identical across workers.
    """
    b = _bucket()
    price = _price_at(symbol, base, b)

    history = [float(_price_at(symbol, base, b - i)) for i in range(history_len - 1, -1, -1)]
    change = float((price - base) / base * 100)

    return {
        "price": float(price),
        "change": round(change, 2),
        "lastDigit": abs(int(price * 100)) % 10,
        "history": history[-CLIENT_HISTORY:],
    }
