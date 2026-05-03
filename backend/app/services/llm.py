import requests
import os
import hashlib
import json
from app.db.redis_client import r  # ✅ USE SAME REDIS EVERYWHERE

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def _cache_key(prompt: str) -> str:
    return "llm:" + hashlib.md5(prompt.encode()).hexdigest()


def call_llm(prompt: str) -> str:
    # 🔥 CACHE FIRST
    key = _cache_key(prompt)
    cached = r.get(key)
    if cached:
        return cached

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 120
        },
        timeout=10
    )

    data = response.json()
    text = data["choices"][0]["message"]["content"].strip()

    # 🔥 CACHE RESULT
    r.set(key, text, ex=3600)

    return text


# 🔥 ADD THIS (FIXES YOUR ERROR)
def extract_invoice_data(text: str) -> dict:
    prompt = f"""
Extract structured data from this document:

{text}

Return JSON with:
- invoice_no
- email
- total
"""

    try:
        response = call_llm(prompt)

        # try parsing JSON
        try:
            return json.loads(response)
        except:
            return {"raw": response}

    except Exception:
        return {}