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

    r.lpush("audit_logs", json.dumps(entry))


def get_logs(limit=50):
    logs = r.lrange("audit_logs", 0, limit)
    return [json.loads(log) for log in logs]