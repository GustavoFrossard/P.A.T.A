from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model

from .models import PetCard
from .serializers import PetCardSerializer
from .permissions import IsOwnerOrReadOnly

from rest_framework.permissions import IsAuthenticated


class PetCardViewSet(viewsets.ModelViewSet):
    queryset = PetCard.objects.all().select_related("created_by")
    serializer_class = PetCardSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # força o pet a já ser publicado
        serializer.save(created_by=self.request.user, is_published=True)

    def get_queryset(self):
        qs = PetCard.objects.all().select_related("created_by")
        return qs.filter(is_published=True) if self.request.user.is_anonymous else qs


User = get_user_model()


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        pets_adotados = PetCard.objects.filter(is_published=True).count()
        usuarios_ativos = User.objects.count()
        cidades_atendidas = PetCard.objects.values("city").distinct().count()

        data = {
            "petsAdotados": pets_adotados,
            "usuariosAtivos": usuarios_ativos,
            "cidadesAtendidas": cidades_atendidas,
        }
        return Response(data)
