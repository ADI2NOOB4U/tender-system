# app/routes/job.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List

from app.db.redis_client import r, get_job
from app.models.job import JobStatus
from app.services.comparator import rank_tenders


router = APIRouter()


# =========================
# RESPONSE MODEL
# =========================

class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    result: Optional[Dict] = None
    error: Optional[str] = None


# =========================
# SINGLE JOB STATUS
# =========================

@router.get("/job/{job_id}", response_model=JobResponse)
def get_job_status(job_id: str) -> JobResponse:
    job = get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        status = JobStatus(job.get("status", "pending"))
    except ValueError:
        status = JobStatus.pending

    return JobResponse(
        job_id=job_id,
        status=status,
        result=job.get("result"),
        error=job.get("error")
    )


# =========================
# GET BATCH
# =========================

@router.get("/batch/{batch_id}")
def get_batch(batch_id: str):
    if not r:
        raise HTTPException(status_code=500, detail="Redis not connected")

    try:
        job_ids_str = r.get(f"batch:{batch_id}")
    except Exception:
        raise HTTPException(status_code=500, detail="Redis error")

    if not job_ids_str:
        raise HTTPException(status_code=404, detail="Batch not found")

    job_ids = job_ids_str.split(",")

    jobs = []
    for jid in job_ids:
        job = get_job(jid)
        if job:
            job["job_id"] = jid
            jobs.append(job)

    return {
        "batch_id": batch_id,
        "jobs": jobs
    }


# =========================
# RANK BATCH
# =========================

@router.get("/batch/{batch_id}/rank")
def rank_batch(batch_id: str):
    if not r:
        raise HTTPException(status_code=500, detail="Redis not connected")

    try:
        job_ids_str = r.get(f"batch:{batch_id}")
    except Exception:
        raise HTTPException(status_code=500, detail="Redis error")

    if not job_ids_str:
        raise HTTPException(status_code=404, detail="Batch not found")

    job_ids = job_ids_str.split(",")

    jobs = []
    for jid in job_ids:
        job = get_job(jid)
        if job:
            job["job_id"] = jid
            jobs.append(job)

    if not jobs:
        raise HTTPException(status_code=404, detail="No valid jobs found")

    ranking = rank_tenders(jobs)

    return {
        "batch_id": batch_id,
        "ranking": ranking
    }