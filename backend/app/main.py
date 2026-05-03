# app/main.py

import os

# ✅ SAFE ENV LOADING
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    print("⚠️ dotenv not loaded (safe to ignore in production)")


from fastapi import FastAPI
from app.routes import upload, job, config, auth


app = FastAPI()


# =========================
# ROUTES
# =========================

app.include_router(upload.router)
app.include_router(job.router)
app.include_router(config.router)
app.include_router(auth.router)


# =========================
# HEALTH CHECK
# =========================

@app.get("/healthz")
def health():
    return {"status": "ok"}