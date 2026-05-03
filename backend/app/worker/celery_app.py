from celery import Celery

celery = Celery(
    "tender",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

celery.autodiscover_tasks(["app.worker"])