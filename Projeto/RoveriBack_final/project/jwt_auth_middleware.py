from urllib.parse import parse_qs
from channels.db import database_sync_to_async

from django.contrib.auth import get_user_model
from http.cookies import SimpleCookie


class JwtAuthMiddleware:
    """ASGI middleware that authenticates a user from a JWT passed in the
    WebSocket query string as `?token=<jwt>`.

    Implemented to match Channels middleware pattern: the instance is
    initialized with the inner application and then called with
    (scope, receive, send).
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # We operate on a shallow copy of scope to avoid mutating the original
        # object unexpectedly.
        scope = dict(scope)

        # parse query string for ?token=
        query_string = scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]

        if token:
            try:
                # Validate token using SimpleJWT utilities
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                # fetch user from DB asynchronously
                user = await database_sync_to_async(get_user_model().objects.get)(pk=validated_token['user_id'])
                scope['user'] = user
            except Exception:
                # Any failure leaves scope['user'] as-is (usually AnonymousUser)
                pass

        # If no token in query string, attempt to read HttpOnly cookies from the
        # ASGI scope headers (useful when the backend sets JWTs in cookies).
        # This keeps the WebSocket auth compatible with the HTTP cookie-based
        # login flow used by the app (access_token cookie).
        if not token:
            try:
                headers = dict(scope.get('headers', []))
                cookie_header = headers.get(b'cookie')
                if cookie_header:
                    cookie_str = cookie_header.decode('utf-8')
                    sc = SimpleCookie()
                    sc.load(cookie_str)
                    ck = sc.get('access_token') or sc.get('access') or sc.get('token')
                    if ck:
                        token = ck.value
                        # try to validate and set user
                        from rest_framework_simplejwt.authentication import JWTAuthentication
                        jwt_auth = JWTAuthentication()
                        validated_token = jwt_auth.get_validated_token(token)
                        user = await database_sync_to_async(get_user_model().objects.get)(pk=validated_token['user_id'])
                        scope['user'] = user
            except Exception:
                # keep behavior conservative: leave scope['user'] alone on any error
                pass

        return await self.inner(scope, receive, send)
