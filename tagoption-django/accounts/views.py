from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .notifications import Notification
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    UserSerializer,
    NotificationSerializer,
)

User = get_user_model()


def _token_for(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = User.objects.create_user(
        email=data["email"],
        password=data["password"],
        name=data["name"],
    )
    return Response(
        {"token": _token_for(user), "user": UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
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

    return Response({"token": _token_for(user), "user": UserSerializer(user).data})


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
