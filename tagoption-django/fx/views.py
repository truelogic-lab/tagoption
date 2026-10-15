from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .service import current_rate


@api_view(["GET"])
@permission_classes([AllowAny])
def usd_kes(request):
    r = current_rate()
    return Response({"pair": "USD/KES", "rate": r["rate"], "source": r["source"]})
