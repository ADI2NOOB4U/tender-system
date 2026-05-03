from fastapi import APIRouter, UploadFile, File
import uuid
import shutil
from typing import List
import os

from app.worker.tasks import process_document
from app.db.redis_client import set_job, r

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-batch")
async def upload_batch(files: List[UploadFile] = File(...)):
    batch_id = str(uuid.uuid4())
    job_ids = []

    for file in files:
        job_id = str(uuid.uuid4())
        file_path = f"{UPLOAD_DIR}/{job_id}.png"

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Store initial job state
        set_job(job_id, {
            "status": "processing",
            "result": None,
            "batch_id": batch_id
        })

        # 🔥 IMPORTANT: RUN SYNC (NO CELERY)
        result = process_document(job_id, file_path)

        # Save result
        set_job(job_id, {
            "status": "done",
            "result": result,
            "batch_id": batch_id
        })

        job_ids.append(job_id)

    # Store batch
    if r:
        r.set(f"batch:{batch_id}", ",".join(job_ids), ex=3600)

    return {
        "batch_id": batch_id,
        "jobs": job_ids
    }