import os
from dotenv import load_dotenv
if os.getenv("ENV") != "production":
    load_dotenv()

print("REDIS_URL:", os.getenv("REDIS_URL"))

from fastapi import FastAPI
from app.routes import upload, job, config, auth

# 🔥 CREATE APP AFTER ENV LOAD
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