from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import ChatRoom, Message
from pets.models import PetCard
from .serializers import ChatRoomSerializer, MessageSerializer
from rest_framework.views import APIView
from django.core.cache import cache
import os
import pusher


class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Listar apenas salas do usuário logado
        return ChatRoom.objects.filter(user1=self.request.user) | ChatRoom.objects.filter(user2=self.request.user)

    def list(self, request, *args, **kwargs):
        from django.core.cache import cache
        cache_key = f"chat_rooms_user_{request.user.id}_v1"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        data = serializer.data
        try:
            cache.set(cache_key, data, 30)
        except Exception:
            pass
        return Response(data)

    def create(self, request, *args, **kwargs):
        pet_id = request.data.get("pet_id")
        receiver_id = request.data.get("receiver_id")

        if not pet_id or not receiver_id:
            return Response({"error": "pet_id e receiver_id são obrigatórios"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pet = PetCard.objects.get(id=pet_id)
            receiver = User.objects.get(id=receiver_id)
        except (PetCard.DoesNotExist, User.DoesNotExist):
            return Response({"error": "Pet ou Usuário não encontrado"}, status=status.HTTP_404_NOT_FOUND)

        user1 = request.user
        user2 = receiver

        # Garantir ordem fixa para evitar duplicação
        if user1.id > user2.id:
            user1, user2 = user2, user1

        # Buscar se já existe uma sala entre esses dois usuários para esse pet
        chatroom, created = ChatRoom.objects.get_or_create(
            pet=pet,
            user1=user1,
            user2=user2,
        )
        # Invalidate cached room lists for both participants when a room is created
        try:
            from django.core.cache import cache
            cache.delete(f"chat_rooms_user_{user1.id}_v1")
            cache.delete(f"chat_rooms_user_{user2.id}_v1")
        except Exception:
            pass

        serializer = self.get_serializer(chatroom)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        # use select_related to avoid N+1 when accessing message.sender in serializers
        return Message.objects.filter(room_id=room_id).select_related('sender').order_by("timestamp")

    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            room_id=self.kwargs["room_id"]
        )

    def list(self, request, *args, **kwargs):
        """Return cached serialized messages for the room when available to reduce DB roundtrips.

        We cache the paginated response structure (dict with count/results) for a short TTL.
        """
        room_id = self.kwargs["room_id"]
        cache_key = f"chat_room_{room_id}_messages_v1"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            data = paginated.data
        else:
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

        # cache for a short time (seconds) to balance freshness vs latency
        try:
            cache.set(cache_key, data, 30)
        except Exception:
            pass

        return Response(data)

    def perform_create(self, serializer):
        # save and update/invalidate cache for this room
        msg = serializer.save(sender=self.request.user, room_id=self.kwargs["room_id"])
        
        # Trigger Pusher event for real-time notification
        try:
            pusher_client = pusher.Pusher(
                app_id=os.environ.get('PUSHER_APP_ID'),
                key=os.environ.get('PUSHER_KEY'),
                secret=os.environ.get('PUSHER_SECRET'),
                cluster=os.environ.get('PUSHER_CLUSTER'),
                ssl=True
            )
            
            # Serialize message for pusher
            msg_data = self.get_serializer(msg).data
            
            # Trigger event on room-specific channel
            pusher_client.trigger(
                f'chat-room-{self.kwargs["room_id"]}',
                'new-message',
                msg_data
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Pusher error: {e}")
        
        cache_key = f"chat_room_{self.kwargs['room_id']}_messages_v1"
        try:
            cached = cache.get(cache_key)
            # if cached is paginated dict with 'results', append and bump count
            if isinstance(cached, dict) and 'results' in cached:
                ser = self.get_serializer(msg)
                cached['results'].append(ser.data)
                cached['count'] = cached.get('count', 0) + 1
                cache.set(cache_key, cached, 30)
            elif isinstance(cached, list):
                ser = self.get_serializer(msg)
                cached.append(ser.data)
                cache.set(cache_key, cached, 30)
            else:
                # fallback: delete cache so next read repopulates
                cache.delete(cache_key)
        except Exception:
            try:
                cache.delete(cache_key)
            except Exception:
                pass


from django.shortcuts import get_object_or_404
from django.db.models import Q

class ChatRoomByPetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pet_id):
        pet = get_object_or_404(PetCard, id=pet_id)
        owner = pet.created_by
        me = request.user

        if owner == me:
            return Response({'detail': 'Você é o criador do pet.'}, status=status.HTTP_400_BAD_REQUEST)

        chat_qs = ChatRoom.objects.filter(pet=pet).filter(
            (Q(user1=me) & Q(user2=owner)) | (Q(user1=owner) & Q(user2=me))
        )
        chat = chat_qs.first()
        if not chat:
            chat = ChatRoom.objects.create(pet=pet, user1=me, user2=owner)
        serializer = ChatRoomSerializer(chat, context={'request': request})
        # Invalidate cached room lists for both participants so the new room shows immediately
        try:
            from django.core.cache import cache
            cache.delete(f"chat_rooms_user_{me.id}_v1")
            cache.delete(f"chat_rooms_user_{owner.id}_v1")
        except Exception:
            pass

        return Response(serializer.data, status=status.HTTP_200_OK)
