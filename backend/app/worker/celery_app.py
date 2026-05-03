# app/worker/celery_app.py

import os
from celery import Celery


REDIS_URL = os.getenv("REDIS_URL")

if not REDIS_URL:
    print("⚠️ REDIS_URL not set — Celery will not work properly")


celery = Celery(
    "tender",
    broker=REDIS_URL or "redis://localhost:6379/0",
    backend=REDIS_URL or "redis://localhost:6379/0"
)

celery.autodiscover_tasks(["app.worker"])