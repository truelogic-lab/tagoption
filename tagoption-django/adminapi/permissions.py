from functools import wraps

from django.conf import settings
from rest_framework.response import Response


def is_admin(user):
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "role", "") == "admin":
        return True
    if getattr(user, "is_staff", False):
        return True
    email = (getattr(user, "email", "") or "").lower()
    return email in settings.ADMIN_EMAILS


def require_admin(view):
    """
    Gate a view on the admin predicate. Returns 403, not 401, so the client
    can distinguish "not logged in" from "logged in but not allowed".
    """
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"error": "Admin access required"}, status=403)
        return view(request, *args, **kwargs)
    return wrapper
