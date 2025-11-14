
from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

# You can extend profile here if needed
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=30, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"
