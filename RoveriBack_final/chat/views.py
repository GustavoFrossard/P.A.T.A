from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import ChatRoom, Message
from pets.models import PetCard
from .serializers import ChatRoomSerializer, MessageSerializer
from rest_framework.views import APIView


class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Listar apenas salas do usuário logado
        return ChatRoom.objects.filter(user1=self.request.user) | ChatRoom.objects.filter(user2=self.request.user)

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

        serializer = self.get_serializer(chatroom)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        return Message.objects.filter(room_id=room_id).order_by("timestamp")

    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            room_id=self.kwargs["room_id"]
        )


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
        return Response(serializer.data, status=status.HTTP_200_OK)
