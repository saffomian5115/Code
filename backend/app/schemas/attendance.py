from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class SessionTypeEnum(str, Enum):
    lecture = "lecture"
    lab = "lab"
    tutorial = "tutorial"

class AttendanceStatusEnum(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"
    excused = "excused"

class DirectionEnum(str, Enum):
    in_ = "in"
    out = "out"

class GateTypeEnum(str, Enum):
    main = "main"
    department = "department"
    lab = "lab"
    library = "library"
    hostel = "hostel"

class DayOfWeekEnum(str, Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


# ─── LECTURE SESSION SCHEMAS ────────────────────────────

class LectureSessionCreateRequest(BaseModel):
    offering_id: int
    session_date: date
    start_time: str    # "09:00"
    end_time: str      # "10:30"
    topic: Optional[str] = None
    session_type: Optional[SessionTypeEnum] = SessionTypeEnum.lecture
    is_makeup: Optional[bool] = False
    makeup_of_session: Optional[int] = None

class LectureSessionResponse(BaseModel):
    id: int
    offering_id: int
    session_date: date
    start_time: str
    end_time: str
    topic: Optional[str]
    session_type: str
    attendance_marked: bool

    class Config:
        from_attributes = True


# ─── ATTENDANCE MARK SCHEMAS ────────────────────────────

class SingleAttendanceRequest(BaseModel):
    student_id: int
    status: AttendanceStatusEnum
    remarks: Optional[str] = None

class BulkAttendanceRequest(BaseModel):
    # Ek session ki poori class ki attendance ek saath
    records: List[SingleAttendanceRequest]

class AttendanceUpdateRequest(BaseModel):
    status: AttendanceStatusEnum
    remarks: Optional[str] = None


# ─── CAMPUS GATE SCHEMAS ────────────────────────────────

class GateCreateRequest(BaseModel):
    gate_name: str
    gate_code: str
    gate_type: Optional[GateTypeEnum] = GateTypeEnum.main
    department_id: Optional[int] = None
    location_description: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    device_model: Optional[str] = None

class GateUpdateRequest(BaseModel):
    gate_name: Optional[str] = None
    location_description: Optional[str] = None
    ip_address: Optional[str] = None
    is_active: Optional[bool] = None

class CameraCreateRequest(BaseModel):
    camera_name: str
    camera_ip: Optional[str] = None
    rtsp_url: Optional[str] = None
    camera_type: Optional[str] = "both"
    coverage_area: Optional[str] = None
    resolution: Optional[str] = None
    is_primary: Optional[bool] = False

class GateScheduleRequest(BaseModel):
    day_of_week: DayOfWeekEnum
    open_time: str
    close_time: str
    is_holiday: Optional[bool] = False


# ─── CAMPUS ATTENDANCE SCHEMAS ──────────────────────────

class CampusAttendanceCreateRequest(BaseModel):
    student_id: int
    gate_id: int
    camera_id: int
    entry_direction: DirectionEnum
    face_match_confidence: float
    processing_time_ms: Optional[int] = None
    spoof_check_passed: Optional[bool] = True
    liveness_score: Optional[float] = None
    raw_image_path: Optional[str] = None
    processed_image_path: Optional[str] = None

class ManualOverrideRequest(BaseModel):
    student_id: int
    gate_id: int
    camera_id: int
    reason: str
    entry_direction: DirectionEnum