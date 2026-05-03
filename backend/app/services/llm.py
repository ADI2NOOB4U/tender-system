# app/services/llm.py

import requests
import os
import hashlib
import json
from app.db.redis_client import r  # shared Redis


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def _cache_key(prompt: str) -> str:
    return "llm:" + hashlib.md5(prompt.encode()).hexdigest()


def call_llm(prompt: str) -> str:
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set")

    key = _cache_key(prompt)

    # ✅ SAFE CACHE READ
    cached = r.get(key) if r else None
    if cached:
        return cached

    try:
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
            timeout=15
        )

        response.raise_for_status()
        data = response.json()

        text = data["choices"][0]["message"]["content"].strip()

        # ✅ SAFE CACHE WRITE
        if r:
            r.set(key, text, ex=3600)

        return text

    except Exception as e:
        return f"LLM_ERROR: {str(e)}"


# =========================
# EXTRACTION FUNCTION
# =========================

def extract_invoice_data(text: str) -> dict:
    prompt = f"""
Extract structured data from this document:

{text}

Return STRICT JSON with:
- invoice_no
- email
- total
"""

    try:
        response = call_llm(prompt)

        # ✅ Try parsing JSON
        try:
            return json.loads(response)
        except Exception:
            return {"raw": response}

    except Exception:
        return {}