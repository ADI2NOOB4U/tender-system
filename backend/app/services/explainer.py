import json
from app.services.llm import call_llm  # 👈 you already have llm.py
def generate_explanation(data: dict, evaluation: dict) -> str:
    prompt = f"""
Explain tender decision briefly.
Data: {data}
Result: {evaluation}
Give 2-3 lines max. No fluff.
"""

    try:
        return call_llm(prompt)
    except:
        return "Explanation unavailable."