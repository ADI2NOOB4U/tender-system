# app/worker/tasks.py

from app.worker.celery_app import celery
from app.services.explainer import generate_explanation
from app.db.redis_client import update_job
from app.services.ocr import extract_text
from app.services.llm import extract_invoice_data
from app.services.rules import evaluate_tender


@celery.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=5,
    retry_kwargs={"max_retries": 3}
)
def process_document(self, job_id: str, file_path: str):
    try:
        # 🔹 START
        update_job(job_id, {"status": "processing"})

        # 🔹 OCR
        text = extract_text(file_path) or ""

        # 🔹 EXTRACTION
        structured = extract_invoice_data(text) or {}

        # 🔹 EVALUATION
        evaluation = evaluate_tender(structured) or {}

        # 🔹 NORMALIZE STATUS
        status = str(evaluation.get("status", "review")).upper()

        # 🔹 EXPLANATION (SAFE)
        try:
            explanation = generate_explanation(structured, evaluation)
        except Exception:
            explanation = "Explanation unavailable."

        # 🔹 FINAL RESULT
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
        # 🔥 FAIL SAFE
        update_job(job_id, {
            "status": "failed",
            "error": str(e)
        })
        raise