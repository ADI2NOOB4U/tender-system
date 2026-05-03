from fastapi import APIRouter, HTTPException
from app.db.redis_client import get_job
from app.models.job import JobStatus
from pydantic import BaseModel
from typing import Optional, Dict


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    result: Optional[Dict] = None
    error: Optional[str] = None


router = APIRouter()


@router.get("/job/{job_id}", response_model=JobResponse)
def get_job_status(job_id: str) -> JobResponse:
    job = get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # ✅ Safe status parsing
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
from app.db.redis_client import r, get_job

@router.get("/batch/{batch_id}")
def get_batch(batch_id: str):
    job_ids_str = r.get(f"batch:{batch_id}")

    if not job_ids_str:
        raise HTTPException(status_code=404, detail="Batch not found")

    job_ids = job_ids_str.split(",")

    jobs = [get_job(jid) for jid in job_ids]

    return {
        "batch_id": batch_id,
        "jobs": jobs
    }
from app.services.comparator import rank_tenders

@router.get("/batch/{batch_id}/rank")
def rank_batch(batch_id: str):
    job_ids_str = r.get(f"batch:{batch_id}")

    if not job_ids_str:
        raise HTTPException(status_code=404, detail="Batch not found")

    job_ids = job_ids_str.split(",")
    jobs = []

    for jid in job_ids:
        job = get_job(jid)
        if job:
            job["job_id"] = jid  # 🔥 important
            jobs.append(job)

    ranking = rank_tenders(jobs)

    return {
        "batch_id": batch_id,
        "ranking": ranking
    }