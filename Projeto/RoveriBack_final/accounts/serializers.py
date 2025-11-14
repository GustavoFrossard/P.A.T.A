from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from pets.models import PetCard
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile

User = get_user_model()


# 🔹 Serializer de Profile
class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Profile
        fields = ("phone", "city", "avatar", "avatar_url")
    
    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


# 🔹 Serializer de Registro de Usuário
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, write_only=True)
    city = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password2", "first_name", "last_name", "phone", "city")
        read_only_fields = ("username",)

    def validate_email(self, value):
        """Verifica se o email já está em uso"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value

    def validate(self, attrs):
        # if a confirmation password was provided, ensure they match
        pw = attrs.get("password")
        pw2 = attrs.get("password2")
        if pw2 is not None and pw != pw2:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        # remove password2 if present (it's only for confirmation)
        validated_data.pop("password2", None)
        
        # extract profile data
        phone = validated_data.pop("phone", "")
        city = validated_data.pop("city", "")
        
        # Generate username from first_name + last_name
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")
        base_username = f"{first_name.lower()}{last_name.lower()}".replace(" ", "")
        
        # Ensure username is unique
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create(
            username=username,
            email=validated_data.get("email"),
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(validated_data["password"])
        user.is_active = True
        user.save()
        
        # Update profile with phone and city (signal creates it automatically)
        profile = Profile.objects.get(user=user)
        profile.phone = phone
        profile.city = city
        profile.save()
        
        return user


# 🔹 Serializer de Usuário (para leitura)
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "name", "is_staff", "is_superuser", "is_active", "date_joined", "profile")
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


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
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "role": "admin" if user.is_staff else "user",
            },
        }
