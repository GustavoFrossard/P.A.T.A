from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import StatsView, FavoritesView

# importa as viewsets que você já mostrou
from .views import PetCardViewSet

router = DefaultRouter()
router.register(r'pets', PetCardViewSet, basename='petcard')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', StatsView.as_view(), name='stats'),
    path('favorites/', FavoritesView.as_view(), name='favorites-list-create'),
    path('favorites/<int:pet_id>/', FavoritesView.as_view(), name='favorites-delete'),
]
