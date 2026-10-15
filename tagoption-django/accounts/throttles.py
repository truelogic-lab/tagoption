"""
Throttle classes that key on the true client IP.

Behind Cloudflare, `REMOTE_ADDR` is the edge IP, so the default AnonRateThrottle
either never fires (each request appears to come from a different edge) or
fires globally and locks out every user at once. The real client is in
CF-Connecting-IP, with X-Forwarded-For as a fallback.
"""
from rest_framework.throttling import AnonRateThrottle


class ClientIPThrottleMixin:
    def get_ident(self, request):
        cf = request.META.get("HTTP_CF_CONNECTING_IP")
        if cf:
            return cf.strip()

        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            # Leftmost entry is the originating client.
            return xff.split(",")[0].strip()

        return request.META.get("REMOTE_ADDR", "unknown")


class LoginThrottle(ClientIPThrottleMixin, AnonRateThrottle):
    scope = "auth_login"


class SignupThrottle(ClientIPThrottleMixin, AnonRateThrottle):
    scope = "auth_signup"
