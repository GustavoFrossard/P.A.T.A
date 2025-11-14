from django.urls import path
from .views import UsersListView, UserAdminActionView

urlpatterns = [
    path("", UsersListView.as_view(), name="admin-users-list"),
    path("<int:pk>/<str:action>/", UserAdminActionView.as_view(), name="admin-user-action"),
]
