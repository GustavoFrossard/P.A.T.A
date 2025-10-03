from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    EmailTokenObtainPairSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

User = get_user_model()


# 🔹 Registro de usuário
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response_data = {
            "user": UserSerializer(user, context={"request": request}).data,
            "access": access_token,
            "refresh": refresh_token,
        }
        response = Response(response_data, status=status.HTTP_201_CREATED)

        # 🔹 salva tokens em cookies HttpOnly
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=60 * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=7 * 24 * 60 * 60,
        )
        return response


# 🔹 Login com email
class CookieTokenObtainPairView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = EmailTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        response = Response(
            {"detail": "Login OK", "user": data["user"]},
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            "access_token",
            data["access"],
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=60 * 60,
        )
        response.set_cookie(
            "refresh_token",
            data["refresh"],
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=7 * 24 * 60 * 60,
        )

        return response


# 🔹 Refresh de token
class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh = request.data.get("refresh") or request.COOKIES.get("refresh_token")
        if not refresh:
            return Response(
                {"detail": "No refresh token provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {"detail": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED
            )

        access = serializer.validated_data.get("access")
        response = Response(
            {"detail": "Token refreshed", "access": access}, status=status.HTTP_200_OK
        )
        if access:
            response.set_cookie(
                "access_token",
                access,
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=60 * 60,
            )
        return response


# 🔹 Logout
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


# 🔹 User detail
class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
