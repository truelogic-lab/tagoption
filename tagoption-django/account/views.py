from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.serializers import UserSerializer

from .models import Verification

User = get_user_model()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    current = request.data.get("current") or ""
    new = request.data.get("next") or ""

    if not current or not new:
        return Response({"error": "current and next are required"}, status=400)
    if len(new) < 6:
        return Response({"error": "New password must be at least 6 characters"}, status=400)
    if not request.user.check_password(current):
        return Response({"error": "Current password is incorrect"}, status=400)

    request.user.set_password(new)
    request.user.save(update_fields=["password"])
    return Response({"ok": True})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    name = request.data.get("name")
    email = request.data.get("email")

    update_fields = []

    if name is not None:
        name = str(name).strip()
        if not name:
            return Response({"error": "Name cannot be empty"}, status=400)
        request.user.name = name
        update_fields.append("name")

    if email is not None:
        email = str(email).strip().lower()
        if not email:
            return Response({"error": "Email cannot be empty"}, status=400)
        if User.objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists():
            return Response({"error": "Email already registered"}, status=400)
        request.user.email = email
        update_fields.append("email")

    if not update_fields:
        return Response({"error": "Nothing to update"}, status=400)

    request.user.save(update_fields=update_fields)
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verification_status(request):
    v = Verification.objects.filter(user=request.user).first()
    return Response({
        "status": v.status if v else Verification.STATUS_NONE,
        "submittedAt": v.submitted_at if v else None,
        "reviewedAt": v.reviewed_at if v else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verification_submit(request):
    v, _ = Verification.objects.get_or_create(user=request.user)

    # Do not allow a second submission to reset an approved or already-pending
    # record. The user can only submit when there is nothing outstanding.
    if v.status == Verification.STATUS_APPROVED:
        return Response(
            {"status": v.status, "submittedAt": v.submitted_at,
             "error": "Already verified"},
            status=409,
        )
    if v.status == Verification.STATUS_PENDING:
        return Response(
            {"status": v.status, "submittedAt": v.submitted_at,
             "error": "A submission is already pending review"},
            status=409,
        )

    v.payload = request.data or {}
    v.status = Verification.STATUS_PENDING
    v.submitted_at = timezone.now()
    v.save()
    return Response({"status": v.status, "submittedAt": v.submitted_at})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    # Stub. Real implementation needs a TOTP secret and QR provisioning.
    # The client treats 200 with enabled=false as "not yet supported".
    return Response({"ok": True, "enabled": False, "note": "2FA not yet available"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    return Response({"ok": True, "enabled": False})


@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    """
    JWT is stateless. Logout is the client discarding its token. This endpoint
    exists so the client's logout() call doesn't 404; it does nothing.
    """
    return Response({"ok": True})


