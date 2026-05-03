import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ Create app FIRST
app = FastAPI()

# ✅ ADD CORS IMMEDIATELY
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load env
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    print("⚠️ dotenv not loaded")

# ✅ Import routes AFTER app creation
from app.routes import upload, job, config, auth

# ✅ Include routes
app.include_router(upload.router)
app.include_router(job.router)
app.include_router(config.router)
app.include_router(auth.router)


# ✅ Health check
@app.get("/healthz")
def health():
    return {"status": "ok"}