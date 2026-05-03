from app.services.ocr import extract_text
from app.services.llm import extract_invoice_data
from app.services.rules import evaluate_tender as rule_eval
from app.services.ai_eval import ai_score_tender


def run_pipeline(file_path: str) -> dict:
    try:
        # 🔹 OCR
        text = extract_text(file_path) or ""

        # 🔹 STRUCTURED EXTRACTION
        structured = extract_invoice_data(text) or {}

        # 🔹 RULE-BASED CHECK
        rules = rule_eval(structured) or {}

        # 🔥 AI SCORING (NEW)
        ai_result = ai_score_tender(text)

        return {
            "raw_text": text,
            "structured": structured,

            # 🔥 FINAL OUTPUT (MERGED)
            "evaluation": {
                "status": ai_result.get("evaluation", "REVIEW"),
                "score": ai_result.get("score", 0),
                "breakdown": ai_result.get("breakdown", {}),
                "explanation": ai_result.get("explanation", ""),
                "rules": rules
            }
        }

    except Exception as e:
        return {
            "raw_text": "",
            "structured": {},
            "evaluation": {"status": "error"},
            "error": str(e)
        }