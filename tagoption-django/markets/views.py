from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .feed import snapshot
from .models import Market
from .serializers import MarketSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def markets_list(request):
    """
    Return every market with its live tick. Disabled markets are included so
    the client can grey them out without the row disappearing mid-session.
    """
    rows = list(Market.objects.all())
    out = []
    for m in rows:
        row = MarketSerializer(m).data
        row.update(snapshot(m.id, m.base))
        out.append(row)
    return Response(out)


@api_view(["GET"])
@permission_classes([AllowAny])
def market_tick(request, market_id):
    """
    Single-market tick. Mirrors Fastify's GET /markets/:id/price response.
    """
    try:
        m = Market.objects.get(id=market_id)
    except Market.DoesNotExist:
        return Response({"error": "Unknown market"}, status=404)

    tick = snapshot(m.id, m.base)
    return Response(
        {
            "id": m.id,
            "name": m.name,
            "price": tick["price"],
            "change": tick["change"],
            "lastDigit": tick["lastDigit"],
            "history": tick["history"],
            "enabled": m.enabled,
        }
    )
