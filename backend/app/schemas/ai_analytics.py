from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class EngagementEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TrendEnum(str, Enum):
    improving = "improving"
    stable = "stable"
    declining = "declining"


# ─── ANALYTICS SCHEMAS ──────────────────────────────────

class AnalyticsCalculateRequest(BaseModel):
    student_id: int
    semester_id: int

class BulkAnalyticsRequest(BaseModel):
    semester_id: int
    offering_id: Optional[int] = None   # Specific class ya sab


# ─── CHATBOT SCHEMAS ────────────────────────────────────

class ChatbotMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None    # Resume session

class ConversationFeedbackRequest(BaseModel):
    session_id: str
    rating: int                         # 1-5
    feedback_text: Optional[str] = None

    @field_validator("rating")
    def valid_rating(cls, v):
        if not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v


# ─── FAQ SCHEMAS ────────────────────────────────────────

class FAQCreateRequest(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class FAQUpdateRequest(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class FAQFeedbackRequest(BaseModel):
    helpful: bool                       # True = helpful, False = not helpful


# ─── FACE RECOGNITION SCHEMAS ───────────────────────────

class FaceEnrollRequest(BaseModel):
    student_id: int
    # Base64 encoded image
    image_base64: str

class FaceVerifyRequest(BaseModel):
    gate_id: int
    camera_id: int
    image_base64: str
    entry_direction: Optional[str] = "in"

class GateAttendanceRequest(BaseModel):
    image_base64: str
    gate_id: int
    camera_id: int
    entry_direction: str = "in"  # "in" or "out"