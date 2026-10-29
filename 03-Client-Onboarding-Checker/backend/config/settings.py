import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Security & Environment Settings ──────────────────────────────────────────
raw_debug = os.getenv('DJANGO_DEBUG', os.getenv('DEBUG', 'True'))
DEBUG = raw_debug.lower() in ('true', '1', 't')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if not DEBUG:
        raise ValueError("DJANGO_SECRET_KEY environment variable is required when DEBUG is False.")
    SECRET_KEY = 'django-insecure-scalezix-client-onboarding-checker-key-dev-only-change-in-prod'

raw_allowed_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', os.getenv('ALLOWED_HOSTS', ''))
if raw_allowed_hosts:
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]
elif DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = ['.vercel.app', 'localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Project apps
    'onboarding',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ─── Database Configuration ───────────────────────────────────────────────────
# Priority:
# 1. DATABASE_URL / POSTGRES_URL (Managed PostgreSQL in production, e.g. Neon, Supabase, Vercel Postgres)
# 2. DB_ENGINE=postgresql
# 3. DB_ENGINE=mysql or USE_MYSQL=True
# 4. Default: SQLite for local development and isolated test suites
DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL') or os.getenv('POSTGRES_PRISMA_URL')

if DATABASE_URL:
    import dj_database_url
    conn_max_age = int(os.getenv('DB_CONN_MAX_AGE', '0'))
    ssl_require = os.getenv('DB_SSL_REQUIRE', 'True').lower() in ('true', '1', 't')
    
    db_config = dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=conn_max_age,
        conn_health_checks=True,
    )
    if 'postgresql' in db_config.get('ENGINE', ''):
        db_config.setdefault('OPTIONS', {})
        if ssl_require and 'sslmode' not in db_config['OPTIONS']:
            db_config['OPTIONS']['sslmode'] = 'require'
        connect_timeout = int(os.getenv('DB_CONNECT_TIMEOUT', '10'))
        db_config['OPTIONS'].setdefault('connect_timeout', connect_timeout)
    DATABASES = {'default': db_config}

elif os.getenv('DB_ENGINE') in ('postgresql', 'postgres'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'scalezix_onboarding'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '0')),
            'OPTIONS': {
                'sslmode': os.getenv('DB_SSLMODE', 'require'),
                'connect_timeout': int(os.getenv('DB_CONNECT_TIMEOUT', '10')),
            },
        }
    }

elif os.getenv('DB_ENGINE') == 'mysql' or os.getenv('USE_MYSQL', 'False').lower() in ('true', '1'):
    import pymysql
    pymysql.install_as_MySQLdb()

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'scalezix_onboarding'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', '127.0.0.1'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
            },
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ─── REST Framework Configuration ─────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ─── CORS & CSRF Configuration ───────────────────────────────────────────────
raw_cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '')
if raw_cors_origins:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in raw_cors_origins.split(',') if origin.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
elif DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = []

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

raw_csrf_origins = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if raw_csrf_origins:
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in raw_csrf_origins.split(',') if origin.strip()]
elif not DEBUG and CORS_ALLOWED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [origin for origin in CORS_ALLOWED_ORIGINS if origin.startswith('https://')]

# ─── Production HTTPS & Cookie Security ───────────────────────────────────────
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# ─── Internationalization ────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─── Static and Media Files ───────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
os.makedirs(STATIC_ROOT, exist_ok=True)

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MEDIA_URL = '/media/'
if os.getenv('VERCEL'):
    MEDIA_ROOT = Path('/tmp/media')
else:
    MEDIA_ROOT = BASE_DIR / 'media'

# Max upload size (configurable via MAX_UPLOAD_SIZE_MB, default 10MB)
max_upload_mb = int(os.getenv('MAX_UPLOAD_SIZE_MB', '10'))
DATA_UPLOAD_MAX_MEMORY_SIZE = max_upload_mb * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = max_upload_mb * 1024 * 1024

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
