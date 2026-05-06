from app.services.ocr import extract_text
from app.services.llm import extract_invoice_data
from app.services.rules import evaluate_tender
from app.services.ai_eval import ai_score_tender

import traceback


def run_pipeline(file_path: str):

    try:

        # =====================================================
        # OCR
        # =====================================================

        text = extract_text(file_path)

        print("\n===== OCR TEXT =====\n")
        print(text[:1000])

        if not text or text.startswith("[OCR ERROR]"):

            return {
                "error": "OCR extraction failed",
                "stage": "ocr",
                "raw_text": text
            }

        # =====================================================
        # STRUCTURED EXTRACTION
        # =====================================================

        structured = extract_invoice_data(text)

        print("\n===== STRUCTURED =====\n")
        print(structured)

        # =====================================================
        # RULE ENGINE
        # =====================================================

        rules = evaluate_tender(structured)

        print("\n===== RULES =====\n")
        print(rules)

        # =====================================================
        # AI EVALUATION
        # =====================================================

        ai_result = ai_score_tender(text)

        print("\n===== AI RESULT =====\n")
        print(ai_result)

        # =====================================================
        # FINAL RESULT
        # =====================================================

        return {

            "raw_text": text,

            "structured": structured,

            "evaluation": {

                "status":
                    ai_result.get(
                        "evaluation",
                        "REVIEW"
                    ),

                "score":
                    ai_result.get(
                        "score",
                        0
                    ),

                "confidence":
                    ai_result.get(
                        "confidence",
                        0
                    ),

                "breakdown":
                    ai_result.get(
                        "breakdown",
                        {}
                    ),

                "explanation":
                    ai_result.get(
                        "explanation",
                        ""
                    ),

                "rules": rules
            }
        }

    except Exception as e:

        print("\n===== PIPELINE ERROR =====\n")
        traceback.print_exc()

        return {
            "error": str(e),
            "stage": "pipeline"
        }