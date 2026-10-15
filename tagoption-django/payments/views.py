import logging
import uuid

from django.db import transaction as db_transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import new_id
from accounts.notifications import Notification
from wallet.models import Balance, Transaction

from .models import Deposit
from . import service

log = logging.getLogger(__name__)


def _new_reference():
    return f"dep_{uuid.uuid4().hex[:16]}"


def _credit_deposit(deposit):
    """
    Apply a completed deposit to the user's balance. Must be idempotent:
    the caller checks status, this function assumes the transition is valid
    and holds the balance row lock while mutating.
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
    amount = request.data.get("amount")
    method = (request.data.get("method") or "pesapal").strip()
    phone = (request.data.get("phone") or "").strip()
    email = (request.data.get("email") or request.user.email or "").strip()
    currency = (request.data.get("currency") or "KES").strip().upper()

    if not amount:
        return Response({"error": "amount is required"}, status=400)

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return Response({"error": "Invalid amount"}, status=400)

    if amount <= 0:
        return Response({"error": "Invalid amount"}, status=400)

    reference = _new_reference()
    deposit = Deposit.objects.create(
        user=request.user,
        amount_cents=int(round(amount * 100)),
        currency=currency,
        method=method,
        phone=phone,
        email=email,
        reference=reference,
    )

    try:
        result = service.submit_order(
            reference=reference,
            amount=amount,
            currency=currency,
            description="TagOption deposit",
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
            "order_tracking_id": deposit.order_tracking_id,
            "redirect_url": deposit.redirect_url,
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status(request, order_tracking_id):
    try:
        deposit = Deposit.objects.get(order_tracking_id=order_tracking_id, user=request.user)
    except Deposit.DoesNotExist:
        return Response({"error": "Unknown deposit"}, status=404)

    # If we already have a final state, don't hit Pesapal again.
    if deposit.status in (Deposit.STATUS_COMPLETED, Deposit.STATUS_FAILED, Deposit.STATUS_REVERSED):
        return Response(
            {
                "reference": deposit.reference,
                "status": deposit.status,
                "amount": deposit.amount_cents / 100,
                "currency": deposit.currency,
                "confirmation_code": deposit.confirmation_code,
            }
        )

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

    return Response(
        {
            "reference": deposit.reference,
            "status": deposit.status,
            "amount": deposit.amount_cents / 100,
            "currency": deposit.currency,
            "confirmation_code": deposit.confirmation_code,
        }
    )


@csrf_exempt
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def ipn(request):
    """
    Pesapal server-to-server notification.

    The body cannot be trusted. We always call GetTransactionStatus before
    crediting. The credit function is idempotent, so a duplicate IPN is safe.
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
    """
    User-facing redirect from Pesapal. The client reads OrderTrackingId from
    the query string and polls /payments/status. We don't credit here — the
    IPN or the status poll does that.
    """
    return Response(
        {
            "ok": True,
            "order_tracking_id": request.query_params.get("OrderTrackingId", ""),
            "merchant_reference": request.query_params.get("OrderMerchantReference", ""),
        }
    )
