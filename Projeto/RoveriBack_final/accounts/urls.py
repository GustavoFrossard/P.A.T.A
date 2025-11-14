from django.urls import path
from .views import (
    RegisterView,
    UserDetailView,
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    UpdateProfileView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("user/", UserDetailView.as_view(), name="user-detail"),
    path("profile/update/", UpdateProfileView.as_view(), name="profile-update"),
]
