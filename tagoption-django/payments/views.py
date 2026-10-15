import logging
import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction as db_transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import new_id
from accounts.notifications import Notification
from fx.service import current_rate
from wallet.models import Balance, Transaction

from .models import Deposit
from . import service

log = logging.getLogger(__name__)

# Reject the deposit if the client's quoted rate differs from the server's by
# more than this fraction. Protects against tampered payloads and stale quotes.
RATE_TOLERANCE = Decimal("0.02")


def _new_reference():
    return f"dep_{uuid.uuid4().hex[:16]}"


def _credit_deposit(deposit):
    """
    Apply a completed deposit to the user's balance. Idempotent: the caller
    checks status, this function rechecks under a row lock before mutating.
    """
    with db_transaction.atomic():
        locked = Deposit.objects.select_for_update().get(pk=deposit.pk)
        if locked.status == Deposit.STATUS_COMPLETED:
            return False

        bal = Balance.objects.select_for_update().get_or_create(user=locked.user)[0]
        bal.balance_cents += locked.amount_cents
        bal.save()

        Transaction.objects.create(
            id=new_id("t"),
            user=locked.user,
            type="deposit",
            amount_cents=locked.amount_cents,
            method=locked.method or "pesapal",
            reference=locked.id,
            status="completed",
        )

        locked.status = Deposit.STATUS_COMPLETED
        locked.credited_at = timezone.now()
        locked.save()

        Notification.objects.create(
            user=locked.user,
            type="wallet",
            title=f"Deposit received: ${locked.amount_cents / 100:.2f}",
            body=f"Reference {locked.reference}.",
            reference=f"deposit:{locked.id}",
        )
    return True


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_deposit(request):
    usd_amount_raw = request.data.get("amount")
    client_rate_raw = request.data.get("rate")
    method = (request.data.get("method") or "pesapal").strip()
    phone = (request.data.get("phone") or "").strip()
    email = (request.data.get("email") or request.user.email or "").strip()

    if not usd_amount_raw:
        return Response({"error": "amount is required"}, status=400)

    try:
        usd_amount = Decimal(str(usd_amount_raw))
    except Exception:
        return Response({"error": "Invalid amount"}, status=400)

    if usd_amount <= 0:
        return Response({"error": "Invalid amount"}, status=400)

    # Server owns the rate. Client sends what it displayed so we can detect
    # tampering or staleness, but the rate we use is ours.
    server_rate = Decimal(str(current_rate()["rate"]))
    if client_rate_raw not in (None, ""):
        try:
            client_rate = Decimal(str(client_rate_raw))
        except Exception:
            return Response({"error": "Invalid rate"}, status=400)

        drift = abs(client_rate - server_rate) / server_rate
        if drift > RATE_TOLERANCE:
            return Response(
                {"error": "Exchange rate has moved. Refresh and try again."},
                status=409,
            )

    # KES charged = USD amount * server rate, rounded to whole shillings.
    kes_amount = (usd_amount * server_rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    if kes_amount <= 0:
        return Response({"error": "Amount too small"}, status=400)

    usd_cents = int((usd_amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    kes_cents = int((kes_amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    reference = _new_reference()
    deposit = Deposit.objects.create(
        user=request.user,
        amount_cents=usd_cents,
        kes_charged_cents=kes_cents,
        rate_at_deposit=server_rate,
        currency="USD",
        method=method,
        phone=phone,
        email=email,
        reference=reference,
    )

    try:
        result = service.submit_order(
            reference=reference,
            # Pesapal operates in KES for Kenyan merchants. Send shillings,
            # not the USD figure the user typed.
            amount=float(kes_amount),
            currency="KES",
            description=f"TagOption deposit (${usd_amount})",
            email=email,
            phone=phone,
        )
    except service.PesapalError as exc:
        deposit.status = Deposit.STATUS_FAILED
        deposit.save(update_fields=["status"])
        log.warning("deposit %s submission failed: %s", reference, exc)
        return Response({"error": str(exc)}, status=502)

    deposit.order_tracking_id = result["order_tracking_id"]
    deposit.redirect_url = result["redirect_url"]
    deposit.save(update_fields=["order_tracking_id", "redirect_url"])

    return Response(
        {
            "reference": deposit.reference,
            "orderTrackingId": deposit.order_tracking_id,
            "redirectUrl": deposit.redirect_url,
            "amount": usd_cents / 100,
            "kesCharged": kes_cents / 100,
            "rate": float(server_rate),
        },
        status=201,
    )


def _deposit_payload(deposit):
    return {
        "reference": deposit.reference,
        "status": deposit.status,
        "amount": deposit.amount_cents / 100,
        "currency": deposit.currency,
        "kesCharged": deposit.kes_charged_cents / 100,
        "rate": float(deposit.rate_at_deposit) if deposit.rate_at_deposit else None,
        "confirmationCode": deposit.confirmation_code,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status(request, order_tracking_id):
    try:
        deposit = Deposit.objects.get(order_tracking_id=order_tracking_id, user=request.user)
    except Deposit.DoesNotExist:
        return Response({"error": "Unknown deposit"}, status=404)

    if deposit.status in (Deposit.STATUS_COMPLETED, Deposit.STATUS_FAILED, Deposit.STATUS_REVERSED):
        return Response(_deposit_payload(deposit))

    try:
        s = service.get_status(order_tracking_id)
    except service.PesapalError as exc:
        return Response({"error": str(exc)}, status=502)

    deposit.last_status_payload = s["raw"]

    if service.is_completed(s["payment_status_description"]):
        deposit.confirmation_code = s.get("confirmation_code") or ""
        deposit.save(update_fields=["last_status_payload", "confirmation_code"])
        _credit_deposit(deposit)
        deposit.refresh_from_db()
    elif service.is_failed(s["payment_status_description"]):
        deposit.status = Deposit.STATUS_FAILED
        deposit.save(update_fields=["last_status_payload", "status"])
    else:
        deposit.save(update_fields=["last_status_payload"])

    return Response(_deposit_payload(deposit))


@csrf_exempt
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def ipn(request):
    """
    Pesapal server-to-server notification. Body is untrusted — always call
    GetTransactionStatus before crediting. Credit is idempotent.
    """
    order_tracking_id = request.data.get("OrderTrackingId") or request.query_params.get("OrderTrackingId")
    merchant_reference = request.data.get("OrderMerchantReference") or request.query_params.get("OrderMerchantReference")

    if not order_tracking_id:
        return Response({"status": "ignored", "reason": "no order tracking id"}, status=200)

    deposit = None
    if merchant_reference:
        deposit = Deposit.objects.filter(reference=merchant_reference).first()
    if not deposit:
        deposit = Deposit.objects.filter(order_tracking_id=order_tracking_id).first()

    if not deposit:
        log.warning("ipn for unknown deposit: %s / %s", order_tracking_id, merchant_reference)
        return Response({"status": "ignored", "reason": "unknown deposit"}, status=200)

    try:
        s = service.get_status(order_tracking_id)
    except service.PesapalError as exc:
        log.warning("ipn status lookup failed for %s: %s", deposit.reference, exc)
        return Response({"status": "retry", "reason": str(exc)}, status=200)

    deposit.order_tracking_id = deposit.order_tracking_id or order_tracking_id
    deposit.last_status_payload = s["raw"]

    if service.is_completed(s["payment_status_description"]):
        deposit.confirmation_code = s.get("confirmation_code") or ""
        deposit.save(update_fields=["order_tracking_id", "last_status_payload", "confirmation_code"])
        _credit_deposit(deposit)
    elif service.is_failed(s["payment_status_description"]):
        deposit.status = Deposit.STATUS_FAILED
        deposit.save(update_fields=["order_tracking_id", "last_status_payload", "status"])
    else:
        deposit.save(update_fields=["order_tracking_id", "last_status_payload"])

    return Response({"status": "ok"}, status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def callback(request):
    return Response(
        {
            "ok": True,
            "orderTrackingId": request.query_params.get("OrderTrackingId", ""),
            "merchantReference": request.query_params.get("OrderMerchantReference", ""),
        }
    )
