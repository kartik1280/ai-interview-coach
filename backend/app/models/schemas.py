from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Profile & Onboarding
class InterviewCreateRequest(BaseModel):
    fullName: str
    targetPosition: str
    industry: str

class ProfileResponse(BaseModel):
    id: str
    fullName: str
    targetPosition: str
    industry: str
    resumeId: Optional[str] = None
    createdAt: Optional[datetime] = None

# Resume Upload
class ResumeUploadResponse(BaseModel):
    id: str
    filename: str
    fileSize: int
    storagePath: str

# Dashboard
class FeedbackItem(BaseModel):
    bullets: List[str]

class PracticeRoundCard(BaseModel):
    id: str
    name: str
    subtitle: str
    score: float
    feedback: List[str]

class RecentHistoryItem(BaseModel):
    id: str
    name: str
    daysAgo: str
    score: float

class DashboardResponse(BaseModel):
    fullName: str
    targetPosition: str
    industry: str
    avgReadiness: float
    roundsDone: int
    streak: int
    rounds: List[PracticeRoundCard]
    recentHistory: List[RecentHistoryItem]
    areasToImprove: str

# Round Lifecycle
class RoundStartRequest(BaseModel):
    roundType: str = Field(..., description="round type: technical, behavioral, aptitude")

class QuestionResponse(BaseModel):
    id: str
    roundId: str
    questionText: str

class RoundStartResponse(BaseModel):
    roundId: str
    roundType: str
    status: str
    questions: List[QuestionResponse]

class AnswerSubmitRequest(BaseModel):
    answerText: str

class AnswerSubmitResponse(BaseModel):
    score: float
    feedback: str
    isCompleted: bool
    overallScore: Optional[float] = None

# Full Report
class ReportResponse(BaseModel):
    fullName: str
    targetPosition: str
    industry: str
    overallScore: float
    roundsDone: int
    streak: int
    recentHistory: List[RecentHistoryItem]
    rounds: List[PracticeRoundCard]
    areasToImprove: str
