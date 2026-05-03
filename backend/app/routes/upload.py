from fastapi import APIRouter, UploadFile, File
import uuid
import shutil
from typing import List

from app.worker.tasks import process_document
from app.db.redis_client import set_job, r

router = APIRouter()


@router.post("/upload-batch")
async def upload_batch(files: List[UploadFile] = File(...)):
    batch_id = str(uuid.uuid4())
    job_ids = []

    for file in files:
        job_id = str(uuid.uuid4())
        file_path = f"uploads/{job_id}.png"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        set_job(job_id, {
            "status": "pending",
            "result": None,
            "batch_id": batch_id
        })

        process_document.delay(job_id, file_path)
        job_ids.append(job_id)

    # 🔥 STORE BATCH
    r.set(f"batch:{batch_id}", ",".join(job_ids), ex=3600)

    return {
        "batch_id": batch_id,
        "jobs": job_ids
    }