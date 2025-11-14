import os

# Set the settings module before importing any Django app code
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .jwt_auth_middleware import JwtAuthMiddleware

# Import routing after the settings are configured so model imports work
# Initialize Django ASGI application first so apps are loaded
django_asgi_app = get_asgi_application()

# Now it's safe to import routing that may import models
import chat.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JwtAuthMiddleware(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})
