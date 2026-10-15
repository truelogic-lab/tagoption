from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def health(_request):
    return JsonResponse({"ok": True})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health),
    path("", include("accounts.urls")),
    path("", include("wallet.urls")),
    path("", include("trading.urls")),
    path("", include("markets.urls")),
    path("", include("fx.urls")),
]
