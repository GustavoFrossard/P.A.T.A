# chat/serializers.py
from rest_framework import serializers
from .models import ChatRoom, Message

class ChatRoomSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(source="pet.name", read_only=True)
    from rest_framework.fields import SerializerMethodField
    pet_owner_username = SerializerMethodField()
    user1_username = serializers.CharField(source="user1.username", read_only=True)
    user2_username = serializers.CharField(source="user2.username", read_only=True)
    other_user_username = SerializerMethodField()  # Nome do outro usuário na conversa
    other_user_full_name = SerializerMethodField()  # Nome completo do outro usuário

    class Meta:
        model = ChatRoom
        fields = ["id", "pet", "pet_name", "pet_owner_username", "user1", "user1_username", "user2", "user2_username", "other_user_username", "other_user_full_name", "created_at"]

    def get_pet_owner_username(self, obj):
        try:
            return obj.pet.created_by.username if obj.pet and obj.pet.created_by else None
        except Exception:
            return None

    def get_other_user_username(self, obj):
        """Retorna o username do outro usuário na conversa (não o usuário logado)"""
        try:
            request = self.context.get('request')
            if not request or not request.user:
                return None
            
            current_user = request.user
            
            # Se o usuário logado é user1, retorna user2, e vice-versa
            if obj.user1 and obj.user1.id == current_user.id:
                return obj.user2.username if obj.user2 else None
            elif obj.user2 and obj.user2.id == current_user.id:
                return obj.user1.username if obj.user1 else None
            
            return None
        except Exception:
            return None

    def get_other_user_full_name(self, obj):
        """Retorna o nome completo do outro usuário na conversa"""
        try:
            request = self.context.get('request')
            if not request or not request.user:
                return None
            
            current_user = request.user
            
            # Se o usuário logado é user1, retorna user2, e vice-versa
            if obj.user1 and obj.user1.id == current_user.id:
                if obj.user2:
                    return f"{obj.user2.first_name} {obj.user2.last_name}".strip() or obj.user2.username
                return None
            elif obj.user2 and obj.user2.id == current_user.id:
                if obj.user1:
                    return f"{obj.user1.first_name} {obj.user1.last_name}".strip() or obj.user1.username
                return None
            
            return None
        except Exception:
            return None


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        # room and sender are set server-side in the view (perform_create), mark them read-only
        fields = ["id", "room", "sender", "sender_username", "content", "timestamp"]
        read_only_fields = ["room", "sender", "sender_username", "timestamp"]
