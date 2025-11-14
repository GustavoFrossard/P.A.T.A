from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    EmailTokenObtainPairSerializer,
    ProfileSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework.permissions import IsAdminUser
from rest_framework import generics
from rest_framework import permissions
from .models import Profile

User = get_user_model()


# 🔹 Registro de usuário
@method_decorator(csrf_exempt, name='dispatch')
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

        # 🔹 Cookies SameSite=None; Secure=True para cross-origin (httponly=False para mobile)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=False,  # False para funcionar em mobile cross-origin
            samesite="None",
            secure=True,
            max_age=60 * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=False,  # False para funcionar em mobile cross-origin
            samesite="None",
            secure=True,
            max_age=7 * 24 * 60 * 60,
        )
        return response


# 🔹 Login com email
@method_decorator(csrf_exempt, name='dispatch')
class CookieTokenObtainPairView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = EmailTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Return tokens in body as well so JS clients running on a different origin can
        # store the access token and send it in the Authorization header if needed.
        response = Response(
            {
                "detail": "Login OK",
                "user": data["user"],
                "access": data.get("access"),
                "refresh": data.get("refresh"),
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            "access_token",
            data["access"],
            httponly=False,  # False para funcionar em mobile cross-origin
            samesite="None",
            secure=True,
            max_age=60 * 60,
        )
        response.set_cookie(
            "refresh_token",
            data["refresh"],
            httponly=False,  # False para funcionar em mobile cross-origin
            samesite="None",
            secure=True,
            max_age=7 * 24 * 60 * 60,
        )

        return response


# 🔹 Refresh de token
@method_decorator(csrf_exempt, name='dispatch')
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
                httponly=False,  # False para funcionar em mobile cross-origin
                samesite="None",
                secure=True,
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


# 🔹 Update Profile
class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        
        # Validate email uniqueness if being changed
        if 'email' in request.data and request.data['email'] != user.email:
            if User.objects.filter(email=request.data['email']).exists():
                return Response(
                    {"email": ["Este email já está cadastrado."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update user fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        user.save()

        # Update or create profile
        profile, created = Profile.objects.get_or_create(user=user)
        
        # Handle file upload separately
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        
        # Update other profile fields
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        if 'city' in request.data:
            profile.city = request.data['city']
        
        profile.save()
        
        # Return updated user data
        user_serializer = UserSerializer(user, context={'request': request})
        return Response(user_serializer.data, status=status.HTTP_200_OK)


# -------------------------
# Admin user management
# -------------------------
class UsersListView(generics.ListAPIView):
    """List all users (admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserAdminActionView(APIView):
    """Perform admin actions on users: block, unblock, delete."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk, action, *args, **kwargs):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == "block":
            user.is_active = False
            user.save()
            return Response({"detail": "User blocked"}, status=status.HTTP_200_OK)
        elif action == "unblock":
            user.is_active = True
            user.save()
            return Response({"detail": "User unblocked"}, status=status.HTTP_200_OK)
        elif action == "delete":
            user.delete()
            return Response({"detail": "User deleted"}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"detail": "Unknown action"}, status=status.HTTP_400_BAD_REQUEST)
