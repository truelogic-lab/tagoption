"""
JWT authentication with a per-user token version.

The default SimpleJWT authentication decodes the token and trusts it until it
expires. That means a banned user or a password change does not invalidate an
already-issued token. This class loads the user fresh and compares the `tv`
claim against `user.token_version`; a mismatch rejects the token. Combined with
a short access lifetime this gives near-immediate revocation.
"""
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings

User = get_user_model()


class VersionedJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise AuthenticationFailed("Token contained no recognizable user id")

        try:
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive")

        if user.banned:
            raise AuthenticationFailed("Account suspended")

        # Tokens issued before the last bump are dead. This is how password
        # change and ban propagate without a separate revocation store.
        token_tv = validated_token.get("tv", 0)
        if int(token_tv) != int(user.token_version or 0):
            raise AuthenticationFailed("Token is no longer valid")

        return user
