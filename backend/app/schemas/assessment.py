from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class DifficultyEnum(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class QuestionTypeEnum(str, Enum):
    mcq = "mcq"
    true_false = "true_false"
    short = "short"

class ExamTypeEnum(str, Enum):
    midterm = "midterm"
    final = "final"
    special = "special"

class SubmissionStatusEnum(str, Enum):
    submitted = "submitted"
    late = "late"
    graded = "graded"
    resubmit = "resubmit"


# ─── ASSIGNMENT SCHEMAS ─────────────────────────────────

class AssignmentCreateRequest(BaseModel):
    offering_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    total_marks: int
    weightage_percent: Optional[float] = 0
    due_date: datetime
    file_required: Optional[bool] = True
    max_file_size: Optional[int] = 10
    allowed_file_types: Optional[str] = ".pdf,.docx,.zip"
    plagiarism_check: Optional[bool] = False

class AssignmentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[int] = None
    weightage_percent: Optional[float] = None
    due_date: Optional[datetime] = None

class AssignmentSubmitRequest(BaseModel):
    file_path: str       # Upload ke baad file ka path
    remarks: Optional[str] = None

class GradeSubmissionRequest(BaseModel):
    obtained_marks: float
    feedback: Optional[str] = None
    status: Optional[SubmissionStatusEnum] = SubmissionStatusEnum.graded

    @field_validator("obtained_marks")
    def marks_positive(cls, v):
        if v < 0:
            raise ValueError("Marks cannot be negative")
        return v


# ─── QUIZ SCHEMAS ───────────────────────────────────────

class QuizQuestionCreateRequest(BaseModel):
    question_text: str
    question_type: QuestionTypeEnum = QuestionTypeEnum.mcq
    options: Optional[List[str]] = None    # ["A", "B", "C", "D"]
    correct_answer: str
    marks: Optional[int] = 1
    difficulty: Optional[DifficultyEnum] = DifficultyEnum.medium
    explanation: Optional[str] = None

class QuizCreateRequest(BaseModel):
    offering_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    total_marks: int
    time_limit_minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_mandatory: Optional[bool] = True
    shuffle_questions: Optional[bool] = False
    questions: List[QuizQuestionCreateRequest]

    @field_validator("questions")
    def min_questions(cls, v):
        if len(v) == 0:
            raise ValueError("At least 1 question required")
        return v

class QuizAttemptSubmitRequest(BaseModel):
    # {question_id: student_answer}
    answers: Dict[int, str]

class AIQuizGenerateRequest(BaseModel):
    course_id: int
    topic: str
    difficulty: DifficultyEnum
    num_questions: Optional[int] = 5

class AIQuizSubmitRequest(BaseModel):
    ai_quiz_id: int
    # {question_index: student_answer}
    answers: Dict[int, str]


# ─── EXAM SCHEMAS ───────────────────────────────────────

class ExamCreateRequest(BaseModel):
    offering_id: int
    exam_type: ExamTypeEnum
    title: str
    total_marks: int
    weightage_percent: float
    exam_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_number: Optional[str] = None

class ExamUpdateRequest(BaseModel):
    title: Optional[str] = None
    total_marks: Optional[int] = None
    weightage_percent: Optional[float] = None
    exam_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_number: Optional[str] = None

class ExamResultEntryRequest(BaseModel):
    student_id: int
    obtained_marks: float
    grade: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("obtained_marks")
    def marks_positive(cls, v):
        if v < 0:
            raise ValueError("Marks cannot be negative")
        return v

class BulkExamResultRequest(BaseModel):
    results: List[ExamResultEntryRequest]

class QuizUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    total_marks: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_mandatory: Optional[bool] = None
    shuffle_questions: Optional[bool] = None