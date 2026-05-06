import os
import json
import re
import time

import google.generativeai as genai

# =========================================================
# CONFIG
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

genai.configure(api_key=GEMINI_API_KEY)

# ✅ WORKING MODEL
MODEL_NAME = "models/gemini-2.0-flash-lite"

model = genai.GenerativeModel(MODEL_NAME)

# =========================================================
# CLEAN RESPONSE
# =========================================================

def clean_json_response(text: str):

    text = text.strip()

    text = re.sub(
        r"^```json",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```",
        "",
        text
    )

    text = re.sub(
        r"```$",
        "",
        text
    )

    return text.strip()

# =========================================================
# SAFE JSON
# =========================================================

def safe_json_loads(text: str):

    try:
        return json.loads(text)

    except Exception:

        match = re.search(
            r"\{.*\}",
            text,
            re.DOTALL
        )

        if match:

            try:
                return json.loads(match.group())
            except Exception:
                pass

    return None

# =========================================================
# AI SCORING
# =========================================================

def ai_score_tender(text: str):

    if not text or len(text.strip()) < 30:

        return {
            "score": 10,

            "breakdown": {
                "technical": 5,
                "financial": 3,
                "compliance": 2
            },

            "evaluation": "FAIL",

            "confidence": 10,

            "explanation":
                "Document has insufficient content"
        }

    document_text = text[:2000]

    prompt = f"""
You are a strict government tender evaluation AI.

Evaluate the following tender document.

Return ONLY valid JSON.

FORMAT:

{{
  "score": number,
  "breakdown": {{
    "technical": number,
    "financial": number,
    "compliance": number
  }},
  "evaluation": "PASS" | "FAIL" | "REVIEW",
  "confidence": number,
  "explanation": string
}}

DOCUMENT:
{document_text}
"""

    try:

        response = None

        for attempt in range(3):

            try:

                response = model.generate_content(
                    prompt
                )

                break

            except Exception as retry_error:

                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue

                raise retry_error

        if response is None:
            raise Exception(
                "No response from Gemini"
            )

        raw = response.text.strip()

        cleaned = clean_json_response(raw)

        data = safe_json_loads(cleaned)

        if not data:
            raise Exception(
                "Invalid JSON returned"
            )

        breakdown = data.get(
            "breakdown",
            {}
        )

        technical = max(
            0,
            min(
                50,
                int(
                    breakdown.get(
                        "technical",
                        0
                    )
                )
            )
        )

        financial = max(
            0,
            min(
                30,
                int(
                    breakdown.get(
                        "financial",
                        0
                    )
                )
            )
        )

        compliance = max(
            0,
            min(
                20,
                int(
                    breakdown.get(
                        "compliance",
                        0
                    )
                )
            )
        )

        total_score = (
            technical +
            financial +
            compliance
        )

        return {

            "score": total_score,

            "breakdown": {
                "technical": technical,
                "financial": financial,
                "compliance": compliance
            },

            "evaluation":
                data.get(
                    "evaluation",
                    "REVIEW"
                ),

            "confidence":
                max(
                    0,
                    min(
                        100,
                        int(
                            data.get(
                                "confidence",
                                80
                            )
                        )
                    )
                ),

            "explanation":
                data.get(
                    "explanation",
                    "AI evaluation completed"
                )
        }

    except Exception as e:

        error_text = str(e).lower()

        # =================================================
        # QUOTA LIMIT
        # =================================================

        if (
            "quota" in error_text or
            "429" in error_text
        ):

            return {

                "score": 50,

                "breakdown": {
                    "technical": 25,
                    "financial": 15,
                    "compliance": 10
                },

                "evaluation": "REVIEW",

                "confidence": 50,

                "explanation":
                    "AI quota exceeded. Using fallback evaluation."
            }

        # =================================================
        # GENERAL FALLBACK
        # =================================================

        score = min(
            95,
            max(
                25,
                len(text) // 40
            )
        )

        technical = int(score * 0.5)
        financial = int(score * 0.3)
        compliance = int(score * 0.2)

        return {

            "score": score,

            "breakdown": {
                "technical": technical,
                "financial": financial,
                "compliance": compliance
            },

            "evaluation":
                "PASS"
                if score >= 70
                else "REVIEW"
                if score >= 40
                else "FAIL",

            "confidence":
                min(score, 90),

            "explanation":
                f"Fallback evaluation used: {str(e)}"
        }