import redis
import os
import json

REDIS_URL = os.getenv("REDIS_URL")

if not REDIS_URL:
    raise ValueError("REDIS_URL not set")

r = redis.from_url(REDIS_URL, decode_responses=True)


def set_job(job_id, data):
    r.set(f"job:{job_id}", json.dumps(data), ex=3600)


def get_job(job_id):
    data = r.get(f"job:{job_id}")
    return json.loads(data) if data else None


def update_job(job_id, update_data):
    job = get_job(job_id) or {}
    job.update(update_data)
    set_job(job_id, job)