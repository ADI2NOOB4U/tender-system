import os
import json
import re
import google.generativeai as genai

# =========================================================
# CONFIGURE GEMINI
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash-latest")


# =========================================================
# CLEAN JSON
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
# EXTRACTION
# =========================================================

def extract_invoice_data(text: str):

    if not text or len(text.strip()) < 20:

        return {
            "company": None,
            "amount": None,
            "email": None,
            "invoice_no": None,
            "summary": "Insufficient OCR text"
        }

    prompt = f"""
Extract structured data from this tender/invoice document.

RETURN STRICT JSON ONLY.

FORMAT:

{{
  "company": string | null,
  "amount": number | null,
  "email": string | null,
  "invoice_no": string | null,
  "summary": string
}}

DOCUMENT:
{text[:4000]}
"""

    try:

        response = model.generate_content(prompt)

        raw = response.text.strip()

        cleaned = clean_json_response(raw)

        data = json.loads(cleaned)

        return {
            "company":
                data.get("company"),

            "amount":
                data.get("amount"),

            "email":
                data.get("email"),

            "invoice_no":
                data.get("invoice_no"),

            "summary":
                data.get("summary"),
        }

    except Exception as e:

        return {
            "company": None,
            "amount": None,
            "email": None,
            "invoice_no": None,
            "summary": f"Gemini extraction failed: {str(e)}"
        }