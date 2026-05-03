from fastapi import APIRouter, Depends
from app.services.config import get_config, update_config
from app.core.deps import get_current_user

router = APIRouter()
from app.services.audit import get_logs

@router.get("/audit")
def read_logs(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    return get_logs()

@router.get("/config")
def read_config(user=Depends(get_current_user)):
    return get_config()


@router.post("/config")
def modify_config(config: dict, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    update_config(config)
    log_action(user["sub"], "UPDATE_CONFIG", config)

    return {"status": "updated"}