from fastapi import APIRouter, HTTPException
from app.core.auth import create_token

router = APIRouter()

# 🔥 DEMO USERS (replace later with DB)
USERS = {
    "admin": {"password": "admin123", "role": "admin"},
    "user": {"password": "user123", "role": "user"}
}


@router.post("/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    user = USERS.get(username)

    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(username, user["role"])

    return {
        "access_token": token,
        "role": user["role"]
    }