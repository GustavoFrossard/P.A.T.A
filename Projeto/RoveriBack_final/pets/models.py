from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()
class PetCard(models.Model):
    SPECIES_CHOICES = (('dog','Dog'),('cat','Cat'))
    name = models.CharField(max_length=120)
    species = models.CharField(max_length=10, choices=SPECIES_CHOICES)
    breed = models.CharField(max_length=120, blank=True)
    age_text = models.CharField(max_length=60, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='pets/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='petcards')
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    city = models.CharField(max_length=100, default="Desconhecida")
    class Meta: ordering = ['-created_at']
    def __str__(self): return f"{self.name} ({self.species})"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    pet = models.ForeignKey(PetCard, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "pet")

    def __str__(self):
        return f"{self.user.username} favorited {self.pet.name}"
