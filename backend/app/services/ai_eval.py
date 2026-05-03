from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ai_score_tender(text: str):
    prompt = f"""
You are an expert government tender evaluation AI.

Evaluate this tender and return STRICT JSON:

{{
  "score": number (0-100),
  "breakdown": {{
    "technical": number (0-50),
    "financial": number (0-30),
    "compliance": number (0-20)
  }},
  "evaluation": "PASS" | "FAIL" | "REVIEW",
  "explanation": "clear reasoning"
}}

Tender:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except:
        return {
            "score": 50,
            "breakdown": {"technical": 25, "financial": 15, "compliance": 10},
            "evaluation": "REVIEW",
            "explanation": "AI parsing failed"
        }