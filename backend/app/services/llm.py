import requests
import os
import hashlib
import json
import redis

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 🔥 Redis cache (reuse your existing Redis)
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)


def _cache_key(prompt: str) -> str:
    return "llm:" + hashlib.md5(prompt.encode()).hexdigest()


def call_llm(prompt: str) -> str:
    # 🔥 CHECK CACHE FIRST
    key = _cache_key(prompt)
    cached = r.get(key)
    if cached:
        return cached

    # 🔥 FAST + CHEAP MODEL
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",  # cheap + fast
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 120  # 🔥 LIMIT COST
        },
        timeout=10
    )

    data = response.json()
    text = data["choices"][0]["message"]["content"].strip()

    # 🔥 SAVE TO CACHE (1 hour)
    r.set(key, text, ex=3600)

    return text