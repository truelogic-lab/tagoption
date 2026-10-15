from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def health(_request):
    return JsonResponse({"ok": True})


urlpatterns = [
    # Django's built-in admin moves off /admin/ so the API surface can own
    # that prefix. The React admin dashboard talks to /admin/*, matching the
    # Fastify contract.
    path("django-admin/", admin.site.urls),
    path("health", health),
    path("", include("accounts.urls")),
    path("", include("wallet.urls")),
    path("", include("trading.urls")),
    path("", include("markets.urls")),
    path("", include("fx.urls")),
    path("", include("payments.urls")),
    path("", include("adminapi.urls")),
]
