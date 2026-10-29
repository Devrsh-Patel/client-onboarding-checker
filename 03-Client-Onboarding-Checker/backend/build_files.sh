#!/bin/bash
# Scalezix Project 3 — Backend Build Script for Vercel
set -e

echo "=== Installing dependencies ==="
python3 -m pip install -r requirements.txt

echo "=== Collecting static files ==="
python3 manage.py collectstatic --noinput --clear

echo "=== Backend build complete ==="

