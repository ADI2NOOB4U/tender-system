# app/services/audit.py

from app.db.redis_client import r
import json
from datetime import datetime


def log_action(user: str, action: str, data: dict):
    entry = {
        "user": user,
        "action": action,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }

    # ✅ SAFE REDIS WRITE
    if r:
        try:
            r.lpush("audit_logs", json.dumps(entry))
        except Exception:
            pass  # fail silently (logging should never crash app)


def get_logs(limit: int = 50):
    # ✅ SAFE REDIS READ
    if not r:
        return []

    try:
        logs = r.lrange("audit_logs", 0, limit)
        return [json.loads(log) for log in logs]
    except Exception:
        return []