"""
USD->KES rate lookup with a 60-second in-process cache and a settings-based
fallback. The Fastify version reads from a provider; this port does the same
when configured and otherwise returns the fallback constant.

A stale rate is worse than a conservative one, so the fallback is only used
when the live lookup fails. It is never blended with a live value.
"""

import time

import requests
from django.conf import settings

_CACHE = {"at": 0.0, "rate": None, "source": None}
_TTL = 60


def _fetch_live():
    url = getattr(settings, "FX_PROVIDER_URL", "")
    if not url:
        return None
    try:
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        data = r.json()
        rate = float(data.get("rate") or data.get("KES") or 0)
        if rate > 0:
            return rate
    except (requests.RequestException, ValueError, TypeError):
        return None
    return None


def current_rate():
    now = time.time()
    if _CACHE["rate"] and now - _CACHE["at"] < _TTL:
        return {"rate": _CACHE["rate"], "source": _CACHE["source"]}

    live = _fetch_live()
    if live:
        _CACHE.update({"at": now, "rate": live, "source": "live"})
        return {"rate": live, "source": "live"}

    fallback = float(settings.FX_FALLBACK_USD_KES)
    _CACHE.update({"at": now, "rate": fallback, "source": "fallback"})
    return {"rate": fallback, "source": "fallback"}
