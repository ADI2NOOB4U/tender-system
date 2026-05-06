import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# =========================================================
# ENV LOADING
# =========================================================

try:
    from dotenv import load_dotenv

    load_dotenv()

except Exception:
    print("⚠️ dotenv not loaded")


# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(
    level=logging.INFO,

    format=(
        "%(asctime)s | "
        "%(levelname)s | "
        "%(name)s | "
        "%(message)s"
    )
)

logger = logging.getLogger(__name__)


# =========================================================
# APP INIT
# =========================================================

app = FastAPI(
    title="TenderLens AI API",

    description=(
        "AI-powered tender evaluation and "
        "eligibility analysis platform"
    ),

    version="1.0.0"
)


# =========================================================
# CORS CONFIG
# =========================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "*"
)

allowed_origins = (
    ["*"]
    if FRONTEND_URL == "*"
    else [FRONTEND_URL]
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

logger.info(
    f"[APP] CORS configured: {allowed_origins}"
)


# =========================================================
# ROUTE IMPORTS
# =========================================================

try:
    from app.routes import (
        upload,
        job,
        config,
        auth
    )

    logger.info("[APP] Routes imported")

except Exception as e:
    logger.error(
        f"[APP] Route import failed: {str(e)}"
    )

    raise


# =========================================================
# ROUTE REGISTRATION
# =========================================================

app.include_router(
    upload.router,
    prefix="/api",
    tags=["Upload"]
)

app.include_router(
    job.router,
    prefix="/api",
    tags=["Jobs"]
)

app.include_router(
    config.router,
    prefix="/api",
    tags=["Config"]
)

app.include_router(
    auth.router,
    prefix="/api",
    tags=["Auth"]
)

logger.info("[APP] Routers registered")


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "success": True,

        "message": "TenderLens AI API running",

        "version": "1.0.0"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/healthz")
def health():
    return {
        "status": "ok",

        "service": "TenderLens AI",

        "version": "1.0.0"
    }


# =========================================================
# STARTUP EVENT
# =========================================================

@app.on_event("startup")
async def startup_event():
    logger.info(
        "[APP] TenderLens AI backend started"
    )


# =========================================================
# SHUTDOWN EVENT
# =========================================================

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(
        "[APP] TenderLens AI backend stopped"
    )