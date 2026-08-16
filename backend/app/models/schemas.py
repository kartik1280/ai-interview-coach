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

class StarScorecard(BaseModel):
    situation: float = 0.0
    task: float = 0.0
    action: float = 0.0
    result: float = 0.0

class TechnicalAnalytics(BaseModel):
    attempts: int = 0
    averageScore: float = 0.0
    bestScore: float = 0.0
    latestScore: float = 0.0
    percentage: int = 0
    trend: str = "no_attempts"

class BehavioralAnalytics(BaseModel):
    attempts: int = 0
    averageScore: float = 0.0
    bestScore: float = 0.0
    latestScore: float = 0.0
    percentage: int = 0
    star: StarScorecard = Field(default_factory=StarScorecard)

class AptitudeAnalytics(BaseModel):
    attempts: int = 0
    averageScore: float = 0.0
    bestScore: float = 0.0
    latestScore: float = 0.0
    accuracy: float = 0.0
    questionsAnswered: int = 0
    questionsCorrect: int = 0

class HistoryItem(BaseModel):
    id: str
    name: str
    roundType: str
    score: float
    maxScore: int = 10
    percentage: int = 0
    questionsCount: int = 1
    date: str
    formattedDate: str
    daysAgo: str
    status: str = "Completed"

class AreaToImprove(BaseModel):
    area: str
    round: str
    severity: str
    evidence: str
    recommendation: str
    priority: int = 1

class OverviewAnalytics(BaseModel):
    fullName: str
    targetPosition: str
    industry: str
    overallReadiness: float = 0.0
    overallScore: float = 0.0
    totalCompletedRounds: int = 0
    roundsDone: int = 0
    totalQuestionsAnswered: int = 0
    streak: int = 0
    strongestArea: str = "None yet"
    weakestArea: str = "None yet"

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
    overview: Optional[OverviewAnalytics] = None
    technical: Optional[TechnicalAnalytics] = None
    behavioral: Optional[BehavioralAnalytics] = None
    aptitude: Optional[AptitudeAnalytics] = None
    areasToImproveList: Optional[List[AreaToImprove]] = None
    aiAnalysisAvailable: Optional[bool] = False
    aiPlan: Optional[Dict[str, Any]] = None

# Round Lifecycle
class RoundStartRequest(BaseModel):
    roundType: str = Field(..., description="round type: technical, behavioral, aptitude")

class QuestionResponse(BaseModel):
    id: str
    roundId: str
    questionText: str
    difficulty: Optional[str] = "medium"
    timeLimitSeconds: Optional[int] = 1500
    starterCode: Optional[str] = None
    options: Optional[List[str]] = None
    explanation: Optional[str] = None

class RoundStartResponse(BaseModel):
    roundId: str
    roundType: str
    status: str
    questions: List[QuestionResponse]
    totalTimeLimitSeconds: Optional[int] = None

class AnswerSubmitRequest(BaseModel):
    answerText: str
    language: Optional[str] = "javascript"

class AnswerSubmitResponse(BaseModel):
    score: float
    feedback: str
    isCompleted: bool
    overallScore: Optional[float] = None
    starBreakdown: Optional[Dict[str, Any]] = None
    analysisDetails: Optional[Dict[str, Any]] = None

class AptitudeExplainRequest(BaseModel):
    questionText: Optional[str] = None
    options: Optional[List[str]] = None
    selectedOption: Optional[str] = None
    questionId: Optional[str] = None

class AptitudeExplainResponse(BaseModel):
    correct: bool
    correctOption: Optional[str] = None
    explanation: str
    whyYourAnswer: Optional[str] = None
    concept: Optional[str] = None
    rawText: Optional[str] = None

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
    overview: Optional[OverviewAnalytics] = None
    technical: Optional[TechnicalAnalytics] = None
    behavioral: Optional[BehavioralAnalytics] = None
    aptitude: Optional[AptitudeAnalytics] = None
    areasToImproveList: Optional[List[AreaToImprove]] = None
    aiAnalysisAvailable: Optional[bool] = False
    aiPlan: Optional[Dict[str, Any]] = None
