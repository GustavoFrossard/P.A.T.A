
from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

# You can extend profile here if needed
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=100, blank=True)
    avatar = models.URLField(blank=True, null=True)
    def __str__(self):
        return self.user.username
