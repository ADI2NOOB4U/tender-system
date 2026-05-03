import redis
import os
import json


REDIS_URL = os.getenv("REDIS_URL")


# =========================
# INIT REDIS (SAFE + TLS)
# =========================

r = None

if REDIS_URL:
    try:
        r = redis.from_url(
            REDIS_URL,
            decode_responses=True,
            ssl=True  # 🔥 IMPORTANT FOR UPSTASH
        )

        r.ping()  # verify connection
        print("✅ Redis connected")

    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        r = None
else:
    print("⚠️ REDIS_URL not set — using dummy mode")


# =========================
# JOB STORAGE
# =========================

def set_job(job_id: str, data: dict):
    if not r:
        return

    try:
        r.set(f"job:{job_id}", json.dumps(data), ex=3600)
    except Exception:
        pass


def get_job(job_id: str):
    if not r:
        return None

    try:
        data = r.get(f"job:{job_id}")
        return json.loads(data) if data else None
    except Exception:
        return None


def update_job(job_id: str, update_data: dict):
    job = get_job(job_id) or {}
    job.update(update_data)
    set_job(job_id, job)