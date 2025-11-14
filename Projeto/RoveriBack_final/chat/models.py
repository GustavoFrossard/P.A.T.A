from django.db import models
from django.contrib.auth.models import User
from pets.models import PetCard

class ChatRoom(models.Model):
    pet = models.ForeignKey(PetCard, on_delete=models.CASCADE, null=True, blank=True)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chatrooms_user1", null=True, blank=True)
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chatrooms_user2", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("pet", "user1", "user2")

    def __str__(self):
        return f"Chat sobre {self.pet.name} entre {self.user1.username} e {self.user2.username}"


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}"
    
    class Meta:
        indexes = [
            # index room + timestamp to speed up queries that filter by room and order by timestamp
            models.Index(fields=['room', 'timestamp']),
        ]
