"""
Pesapal API 3.0 adapter.

Flow:
    1. request_token()          bearer token, cached in-process for 4 minutes
    2. ensure_ipn()             register the IPN URL, cache the id in the DB
    3. submit_order()           returns { redirect_url, order_tracking_id }
    4. get_status()             authoritative status; never trust the IPN body

Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json

Timeouts on every request. A Pesapal outage that hangs the deposit endpoint
for 30 seconds is worse than one that fails fast and lets the client retry.
"""

import logging
import time

import requests
from django.conf import settings

from .models import PesapalConfig

log = logging.getLogger(__name__)

_TOKEN_CACHE = {"value": None, "expires_at": 0.0}
_TIMEOUT = 10
_TOKEN_TTL = 4 * 60


class PesapalError(Exception):
    pass


def _base():
    return settings.PESAPAL_BASE_URL.rstrip("/")


def request_token():
    now = time.time()
    if _TOKEN_CACHE["value"] and _TOKEN_CACHE["expires_at"] > now + 30:
        return _TOKEN_CACHE["value"]

    if not settings.PESAPAL_CONSUMER_KEY or not settings.PESAPAL_CONSUMER_SECRET:
        raise PesapalError("Pesapal credentials not configured")

    try:
        r = requests.post(
            f"{_base()}/api/Auth/RequestToken",
            json={
                "consumer_key": settings.PESAPAL_CONSUMER_KEY,
                "consumer_secret": settings.PESAPAL_CONSUMER_SECRET,
            },
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise PesapalError(f"Auth request failed: {exc}") from exc

    data = r.json() if r.content else {}
    if not r.ok or not data.get("token"):
        raise PesapalError(data.get("message") or f"Pesapal auth failed ({r.status_code})")

    _TOKEN_CACHE["value"] = data["token"]
    _TOKEN_CACHE["expires_at"] = now + _TOKEN_TTL
    return data["token"]


def _authed(method, path, json_body=None):
    token = request_token()
    try:
        r = requests.request(
            method,
            f"{_base()}{path}",
            json=json_body,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
            },
            timeout=_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise PesapalError(f"{path} request failed: {exc}") from exc

    data = r.json() if r.content else {}
    if not r.ok:
        msg = data.get("message") or (data.get("error") or {}).get("message") or f"Pesapal {path} failed ({r.status_code})"
        raise PesapalError(msg)
    return data


def ensure_ipn():
    """
    Register the IPN URL once and persist the resulting id. Re-registering on
    every cold start is wasteful and risks rate-limiting.
    """
    url = settings.PESAPAL_IPN_URL
    if not url:
        raise PesapalError("PESAPAL_IPN_URL not configured")

    existing = PesapalConfig.objects.filter(id=1).first()
    if existing and existing.ipn_url == url:
        return existing.ipn_id

    data = _authed(
        "POST",
        "/api/URLSetup/RegisterIPN",
        {
            "url": url,
            "ipn_notification_type": settings.PESAPAL_IPN_TYPE,
        },
    )
    ipn_id = data.get("ipn_id")
    if not ipn_id:
        raise PesapalError((data.get("error") or {}).get("message") or "IPN registration failed")

    PesapalConfig.objects.update_or_create(
        id=1,
        defaults={"ipn_id": ipn_id, "ipn_url": url},
    )
    log.info("pesapal: registered IPN %s -> %s", ipn_id, url)
    return ipn_id


def submit_order(*, reference, amount, currency, description, email, phone, first_name="Customer", last_name="TagOption"):
    ipn_id = ensure_ipn()

    body = {
        "id": reference,
        "currency": currency,
        "amount": float(amount),
        "description": description,
        "callback_url": settings.PESAPAL_CALLBACK_URL,
        "notification_id": ipn_id,
        "billing_address": {
            "email_address": email or "customer@tagoption.ke",
            "phone_number": phone or "",
            "country_code": "KE",
            "first_name": first_name,
            "middle_name": "",
            "last_name": last_name,
            "line_1": "",
            "line_2": "",
            "city": "",
            "state": "",
            "postal_code": "",
            "zip_code": "",
        },
    }

    data = _authed("POST", "/api/Transactions/SubmitOrderRequest", body)
    return {
        "redirect_url": data.get("redirect_url", ""),
        "order_tracking_id": data.get("order_tracking_id", ""),
        "merchant_reference": data.get("merchant_reference", reference),
        "raw": data,
    }


def get_status(order_tracking_id):
    data = _authed(
        "GET",
        f"/api/Transactions/GetTransactionStatus?orderTrackingId={order_tracking_id}",
    )
    return {
        "status_code": data.get("status_code"),
        "payment_status_description": data.get("payment_status_description"),
        "amount": float(data.get("amount") or 0),
        "currency": data.get("currency"),
        "payment_method": data.get("payment_method"),
        "merchant_reference": data.get("merchant_reference"),
        "confirmation_code": data.get("confirmation_code"),
        "raw": data,
    }


def is_completed(description):
    return str(description or "").upper() == "COMPLETED"


def is_failed(description):
    return str(description or "").upper() in ("FAILED", "INVALID", "REVERSED")
