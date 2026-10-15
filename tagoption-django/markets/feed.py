"""
Deterministic price feed.

The Fastify implementation keeps state in memory and ticks every 900ms. That
does not survive a multi-worker deploy, so this port derives the price from
(symbol, time_bucket) instead: every worker computes the same value for the
same instant, no shared state, no DB writes.

Both components are interpolated: `slow` crosses continuously across its
60-bucket windows, `fast` crosses continuously across 6-bucket windows. That
keeps the price walking smoothly rather than jumping each tick — the earlier
version generated a fresh `fast` value every bucket, which produced ~60-point
steps on a market with a +/-190 band.

Bounds are +/-2% of base, matching the Fastify generator. `lastDigit` is the
hundredths digit of the current price, the input the Even/Odd contract
resolves against.
"""

import hashlib
import time
from decimal import Decimal

TICK_MS = 900
HISTORY_LEN = 200
CLIENT_HISTORY = 80
BAND = Decimal("0.02")          # +/-2% of base, matches Fastify

SLOW_WINDOW = 60                # ~54s per slow cycle
FAST_WINDOW = 6                 # ~5.4s per fast cycle
SLOW_WEIGHT = 0.85
FAST_WEIGHT = 0.15


def _bucket(t: float | None = None) -> int:
    now = time.time() if t is None else t
    return int(now * 1000 // TICK_MS)


def _unit(symbol: str, n: int) -> float:
    """
    Stable pseudo-random in [0, 1) derived from a symbol and an integer.
    Same inputs give the same output on every worker, forever.
    """
    h = hashlib.sha256(f"{symbol}:{n}".encode("utf-8")).digest()
    return int.from_bytes(h[:6], "big") / float(1 << 48)


def _osc(symbol: str, bucket: int, window: int, name: str) -> float:
    """
    Oscillator in [-1, 1] that linearly interpolates between window k and k+1
    so the value crosses continuously at window boundaries. No step jumps.
    """
    k = bucket // window
    frac = (bucket % window) / window
    a = _unit(f"{symbol}:{name}", k) * 2.0 - 1.0
    b = _unit(f"{symbol}:{name}", k + 1) * 2.0 - 1.0
    return a + (b - a) * frac


def _price_at(symbol: str, base: Decimal, bucket: int) -> Decimal:
    base_f = float(base)
    band_f = base_f * float(BAND)

    slow = _osc(symbol, bucket, SLOW_WINDOW, "slow")
    fast = _osc(symbol, bucket, FAST_WINDOW, "fast")
    offset = (SLOW_WEIGHT * slow + FAST_WEIGHT * fast) * band_f

    price = base_f + offset
    lo = base_f - band_f
    hi = base_f + band_f
    price = max(lo, min(hi, price))

    return Decimal(f"{price:.2f}")


def snapshot(symbol: str, base: Decimal, history_len: int = HISTORY_LEN) -> dict:
    """
    Current tick plus a trailing history window. History is recomputed from
    buckets, so it's identical across workers.
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
