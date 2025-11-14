# chat/serializers.py
from rest_framework import serializers
from .models import ChatRoom, Message

class ChatRoomSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(source="pet.name", read_only=True)
    from rest_framework.fields import SerializerMethodField
    pet_owner_username = SerializerMethodField()
    user1_username = serializers.CharField(source="user1.username", read_only=True)
    user2_username = serializers.CharField(source="user2.username", read_only=True)

    class Meta:
        model = ChatRoom
        fields = ["id", "pet", "pet_name", "pet_owner_username", "user1", "user1_username", "user2", "user2_username", "created_at"]

    def get_pet_owner_username(self, obj):
        try:
            return obj.pet.created_by.username if obj.pet and obj.pet.created_by else None
        except Exception:
            return None


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        # room and sender are set server-side in the view (perform_create), mark them read-only
        fields = ["id", "room", "sender", "sender_username", "content", "timestamp"]
        read_only_fields = ["room", "sender", "sender_username", "timestamp"]
