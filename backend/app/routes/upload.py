from fastapi import (
    APIRouter,
    UploadFile,
    File
)

from typing import List

import uuid
import shutil
import os
import logging

from app.worker.tasks import (
    process_document
)

from app.db.redis_client import (
    set_job,
    get_job,
    r
)

router = APIRouter()

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

# =========================================================
# UPLOAD BATCH
# =========================================================

@router.post("/upload-batch")
async def upload_batch(
    files: List[UploadFile] = File(...)
):

    batch_id = str(uuid.uuid4())

    job_ids = []

    for file in files:

        job_id = str(uuid.uuid4())

        ext = (
            os.path.splitext(
                file.filename
            )[1]
            or ".png"
        )

        file_path = os.path.join(
            UPLOAD_DIR,
            f"{job_id}{ext}"
        )

        # =================================================
        # SAVE FILE
        # =================================================

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        logger.info(
            f"[UPLOAD] Saved file: {file_path}"
        )

        # =================================================
        # INITIAL STATE
        # =================================================

        initial_state = {
            "job_id": job_id,

            "status": "processing",

            "progress": 5,

            "file_name":
                file.filename,

            "result": None,

            "error": None,

            "batch_id": batch_id
        }

        set_job(
            job_id,
            initial_state
        )

        # =================================================
        # RUN PROCESSING
        # =================================================

        try:

            logger.info(
                f"[UPLOAD] Starting processing for {job_id}"
            )

            process_document(
                job_id,
                file_path
            )

            logger.info(
                f"[UPLOAD] Finished processing for {job_id}"
            )

        except Exception as e:

            logger.error(
                f"[UPLOAD] Processing failed: {str(e)}"
            )

            set_job(job_id, {
                "job_id": job_id,

                "status": "failed",

                "progress": 100,

                "error": str(e),

                "batch_id": batch_id
            })

        job_ids.append(job_id)

    # =====================================================
    # STORE BATCH
    # =====================================================

    try:

        if r:
            r.set(
                f"batch:{batch_id}",
                ",".join(job_ids),
                ex=3600
            )

    except Exception as e:

        logger.warning(
            f"[BATCH] Failed storing batch: {e}"
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "success": True,

        "batch_id": batch_id,

        "jobs": job_ids,

        "total_files": len(job_ids)
    }