from fastapi import Header, HTTPException
from app.core.auth import verify_token


def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.split(" ")[1]
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


def require_admin(user=...):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")