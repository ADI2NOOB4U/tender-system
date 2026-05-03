# app/routes/config.py

from fastapi import APIRouter, Depends, HTTPException

from app.services.config import get_config, update_config
from app.services.audit import get_logs, log_action
from app.core.deps import get_current_user


router = APIRouter()


# =========================
# AUDIT LOGS (ADMIN ONLY)
# =========================

@router.get("/audit")
def read_logs(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    return get_logs()


# =========================
# READ CONFIG
# =========================

@router.get("/config")
def read_config(user=Depends(get_current_user)):
    return get_config()


# =========================
# UPDATE CONFIG (ADMIN ONLY)
# =========================

@router.post("/config")
def modify_config(config: dict, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    update_config(config)

    # ✅ FIXED: now properly imported
    log_action(user["sub"], "UPDATE_CONFIG", config)

    return {"status": "updated"}