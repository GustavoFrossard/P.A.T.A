import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
DEBUG = os.environ.get("DEBUG", "True").lower() in ["1", "true", "yes"]
ALLOWED_HOSTS = [h for h in os.environ.get("ALLOWED_HOSTS", "*").split(",") if h]

# Vercel configurations
if os.environ.get("VERCEL"):
    ALLOWED_HOSTS += ['.vercel.app', '.now.sh']

# Apps instalados
INSTALLED_APPS = [
	"channels",
	"django.contrib.admin",
	"django.contrib.auth",
	"django.contrib.contenttypes",
	"django.contrib.sessions",
	"django.contrib.messages",
	"cloudinary_storage",  # Must be before staticfiles
	"django.contrib.staticfiles",
	"cloudinary",
	"rest_framework",
	"corsheaders",
	"pets",
	"chat",
	"accounts",
]

# Middlewares
MIDDLEWARE = [
	"corsheaders.middleware.CorsMiddleware",
	"django.middleware.security.SecurityMiddleware",
	"django.contrib.sessions.middleware.SessionMiddleware",
	"django.middleware.common.CommonMiddleware",
	# ✅ precisamos do CSRF porque usaremos cookies
	"django.middleware.csrf.CsrfViewMiddleware",
	"django.contrib.auth.middleware.AuthenticationMiddleware",
	"django.contrib.messages.middleware.MessageMiddleware",
	"django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "project.urls"

TEMPLATES = [
	{
		"BACKEND": "django.template.backends.django.DjangoTemplates",
		"DIRS": [],
		"APP_DIRS": True,
		"OPTIONS": {
			"context_processors": [
				"django.template.context_processors.debug",
				"django.template.context_processors.request",
				"django.contrib.auth.context_processors.auth",
				"django.contrib.messages.context_processors.messages",
			],
		},
	},
]

WSGI_APPLICATION = "project.wsgi.application"

# Banco de dados
DATABASES = {
	"default": {
		"ENGINE": "django.db.backends.postgresql",
		"NAME": os.environ.get("POSTGRES_DB", "roveri_db"),
		"USER": os.environ.get("POSTGRES_USER", "roveri_user"),
		"PASSWORD": os.environ.get("POSTGRES_PASSWORD", "roveri_pass"),
		"HOST": os.environ.get("DB_HOST", "db"),
		"PORT": os.environ.get("DB_PORT", "5432"),
	}
}

# reuse DB connections to reduce connection overhead (seconds)
CONN_MAX_AGE = int(os.environ.get('DJANGO_CONN_MAX_AGE', 300))

# Cache (Redis) configuration
# Uses REDIS_URL env var if provided, otherwise default to docker redis service
REDIS_URL = os.environ.get('REDIS_URL', os.environ.get('REDIS', 'redis://redis:6379/1'))

CACHES = {
	'default': {
		'BACKEND': 'django_redis.cache.RedisCache',
		'LOCATION': REDIS_URL,
		'OPTIONS': {
			'CLIENT_CLASS': 'django_redis.client.DefaultClient',
		}
	}
}

# If a DATABASE_URL environment variable is provided (for example when using
# Neon or other hosted Postgres), parse it and override the DATABASES config.
# Expected format: postgresql://user:password@host:port/dbname?sslmode=require
if os.environ.get("DATABASE_URL"):
	from urllib.parse import urlparse, parse_qs

	db_url = os.environ["DATABASE_URL"]
	parsed = urlparse(db_url)
	query = parse_qs(parsed.query)

	DATABASES["default"] = {
		"ENGINE": "django.db.backends.postgresql",
		"NAME": parsed.path.lstrip("/"),
		"USER": parsed.username,
		"PASSWORD": parsed.password,
		"HOST": parsed.hostname,
		"PORT": parsed.port or "",
	}

	# Many hosted Postgres providers (including Neon) require SSL. If the
	# connection string includes sslmode=require or the DB_SSL env is set,
	# enable the sslmode option so psycopg2 connects with TLS.
	sslmode = None
	if "sslmode" in query:
		sslmode = query.get("sslmode")[0]
	if os.environ.get("DB_SSL"):
		sslmode = os.environ.get("DB_SSL")
	if sslmode:
		DATABASES["default"]["OPTIONS"] = {"sslmode": sslmode}

# Senhas
AUTH_PASSWORD_VALIDATORS = []

# Configs gerais
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles_build" / "static"

# Cloudinary configuration for media files (works on Vercel)
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', ''),
}

# Debug: log cloudinary config (will show in Vercel logs)
print(f"DEBUG: CLOUDINARY_CLOUD_NAME = {os.environ.get('CLOUDINARY_CLOUD_NAME', 'NOT SET')}")
print(f"DEBUG: DEFAULT_FILE_STORAGE will be = {'cloudinary_storage.storage.MediaCloudinaryStorage' if os.environ.get('CLOUDINARY_CLOUD_NAME') else 'FileSystemStorage'}")

# Always use Cloudinary on Vercel (serverless can't use filesystem)
if os.environ.get('VERCEL'):
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = '/media/'
elif os.environ.get('CLOUDINARY_CLOUD_NAME'):
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = '/media/'
else:
    # Local development: use disk storage
    MEDIA_URL = "/media/"
    MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework -> JWT + Session
REST_FRAMEWORK = {
	"DEFAULT_AUTHENTICATION_CLASSES": [
		"accounts.authentication.CookieJWTAuthentication",  # <- usa cookies ou header
	],
	# During dev troubleshooting we allow open endpoints. Change back to
	# IsAuthenticated for production.
	"DEFAULT_PERMISSION_CLASSES": [
		"rest_framework.permissions.AllowAny",
	],
	"DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
	"PAGE_SIZE": 12,
}

# Simple JWT
SIMPLE_JWT = {
	"ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
	"REFRESH_TOKEN_LIFETIME": timedelta(days=7),
	"ROTATE_REFRESH_TOKENS": False,
	"AUTH_HEADER_TYPES": ("Bearer",),
	"AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

# CORS
CORS_ALLOWED_ORIGINS = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:3000",
]
# Allow extra CORS origins via env var (comma-separated)
extra_cors = os.environ.get("CORS_ALLOWED_ORIGINS", "")
if extra_cors:
	CORS_ALLOWED_ORIGINS += [o for o in extra_cors.split(",") if o]
CORS_ALLOW_CREDENTIALS = True

# CSRF (para confiar no frontend)
CSRF_TRUSTED_ORIGINS = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:3000",
]
# Allow extra CSRF trusted origins via env var (comma-separated, include scheme https://)
extra_csrf = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
if extra_csrf:
	CSRF_TRUSTED_ORIGINS += [o for o in extra_csrf.split(",") if o]

# Cookies de sessão / CSRF
# Force Secure cookies in production (Vercel)
SESSION_COOKIE_SECURE = True  # Always use HTTPS cookies
CSRF_COOKIE_SECURE = True  # Always use HTTPS cookies
CSRF_COOKIE_HTTPONLY = False  # precisa estar False para o frontend ler o token CSRF
SESSION_COOKIE_SAMESITE = 'None'  # Allow cross-origin cookies
CSRF_COOKIE_SAMESITE = 'None'  # Allow cross-origin cookies
ASGI_APPLICATION = "project.asgi.application"
# Use REDIS_URL for channels if provided (Render), else default to docker hostname
_redis_url = os.environ.get('REDIS_URL')
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [_redis_url if _redis_url else ("redis", 6379)],
        },
    },
}
