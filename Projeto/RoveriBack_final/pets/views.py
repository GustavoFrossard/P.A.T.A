from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import PetCard, Favorite
from .serializers import PetCardSerializer
from .permissions import IsOwnerOrReadOnly

from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action


class PetCardViewSet(viewsets.ModelViewSet):
    queryset = PetCard.objects.all().select_related("created_by")
    serializer_class = PetCardSerializer
    # Allow anyone to read (list/retrieve). Create requires auth. Updates/deletes are
    # restricted to the owner only via the object-level permission `IsOwnerOrReadOnly`.
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        # força o pet a já ser publicado
        serializer.save(created_by=self.request.user, is_published=True)

    def get_queryset(self):
        qs = PetCard.objects.all().select_related("created_by")
        return qs.filter(is_published=True) if self.request.user.is_anonymous else qs

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_registered(self, request, pk=None):
        """Mark a pet as registered/not available (sets is_published=False).

        Owners and admins may perform this action.
        """
        try:
            pet = self.get_object()
        except Exception:
            return Response({"detail": "Pet not found"}, status=status.HTTP_404_NOT_FOUND)

        # allow only the owner to mark their pet as registered
        if request.user != pet.created_by:
            return Response({"detail": "Not permitted"}, status=status.HTTP_403_FORBIDDEN)

        pet.is_published = False
        pet.save()
        return Response(self.get_serializer(pet, context={"request": request}).data, status=status.HTTP_200_OK)


User = get_user_model()


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # Cache the stats for a short period to avoid multiple heavy DB counts
        from django.core.cache import cache
        cache_key = "site_stats_v1"
        data = cache.get(cache_key)
        if data is not None:
            return Response(data)

        pets_adotados = PetCard.objects.filter(is_published=True).count()
        usuarios_ativos = User.objects.count()
        cidades_atendidas = PetCard.objects.values("city").distinct().count()

        data = {
            "petsAdotados": pets_adotados,
            "usuariosAtivos": usuarios_ativos,
            "cidadesAtendidas": cidades_atendidas,
        }
        try:
            cache.set(cache_key, data, 60)
        except Exception:
            pass
        return Response(data)


class FavoritesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # return list of pet objects favorited by the user
        favs = request.user.favorites.select_related('pet').all()
        pets = [f.pet for f in favs]
        serializer = PetCardSerializer(pets, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        pet_id = request.data.get('pet')
        if not pet_id:
            return Response({'error': 'pet is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pet = PetCard.objects.get(id=pet_id)
        except PetCard.DoesNotExist:
            return Response({'error': 'Pet not found'}, status=status.HTTP_404_NOT_FOUND)

        fav, created = None, False
        try:
            fav, created = Favorite.objects.get_or_create(user=request.user, pet=pet)
        except Exception as e:
            return Response({'error': 'Could not create favorite'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = PetCardSerializer(pet, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, pet_id=None):
        if pet_id is None:
            return Response({'error': 'pet_id is required in URL'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            fav = Favorite.objects.get(user=request.user, pet_id=pet_id)
            fav.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)
