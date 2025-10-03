from django.contrib import admin
from django.urls import path, include
from accounts.views import CookieTokenObtainPairView, LogoutView, RegisterView, UserDetailView, CookieTokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Accounts (registration, login/logout)
    path('api/accounts/register/', RegisterView.as_view(), name='register'),
    path('api/accounts/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/accounts/logout/', LogoutView.as_view(), name='logout'),
    path('api/accounts/user/', UserDetailView.as_view(), name='user-detail'),

    # JWT token endpoints (aliases)
    path('api/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair_alias'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),

    path('admin/', admin.site.urls),

    # App includes
    path('api/', include('pets.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/chat/', include('chat.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
