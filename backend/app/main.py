from dotenv import load_dotenv
import os

# 🔥 Load .env ONLY if exists (safe for both local + Render)
load_dotenv()

from fastapi import FastAPI
from app.routes import upload, job, config, auth

app = FastAPI()

# 🔥 ROUTES
app.include_router(upload.router)
app.include_router(job.router)
app.include_router(config.router)
app.include_router(auth.router)


# 🔥 HEALTH CHECK
@app.get("/healthz")
def health():
    return {"status": "ok"}