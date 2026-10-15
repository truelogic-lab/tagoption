from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .throttles import LoginThrottle, SignupThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from .notifications import Notification
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    UserSerializer,
    NotificationSerializer,
)

User = get_user_model()


def _issue_tokens(user):
    """
    Mint a refresh + access pair and stamp the current token_version onto the
    access token so the auth class can detect later bumps.
    """
    refresh = RefreshToken.for_user(user)
    refresh["tv"] = int(user.token_version or 0)
    access = refresh.access_token
    access["tv"] = int(user.token_version or 0)
    return {"token": str(access), "refresh": str(refresh)}


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SignupThrottle])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = User.objects.create_user(
        email=data["email"],
        password=data["password"],
        name=data["name"],
    )
    tokens = _issue_tokens(user)
    return Response(
        {**tokens, "user": UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        user = User.objects.get(email__iexact=data["email"])
    except User.DoesNotExist:
        return Response({"error": "Invalid email or password"}, status=401)

    if not user.check_password(data["password"]):
        return Response({"error": "Invalid email or password"}, status=401)

    if user.banned:
        return Response({"error": "Account suspended"}, status=403)

    tokens = _issue_tokens(user)
    return Response({**tokens, "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([AllowAny])
def refresh(request):
    """
    Exchange a refresh token for a new access + refresh pair. The old refresh
    is rotated out so a stolen refresh token becomes detectable: whoever
    refreshes second gets a blacklist error and the session is burned.

    The client stores both tokens; if refresh 401s, it clears the session and
    sends the user to /auth.
    """
    raw = request.data.get("refresh") or ""
    if not raw:
        return Response({"error": "refresh is required"}, status=400)

    try:
        old = RefreshToken(raw)
    except TokenError as exc:
        return Response({"error": str(exc)}, status=401)

    try:
        user_id = old[api_settings.USER_ID_CLAIM]
        user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
    except (KeyError, User.DoesNotExist):
        return Response({"error": "Invalid refresh token"}, status=401)

    if user.banned or not user.is_active:
        return Response({"error": "Account suspended"}, status=403)

    # A refresh issued before the last bump is dead.
    if int(old.get("tv", 0)) != int(user.token_version or 0):
        return Response({"error": "Token is no longer valid"}, status=401)

    # Blacklist the old refresh if blacklisting is enabled.
    try:
        old.blacklist()
    except AttributeError:
        pass

    tokens = _issue_tokens(user)
    return Response({**tokens, "user": UserSerializer(user).data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    qs = Notification.objects.filter(user=request.user)[:100]
    return Response(NotificationSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_unread_count(request):
    count = Notification.objects.filter(user=request.user, read=False).count()
    return Response({"count": count})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, notification_id):
    updated = Notification.objects.filter(
        id=notification_id, user=request.user
    ).update(read=True)
    return Response({"ok": updated > 0})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notifications_mark_all_read(request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({"ok": True})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def notifications_clear(request):
    Notification.objects.filter(user=request.user).delete()
    return Response({"ok": True})
