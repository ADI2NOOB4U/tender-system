from app.services.pipeline import run_pipeline
from app.db.redis_client import set_job

import logging
import traceback
from time import time

logger = logging.getLogger(__name__)


def process_document(job_id: str, file_path: str):
    start_time = time()

    try:
        logger.info(
            f"[JOB {job_id}] Processing started"
        )

        # =====================================================
        # STATUS → PROCESSING
        # =====================================================

        set_job(job_id, {
            "status": "processing",
            "progress": 10,
            "message": "Starting document processing"
        })

        # =====================================================
        # RUN PIPELINE
        # =====================================================

        result = run_pipeline(file_path)

        logger.info(
            f"[JOB {job_id}] Pipeline result received"
        )

        # =====================================================
        # VALIDATE RESULT
        # =====================================================

        if not isinstance(result, dict):

            raise Exception(
                "Pipeline returned invalid response"
            )

        if result.get("error"):

            failed_result = {
                "status": "failed",
                "progress": 100,
                "error": result.get(
                    "error",
                    "Unknown pipeline error"
                ),
                "result": result
            }

            set_job(job_id, failed_result)

            return failed_result

        # =====================================================
        # FINAL SUCCESS
        # =====================================================

        total_time = round(
            time() - start_time,
            2
        )

        final_result = {
            "status": "completed",

            "progress": 100,

            "processing_time": total_time,

            "result": {
                "raw_text":
                    result.get(
                        "raw_text",
                        ""
                    ),

                "structured":
                    result.get(
                        "structured",
                        {}
                    ),

                "evaluation":
                    result.get(
                        "evaluation",
                        {}
                    )
            }
        }

        # =====================================================
        # SAVE FINAL RESULT
        # =====================================================

        set_job(job_id, final_result)

        logger.info(
            f"[JOB {job_id}] Completed successfully in {total_time}s"
        )

        return final_result

    except Exception as e:

        logger.error(
            f"[JOB {job_id}] Fatal processing error"
        )

        logger.error(
            traceback.format_exc()
        )

        error_result = {
            "status": "failed",
            "progress": 100,
            "error": str(e),
            "stage": "worker"
        }

        try:
            set_job(job_id, error_result)

        except Exception:

            logger.error(
                f"[JOB {job_id}] Failed to save error state"
            )

        return error_result