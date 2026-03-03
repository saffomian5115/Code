from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


# ─── DEPARTMENT SCHEMAS ─────────────────────────────────

class DepartmentCreateRequest(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    head_of_department: Optional[int] = None

class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    head_of_department: Optional[int] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    description: Optional[str]
    head_of_department: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── PROGRAM SCHEMAS ────────────────────────────────────

class ProgramCreateRequest(BaseModel):
    name: str
    code: str
    department_id: int
    duration_years: Optional[int] = 4
    total_credit_hours: Optional[int] = None
    degree_type: Optional[str] = None

class ProgramUpdateRequest(BaseModel):
    name: Optional[str] = None
    duration_years: Optional[int] = None
    total_credit_hours: Optional[int] = None
    degree_type: Optional[str] = None

class ProgramResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    department_id: int
    duration_years: int
    total_credit_hours: Optional[int]
    degree_type: Optional[str]

    class Config:
        from_attributes = True


# ─── SEMESTER SCHEMAS ───────────────────────────────────

class SemesterCreateRequest(BaseModel):
    name: str
    code: str
    start_date: date
    end_date: date
    registration_start: Optional[date] = None
    registration_end: Optional[date] = None
    add_drop_last_date: Optional[date] = None

    @field_validator("end_date")
    def end_after_start(cls, v, info):
        if "start_date" in info.data and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v

class SemesterUpdateRequest(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    registration_start: Optional[date] = None
    registration_end: Optional[date] = None
    add_drop_last_date: Optional[date] = None

class SemesterResponse(BaseModel):
    id: int
    name: str
    code: str
    start_date: date
    end_date: date
    is_active: bool
    registration_start: Optional[date]
    registration_end: Optional[date]
    add_drop_last_date: Optional[date]

    class Config:
        from_attributes = True


# ─── COURSE SCHEMAS ─────────────────────────────────────

class CLOCreateRequest(BaseModel):
    clo_number: str
    description: str
    domain: Optional[str] = None
    level: Optional[str] = None   # Bloom's taxonomy level

class CLOResponse(BaseModel):
    id: int
    clo_number: str
    description: str
    domain: Optional[str]
    level: Optional[str]

    class Config:
        from_attributes = True

class CourseCreateRequest(BaseModel):
    code: str
    name: str
    credit_hours: int
    lecture_hours: Optional[int] = 0
    lab_hours: Optional[int] = 0
    description: Optional[str] = None
    syllabus: Optional[str] = None
    department_id: int
    program_id: Optional[int] = None
    semester_level: Optional[int] = None
    is_elective: Optional[bool] = False

class CourseUpdateRequest(BaseModel):
    name: Optional[str] = None
    credit_hours: Optional[int] = None
    lecture_hours: Optional[int] = None
    lab_hours: Optional[int] = None
    description: Optional[str] = None
    syllabus: Optional[str] = None
    semester_level: Optional[int] = None
    is_elective: Optional[bool] = None

class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    credit_hours: int
    lecture_hours: int
    lab_hours: int
    department_id: int
    program_id: Optional[int]
    semester_level: Optional[int]
    is_elective: bool

    class Config:
        from_attributes = True