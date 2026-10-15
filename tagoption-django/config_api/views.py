from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from adminapi.audit import record
from adminapi.permissions import require_admin

from .service import get_config, set_config


def _config_payload():
    win_rate, payout = get_config()
    edge = float((1 - win_rate) - win_rate * payout)
    return {
        "payoutMultiplier": float(payout),
        "winRate": float(win_rate),
        "houseEdge": edge,
        "manualTradeMs": settings.MANUAL_TRADE_MS,
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def config(request):
    return Response(_config_payload())


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@require_admin
def admin_config(request):
    if request.method == "GET":
        return Response(_config_payload())

    win_rate = request.data.get("winRate")
    payout = request.data.get("payoutMult")

    if win_rate is not None:
        try:
            win_rate = float(win_rate)
        except (TypeError, ValueError):
            return Response({"error": "Invalid winRate"}, status=400)
        if win_rate < 0 or win_rate > 1:
            return Response({"error": "winRate out of range"}, status=400)

    if payout is not None:
        try:
            payout = float(payout)
        except (TypeError, ValueError):
            return Response({"error": "Invalid payoutMult"}, status=400)
        if payout < 0 or payout > 5:
            return Response({"error": "payoutMult out of range"}, status=400)

    set_config(win_rate=win_rate, payout_mult=payout)
    record(
        request.user, "config.update",
        metadata={"winRate": win_rate, "payoutMult": payout},
    )
    return Response(_config_payload())


# ---------- Site config (name, logo, favicon, support email) ----------

from .models import SiteConfig


def _site_payload():
    row = SiteConfig.objects.filter(id=1).first()
    return {
        "name": row.name if row else "",
        "logoUrl": row.logo_url if row else "",
        "faviconUrl": row.favicon_url if row else "",
        "supportEmail": row.support_email if row else "",
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def site_config(request):
    """Public. The client fetches this once per session to brand the UI."""
    return Response(_site_payload())


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@require_admin
def admin_site_config(request):
    if request.method == "GET":
        return Response(_site_payload())

    row, _ = SiteConfig.objects.get_or_create(id=1)

    if "name" in request.data:
        row.name = str(request.data["name"]).strip()[:60]
    if "logoUrl" in request.data:
        row.logo_url = str(request.data["logoUrl"]).strip()[:400]
    if "faviconUrl" in request.data:
        row.favicon_url = str(request.data["faviconUrl"]).strip()[:400]
    if "supportEmail" in request.data:
        row.support_email = str(request.data["supportEmail"]).strip()[:254]

    row.save()
    record(request.user, "site.update", metadata=_site_payload())
    return Response(_site_payload())
