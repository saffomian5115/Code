from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime
from enum import Enum

class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class RoleEnum(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"

# ─── AUTH SCHEMAS ───────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# ─── FACE AUTH SCHEMAS ──────────────────────────────────
class FaceLoginRequest(BaseModel):
    """Frontend MediaPipe se cropped face ka base64 bhejta hai"""
    image_base64: str   # data:image/jpeg;base64,... ya sirf raw base64

class FaceEnrollRequest(BaseModel):
    """Profile page se face enroll karne ke liye"""
    image_base64: str

# ─── PROFILE SCHEMAS ────────────────────────────────────
class ProfileResponse(BaseModel):
    user_id: int
    email: str
    role: str
    is_active: bool
    full_name: str
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None
    roll_number: Optional[str] = None
    father_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    cnic: Optional[str] = None
    city: Optional[str] = None
    current_address: Optional[str] = None
    guardian_phone: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    joining_date: Optional[date] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    face_enrolled: Optional[bool] = False   # ← NEW

    class Config:
        from_attributes = True

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    current_address: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None

# ─── STUDENT SCHEMAS ────────────────────────────────────
class StudentCreateRequest(BaseModel):
    email: EmailStr
    roll_number: Optional[str] = None
    full_name: str
    father_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    cnic: Optional[str] = None
    phone: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    city: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_cnic: Optional[str] = None
    guardian_relation: Optional[str] = None

class StudentUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    cnic: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    city: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_cnic: Optional[str] = None
    guardian_relation: Optional[str] = None

# ─── TEACHER SCHEMAS ────────────────────────────────────
class TeacherCreateRequest(BaseModel):
    email: EmailStr
    employee_id: Optional[str] = None
    full_name: str
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    joining_date: Optional[date] = None
    phone: Optional[str] = None
    cnic: Optional[str] = None
    address: Optional[str] = None

class TeacherUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None