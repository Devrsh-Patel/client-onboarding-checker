"""
Vercel Serverless Function Entry Point for Scalezix Client Onboarding Document Checker.
Routes incoming WSGI serverless function invocations to Django.
"""

import os
import sys
from pathlib import Path

# Add backend root directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from config.wsgi import application

# Expose WSGI handler for Vercel Python runtime
app = application

