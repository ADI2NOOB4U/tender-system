from fastapi import FastAPI
from app.routes import upload, job
from dotenv import load_dotenv
from app.routes import config
from app.routes import auth

app.include_router(auth.router)
app.include_router(config.router)
load_dotenv()
app = FastAPI()

app.include_router(upload.router)
app.include_router(job.router)