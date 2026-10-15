"""
Admin-only market endpoints. The user-facing view in markets/views.py only
reads; these allow the console to change what the platform offers.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from adminapi.audit import record
from adminapi.permissions import require_admin
from markets.feed import snapshot
from markets.models import Market


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@require_admin
def list_markets(request):
    rows = Market.objects.all().order_by("sort_order", "id")
    out = []
    for m in rows:
        tick = snapshot(m.id, m.base)
        out.append({
            "id": m.id,
            "name": m.name,
            "base": float(m.base),
            "enabled": m.enabled,
            "sortOrder": m.sort_order,
            "livePrice": tick["price"],
            "change": tick["change"],
        })
    return Response(out)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_admin
def toggle_market(request, market_id):
    try:
        m = Market.objects.get(id=market_id)
    except Market.DoesNotExist:
        return Response({"error": "Market not found"}, status=404)

    enabled = request.data.get("enabled")
    m.enabled = (not m.enabled) if enabled is None else bool(enabled)
    m.save(update_fields=["enabled"])

    record(
        request.user, "market.toggle",
        target_type="market", target_id=m.id,
        metadata={"enabled": m.enabled},
    )
    return Response({"id": m.id, "enabled": m.enabled})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
@require_admin
def edit_market(request, market_id):
    try:
        m = Market.objects.get(id=market_id)
    except Market.DoesNotExist:
        return Response({"error": "Market not found"}, status=404)

    changes = {}

    if "name" in request.data:
        name = str(request.data["name"]).strip()
        if not name:
            return Response({"error": "name cannot be empty"}, status=400)
        m.name = name
        changes["name"] = name

    if "base" in request.data:
        try:
            base = float(request.data["base"])
        except (TypeError, ValueError):
            return Response({"error": "base must be a number"}, status=400)
        if base <= 0:
            return Response({"error": "base must be positive"}, status=400)
        m.base = base
        changes["base"] = base

    if "sortOrder" in request.data:
        try:
            m.sort_order = int(request.data["sortOrder"])
            changes["sortOrder"] = m.sort_order
        except (TypeError, ValueError):
            return Response({"error": "sortOrder must be an integer"}, status=400)

    if not changes:
        return Response({"error": "nothing to update"}, status=400)

    m.save()
    record(
        request.user, "market.edit",
        target_type="market", target_id=m.id, metadata=changes,
    )
    return Response({"id": m.id, **changes})
