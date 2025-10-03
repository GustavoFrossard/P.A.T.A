from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from pets.models import PetCard
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


# 🔹 Serializer de Registro de Usuário
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password2", "name")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "As senhas não coincidem."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        username = (
            validated_data.get("username")
            or validated_data.get("email").split("@")[0]
        )

        user = User.objects.create(
            username=username,
            email=validated_data.get("email"),
            first_name=validated_data.get("name", ""),
        )
        user.set_password(validated_data["password"])
        user.is_active = True  # garante que o usuário já nasce ativo
        user.save()
        return user


# 🔹 Serializer de Usuário (para leitura)
class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "name")


# 🔹 Pets
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
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


# 🔹 Login com email
class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError({"detail": "Email e senha são obrigatórios."})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Email não encontrado."})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Senha incorreta."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "Usuário inativo."})

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "name": user.first_name,
            },
        }
