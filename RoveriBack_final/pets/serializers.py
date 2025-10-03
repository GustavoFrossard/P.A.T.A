from rest_framework import serializers
from .models import PetCard


class PetCardSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PetCard
        fields = [
            "id",
            "name",
            "species",
            "breed",
            "age_text",
            "description",
            "city",
            "image",
            "image_url",
            "created_by",
            "created_by_username",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_by",
            "created_at",
            "updated_at",
            "created_by_username",
            "image_url",
        ]

    def get_image_url(self, obj):
        """Retorna a URL completa da imagem para o frontend consumir direto"""
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
