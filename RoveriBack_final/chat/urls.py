from django.urls import path
from .views import ChatRoomListCreateView, MessageListCreateView, ChatRoomByPetView

urlpatterns = [
    path('rooms/by_pet/<int:pet_id>/', ChatRoomByPetView.as_view(), name='chatroom-by-pet'),
    path("rooms/", ChatRoomListCreateView.as_view(), name="chatroom-list-create"),
    path("rooms/<int:room_id>/messages/", MessageListCreateView.as_view(), name="message-list-create"),
]
