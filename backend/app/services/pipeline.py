from app.services.ocr import extract_text
from app.services.llm import extract_invoice_data
from app.services.rules import evaluate_tender


def run_pipeline(file_path: str) -> dict:
    try:
        text = extract_text(file_path) or ""
        structured = extract_invoice_data(text) or {}
        evaluation = evaluate_tender(structured) or {}

        return {
            "raw_text": text,
            "structured": structured,
            "evaluation": evaluation
        }

    except Exception as e:
        return {
            "raw_text": "",
            "structured": {},
            "evaluation": {"status": "error"},
            "error": str(e)
        }