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
