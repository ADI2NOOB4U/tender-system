import os
import json
import logging
import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")

# =========================================================
# REDIS INIT
# =========================================================

r = None

try:
    if not REDIS_URL:
        logger.warning(
            "[REDIS] REDIS_URL not set — running without Redis"
        )

    else:
        r = redis.from_url(
            REDIS_URL,

            decode_responses=True,

            socket_connect_timeout=5,
            socket_timeout=5,

            retry_on_timeout=True,

            health_check_interval=30
        )

        r.ping()

        logger.info("[REDIS] Connected successfully")

except Exception as e:
    logger.error(f"[REDIS] Connection failed: {str(e)}")

    r = None


# =========================================================
# CONSTANTS
# =========================================================

JOB_PREFIX = "job:"
DEFAULT_EXPIRY = 86400  # 24 hours


# =========================================================
# HELPER
# =========================================================

def _job_key(job_id: str) -> str:
    return f"{JOB_PREFIX}{job_id}"


# =========================================================
# SET JOB
# =========================================================

def set_job(
    job_id: str,
    data: dict,
    expiry: int = DEFAULT_EXPIRY
):
    """
    Store full job object.
    """

    if not r:
        logger.warning(
            f"[REDIS] set_job skipped ({job_id}) — Redis unavailable"
        )
        return False

    try:
        r.set(
            _job_key(job_id),
            json.dumps(data),
            ex=expiry
        )

        logger.info(f"[REDIS] Job stored: {job_id}")

        return True

    except Exception as e:
        logger.error(
            f"[REDIS] set_job failed ({job_id}): {str(e)}"
        )

        return False


# =========================================================
# GET JOB
# =========================================================

def get_job(job_id: str):
    """
    Fetch job object.
    """

    if not r:
        logger.warning(
            f"[REDIS] get_job skipped ({job_id}) — Redis unavailable"
        )
        return None

    try:
        data = r.get(_job_key(job_id))

        if not data:
            logger.warning(
                f"[REDIS] Job not found: {job_id}"
            )

            return None

        return json.loads(data)

    except json.JSONDecodeError:
        logger.error(
            f"[REDIS] Invalid JSON for job: {job_id}"
        )

        return None

    except Exception as e:
        logger.error(
            f"[REDIS] get_job failed ({job_id}): {str(e)}"
        )

        return None


# =========================================================
# UPDATE JOB
# =========================================================

def update_job(job_id: str, update_data: dict):
    """
    Merge update into existing job.
    """

    existing_job = get_job(job_id)

    if not existing_job:
        existing_job = {}

    existing_job.update(update_data)

    success = set_job(job_id, existing_job)

    if success:
        logger.info(
            f"[REDIS] Job updated: {job_id}"
        )

    return success


# =========================================================
# DELETE JOB
# =========================================================

def delete_job(job_id: str):
    """
    Delete job from Redis.
    """

    if not r:
        return False

    try:
        r.delete(_job_key(job_id))

        logger.info(
            f"[REDIS] Job deleted: {job_id}"
        )

        return True

    except Exception as e:
        logger.error(
            f"[REDIS] delete_job failed ({job_id}): {str(e)}"
        )

        return False


# =========================================================
# REDIS HEALTH CHECK
# =========================================================

def redis_health():
    """
    Simple Redis health check.
    """

    if not r:
        return {
            "status": "offline"
        }

    try:
        r.ping()

        return {
            "status": "online"
        }

    except Exception:
        return {
            "status": "offline"
        }