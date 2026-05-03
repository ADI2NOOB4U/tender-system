from app.worker.celery_app import celery
from app.services.explainer import generate_explanation
from app.db.redis_client import update_job
from app.services.ocr import extract_text
from app.services.llm import extract_invoice_data
from app.services.rules import evaluate_tender


@celery.task
def process_document(job_id, file_path):
    try:
        # START
        update_job(job_id, {"status": "processing"})

        # OCR
        update_job(job_id, {"status": "ocr"})
        text = extract_text(file_path)

        # EXTRACTION
        update_job(job_id, {"status": "extracting"})
        structured = extract_invoice_data(text)

        # EVALUATION
        update_job(job_id, {"status": "evaluating"})
        evaluation = evaluate_tender(structured)

        # 🔥 NORMALIZE EVALUATION
        status = evaluation.get("status", "review").upper()

        # 🔥 EXPLANATION
        explanation = generate_explanation(structured, evaluation)

        # FINAL RESULT
        update_job(job_id, {
            "status": "done",
            "result": {
                "ocr_text": text,
                "structured_data": structured,
                "evaluation": status,
                "confidence": evaluation.get("confidence"),
                "rules_checked": evaluation.get("rules_checked"),
                "explanation": explanation
            }
        })

    except Exception as e:
        update_job(job_id, {
            "status": "failed",
            "error": str(e)
        })