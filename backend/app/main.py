from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.dependencies import get_user
from supabase import Client

app = FastAPI(
    title="AI Interview Coach Backend",
    description="FastAPI Backend for AI Interview Coach (InterviewOS)",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Interview Coach API",
        "supabase_url": settings.supabase_url
    }

@app.get("/auth/verify")
def verify_session(user=Depends(get_user)):
    return {
        "status": "authenticated",
        "user_id": user.id,
        "email": user.email
    }

from app.routes import resume, interview, dashboard, round, report, settings as settings_route

app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(dashboard.router)
app.include_router(round.router)
app.include_router(report.router)
app.include_router(settings_route.router)

