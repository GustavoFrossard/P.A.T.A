import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs'].get('room_id')
        self.group_name = f"chat_{self.room_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except Exception:
            return
        if data.get('type') == 'message':
            content = data.get('content', '').strip()
            if not content:
                return
            sender = None
            if self.scope.get('user') and getattr(self.scope['user'], 'is_authenticated', False):
                sender = self.scope['user']
            else:
                sender_id = data.get('sender_id')
                if sender_id:
                    try:
                        # Import the User model at runtime to avoid accessing Django apps at import time
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        sender = await database_sync_to_async(User.objects.get)(pk=sender_id)
                    except Exception:
                        sender = None
            # log who is sending and the content for debugging persistence issues
            try:
                sender_info = f"{getattr(sender, 'id', None)}:{getattr(sender, 'username', None)}" if sender else "Anonymous"
            except Exception:
                sender_info = "Unknown"
            logger.warning("WS receive - room=%s sender=%s content=%s", self.room_id, sender_info, (content[:200] if content else ''))
            message = await self.create_message(sender, content)
            if not message:
                # Could not persist message (missing room or sender or DB error)
                try:
                    await self.send(text_data=json.dumps({'error': 'Could not save message'}))
                    logger.warning("Failed to persist message for room=%s sender=%s", self.room_id, sender_info)
                except Exception:
                    pass
                return

            payload = {
                'id': message.id,
                'room': message.room.id if message.room else None,
                'sender': message.sender.id if message.sender else None,
                'sender_username': message.sender.username if message.sender else None,
                'content': message.content,
                'timestamp': getattr(message, 'timestamp', None) and message.timestamp.isoformat() or None,
            }
            # send ack to the sender that the message was saved
            try:
                await self.send(text_data=json.dumps({'saved': True, 'id': message.id}))
            except Exception:
                logger.warning("Failed to send saved ack to websocket sender for message id=%s", getattr(message, 'id', None))
            await self.channel_layer.group_send(self.group_name, {'type': 'chat.message', 'message': payload})

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def create_message(self, sender, content):
        # Import models here so importing this module at startup doesn't touch Django app registry
        from .models import ChatRoom, Message
        from django.contrib.auth import get_user_model
        import logging

        logger = logging.getLogger(__name__)

        # Ensure room exists
        try:
            room = ChatRoom.objects.get(pk=self.room_id)
        except Exception as e:
            logger.warning("Chat room not found for id=%s: %s", self.room_id, e)
            return None

        # Ensure sender is valid
        if sender is None:
            logger.warning("No sender provided for websocket message in room %s", self.room_id)
            return None

        # Create message and handle DB errors
        try:
            msg = Message.objects.create(room=room, sender=sender, content=content)
            # update cached messages for this room (write-through) or invalidate if unknown
            try:
                from django.core.cache import cache
                cache_key = f"chat_room_{self.room_id}_messages_v1"
                cached = cache.get(cache_key)
                from .serializers import MessageSerializer
                ser = MessageSerializer(msg)
                if isinstance(cached, dict) and 'results' in cached:
                    cached['results'].append(ser.data)
                    cached['count'] = cached.get('count', 0) + 1
                    cache.set(cache_key, cached, 30)
                elif isinstance(cached, list):
                    cached.append(ser.data)
                    cache.set(cache_key, cached, 30)
                else:
                    cache.delete(cache_key)
            except Exception:
                try:
                    cache.delete(cache_key)
                except Exception:
                    pass
            return msg
        except Exception as e:
            logger.exception("Failed to create message for room %s: %s", self.room_id, e)
            return None
