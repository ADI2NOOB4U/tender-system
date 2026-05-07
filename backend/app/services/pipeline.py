import os
import time
import logging
import traceback

from app.services.ocr import extract_text
from app.services.llm import extract_invoice_data
from app.services.rules import evaluate_tender

from app.services.ai_eval import (
    ai_score_tender,
    extract_company_name,
    _filename_to_company,   # re-use the same clean helper
)

logger = logging.getLogger(__name__)


def run_pipeline(file_path: str):

    t_start = time.time()

    try:

        # =====================================================
        # FILE INFO
        # =====================================================

        filename = os.path.basename(file_path)
        logger.info(f"[PIPELINE] Starting: {filename}")

        # =====================================================
        # OCR
        # =====================================================

        text = extract_text(file_path)

        if text:
            logger.info(
                f"[PIPELINE] OCR succeeded: {len(text)} chars extracted from {filename}"
            )
        else:
            logger.warning(f"[PIPELINE] OCR returned empty text for {filename}")

        if not text or len(text.strip()) < 30:
            return {
                "error": "OCR extraction failed or returned insufficient text",
                "stage": "ocr",
                "raw_text": text,
            }

        # =====================================================
        # COMPANY NAME EXTRACTION
        # extract_company_name already handles all fallback
        # logic internally (label → suffix → header → filename).
        # The safety net below only fires if it somehow still
        # returns a placeholder — uses the same _filename_to_company
        # helper so UUID prefixes are stripped cleanly.
        # =====================================================

        company_name = extract_company_name(text, filename)

        # Safety net: use clean filename helper (not raw .title())
        if not company_name or company_name.lower() in (
            "unknown company", "unnamed bidder"
        ):
            company_name = _filename_to_company(filename) or "Unnamed Bidder"

        logger.info(f"[PIPELINE] Company name resolved: {company_name}")

        # =====================================================
        # STRUCTURED EXTRACTION (via Gemini)
        # =====================================================

        structured = extract_invoice_data(text)
        logger.info(f"[PIPELINE] Structured extraction complete: {list(structured.keys())}")

        # =====================================================
        # RULE ENGINE
        # Now passes raw_text so GST/PAN/ISO/experience checks fire.
        # Backward compatible: rules.py accepts raw_text="" default.
        # =====================================================

        rules = evaluate_tender(structured, raw_text=text)
        logger.info(
            f"[PIPELINE] Rules evaluated: "
            f"passed={len(rules.get('passed_rules', []))}, "
            f"failed={len(rules.get('failed_rules', []))}"
        )

        # =====================================================
        # AI EVALUATION
        # =====================================================

        ai_result = ai_score_tender(text)
        logger.info(
            f"[PIPELINE] AI scoring: "
            f"score={ai_result.get('score')}, "
            f"evaluation={ai_result.get('evaluation')}"
        )

        # =====================================================
        # FINAL RESULT
        # Note: company_name is included in result so tasks.py
        # can surface it to the frontend.
        # =====================================================

        elapsed = round(time.time() - t_start, 2)
        logger.info(f"[PIPELINE] Complete in {elapsed}s for {filename}")

        return {
            "company_name": company_name,
            "raw_text": text,
            "structured": structured,
            "evaluation": {
                "status":      ai_result.get("evaluation", "REVIEW"),
                "score":       ai_result.get("score", 0),
                "confidence":  ai_result.get("confidence", 0),
                "breakdown":   ai_result.get("breakdown", {}),
                "explanation": ai_result.get("explanation", ""),
                "rules":       rules,
            },
        }

    except Exception as e:
        logger.error(f"[PIPELINE] Fatal error: {str(e)}")
        logger.error(traceback.format_exc())

        return {
            "error": str(e),
            "stage": "pipeline",
        }