# -*- coding: utf-8 -*-
"""
Django settings for django_faq project.

- default DB  : SQLite (local, stores ArticleFAQCache)
- neon    DB  : Neon PostgreSQL (read-only, for articles)
"""

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Load .env from the workspace root (two levels up from this file)
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parents[2] / '.env'
    load_dotenv(dotenv_path=_env_path)
except ImportError:
    pass  # python-dotenv not installed; rely on shell env

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'faq-django-local-dev-secret-key-change-in-prod')
DEBUG = True
ALLOWED_HOSTS = ['*']

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'faqapp',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'django_faq.urls'

WSGI_APPLICATION = 'django_faq.wsgi.application'

# ---------------------------------------------------------------------------
# Databases
#   default → SQLite (local cache for FAQ results)
#   Articles are fetched from the Express API at localhost:3001 — no psycopg2 needed.
# ---------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'faq_cache.sqlite3',
        'OPTIONS': {
            'timeout': 30,   # Wait up to 30s for DB lock instead of failing instantly
        },
    },
}

# Enable WAL journal mode for better SQLite concurrency (run once at startup)
import sqlite3 as _sqlite3
_db_path = str(BASE_DIR / 'faq_cache.sqlite3')
try:
    _conn = _sqlite3.connect(_db_path)
    _conn.execute('PRAGMA journal_mode=WAL;')
    _conn.close()
except Exception:
    pass  # DB might not exist yet (before first migrate); that's fine


# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = False
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'

# ---------------------------------------------------------------------------
# Default primary key
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server and Express server to call Django
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True

# ---------------------------------------------------------------------------
# faq.py path — make root project importable
# ---------------------------------------------------------------------------
_root = str(Path(__file__).resolve().parents[2])
if _root not in sys.path:
    sys.path.insert(0, _root)
