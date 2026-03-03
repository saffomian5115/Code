from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class EnrollmentStatusEnum(str, Enum):
    enrolled = "enrolled"
    dropped = "dropped"
    completed = "completed"
    failed = "failed"


class ProgramStatusEnum(str, Enum):
    active = "active"
    graduated = "graduated"
    suspended = "suspended"
    withdrawn = "withdrawn"


# ─── COURSE OFFERING SCHEMAS ────────────────────────────

class ScheduleDay(BaseModel):
    day: str           # monday, tuesday, etc
    start_time: str    # "09:00"
    end_time: str      # "10:30"
    room: Optional[str] = None

class CourseOfferingCreateRequest(BaseModel):
    course_id: int
    semester_id: int
    instructor_id: int
    section: str
    max_students: Optional[int] = 50
    room_number: Optional[str] = None
    lab_number: Optional[str] = None
    schedule_json: Optional[List[ScheduleDay]] = None
    online_meet_link: Optional[str] = None

class CourseOfferingUpdateRequest(BaseModel):
    instructor_id: Optional[int] = None
    max_students: Optional[int] = None
    room_number: Optional[str] = None
    lab_number: Optional[str] = None
    schedule_json: Optional[List[ScheduleDay]] = None
    online_meet_link: Optional[str] = None
    is_active: Optional[bool] = None

class CourseOfferingResponse(BaseModel):
    id: int
    course_id: int
    semester_id: int
    instructor_id: int
    section: str
    max_students: int
    enrolled_students: int
    room_number: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ─── ENROLLMENT SCHEMAS ─────────────────────────────────

class EnrollmentCreateRequest(BaseModel):
    student_id: int
    offering_id: int

class EnrollmentApproveRequest(BaseModel):
    comments: Optional[str] = None

class EnrollmentDropRequest(BaseModel):
    reason: Optional[str] = None

class GradeEntryRequest(BaseModel):
    grade_letter: str
    grade_points: float

    @field_validator("grade_points")
    def valid_grade_points(cls, v):
        if not (0.0 <= v <= 4.0):
            raise ValueError("Grade points must be between 0.0 and 4.0")
        return v

class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    offering_id: int
    status: str
    is_approved: bool
    grade_letter: Optional[str]
    grade_points: Optional[float]
    enrollment_date: datetime

    class Config:
        from_attributes = True


# ─── STUDENT PROGRAM ENROLLMENT SCHEMAS ─────────────────

class StudentProgramEnrollmentCreateRequest(BaseModel):
    student_id: int
    program_id: int
    batch_year: int
    enrollment_semester_id: int
    advisor_id: Optional[int] = None
    enrollment_date: date
    expected_graduation: Optional[date] = None

class StudentProgramEnrollmentUpdateRequest(BaseModel):
    current_semester: Optional[int] = None
    status: Optional[ProgramStatusEnum] = None
    advisor_id: Optional[int] = None