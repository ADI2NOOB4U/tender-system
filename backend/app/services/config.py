from app.db.redis_client import r
import json

DEFAULT_CONFIG = {
    "weights": {
        "financial": 0.4,
        "technical": 0.6
    },
    "financial_rules": {
        "high": 100,
        "medium": 50
    },
    "technical_rules": {
        "invoice": 30,
        "email": 30,
        "confidence": 40
    }
}


def get_config():
    data = r.get("config:scoring")

    if not data:
        r.set("config:scoring", json.dumps(DEFAULT_CONFIG))
        return DEFAULT_CONFIG

    return json.loads(data)


def update_config(new_config: dict):
    r.set("config:scoring", json.dumps(new_config))