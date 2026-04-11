from sqlalchemy import (
    Column, Integer, String, Boolean,
    Text, Date, Time, TIMESTAMP, ForeignKey,
    JSON, DECIMAL, Enum, BigInteger
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class LectureSession(Base):
    __tablename__ = "lecture_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    offering_id = Column(
        Integer, ForeignKey("course_offerings.id"), nullable=False
    )
    session_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    topic = Column(String(200))
    session_type = Column(
        Enum("lecture", "lab", "tutorial"), default="lecture"
    )
    is_makeup = Column(Boolean, default=False)
    makeup_of_session = Column(
        Integer, ForeignKey("lecture_sessions.id"), nullable=True
    )
    attendance_marked = Column(Boolean, default=False)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    marked_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    offering = relationship("CourseOffering", back_populates="lecture_sessions")
    marker = relationship("User", foreign_keys=[marked_by])
    makeup_original = relationship("LectureSession", remote_side=[id])
    attendance_records = relationship("LectureAttendance", back_populates="session")


class LectureAttendance(Base):
    __tablename__ = "lecture_attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        Integer, ForeignKey("lecture_sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum("present", "absent", "late", "excused"), default="absent"
    )
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    marked_at = Column(TIMESTAMP, server_default=func.now())
    remarks = Column(Text)

    # Relationships
    session = relationship("LectureSession", back_populates="attendance_records")
    student = relationship("User", foreign_keys=[student_id])
    marker = relationship("User", foreign_keys=[marked_by])


class AttendanceSummary(Base):
    __tablename__ = "attendance_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    offering_id = Column(
        Integer, ForeignKey("course_offerings.id"), nullable=False
    )
    total_classes = Column(Integer, default=0)
    attended_classes = Column(Integer, default=0)
    percentage = Column(DECIMAL(5, 2), default=0)
    min_percentage_required = Column(DECIMAL(5, 2), default=75)
    alert_triggered = Column(Boolean, default=False)
    short_alert_sent = Column(Boolean, default=False)
    alert_sent_at = Column(TIMESTAMP, nullable=True)
    last_updated = Column(Date)

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    offering = relationship("CourseOffering")


# ─── LEVEL 2: CAMPUS GATE MODELS ────────────────────────

class CampusGate(Base):
    __tablename__ = "campus_gates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gate_name = Column(String(100), nullable=False)
    gate_code = Column(String(50), unique=True, nullable=False)
    gate_type = Column(
        Enum("main", "department", "lab", "library", "hostel"),
        default="main"
    )
    department_id = Column(
        Integer, ForeignKey("departments.id"), nullable=True
    )
    location_description = Column(Text)
    ip_address = Column(String(45))
    mac_address = Column(String(17))
    device_model = Column(String(100))
    is_active = Column(Boolean, default=True)
    last_ping = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    department = relationship("Department")
    cameras = relationship("GateCamera", back_populates="gate")
    schedules = relationship("GateSchedule", back_populates="gate")


class GateCamera(Base):
    __tablename__ = "gate_cameras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gate_id = Column(
        Integer, ForeignKey("campus_gates.id", ondelete="CASCADE"),
        nullable=False
    )
    camera_name = Column(String(100), nullable=False)
    camera_ip = Column(String(45))
    rtsp_url = Column(Text)
    camera_type = Column(
        Enum("entry", "exit", "both"), default="both"
    )
    coverage_area = Column(String(255))
    angle = Column(String(50))
    resolution = Column(String(20))
    is_primary = Column(Boolean, default=False)
    status = Column(
        Enum("active", "inactive", "maintenance"), default="active"
    )
    last_image = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    gate = relationship("CampusGate", back_populates="cameras")


class GateSchedule(Base):
    __tablename__ = "gate_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gate_id = Column(
        Integer, ForeignKey("campus_gates.id", ondelete="CASCADE"),
        nullable=False
    )
    day_of_week = Column(
        Enum("monday","tuesday","wednesday","thursday",
             "friday","saturday","sunday"),
        nullable=False
    )
    open_time = Column(String(10), nullable=False)
    close_time = Column(String(10), nullable=False)
    is_holiday = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    gate = relationship("CampusGate", back_populates="schedules")


class CampusAttendance(Base):
    __tablename__ = "campus_attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    gate_id = Column(Integer, ForeignKey("campus_gates.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("gate_cameras.id"), nullable=False)
    entry_time = Column(TIMESTAMP, nullable=False)
    exit_time = Column(TIMESTAMP, nullable=True)
    entry_direction = Column(Enum("in", "out"), default="in")
    face_match_confidence = Column(DECIMAL(5, 2), nullable=False)
    processing_time_ms = Column(Integer)
    spoof_check_passed = Column(Boolean, default=True)
    liveness_score = Column(DECIMAL(5, 2))
    raw_image_path = Column(Text)
    processed_image_path = Column(Text)
    is_duplicate_filtered = Column(Boolean, default=False)
    manual_override = Column(Boolean, default=False)
    override_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    override_reason = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    gate = relationship("CampusGate")
    camera = relationship("GateCamera")
    override_officer = relationship("User", foreign_keys=[override_by])


class FaceRecognitionLog(Base):
    __tablename__ = "face_recognition_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    gate_id = Column(Integer, ForeignKey("campus_gates.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("gate_cameras.id"), nullable=False)
    confidence = Column(DECIMAL(5, 2))
    match_success = Column(Boolean, default=False)
    processing_time_ms = Column(Integer)
    spoof_check_passed = Column(Boolean, default=True)
    liveness_score = Column(DECIMAL(5, 2))
    face_image_path = Column(Text)
    error_message = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    gate = relationship("CampusGate")
    camera = relationship("GateCamera")


class CameraHealthLog(Base):
    __tablename__ = "camera_health_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(
        Integer, ForeignKey("gate_cameras.id", ondelete="CASCADE"),
        nullable=False
    )
    status = Column(Enum("online", "offline", "degraded"), nullable=False)
    ping_time = Column(Integer)
    error_message = Column(Text)
    frame_rate = Column(DECIMAL(5, 2))
    temperature = Column(DECIMAL(5, 2))
    storage_available = Column(BigInteger)
    checked_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    camera = relationship("GateCamera")


class GateAccessLog(Base):
    __tablename__ = "gate_access_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gate_id = Column(Integer, ForeignKey("campus_gates.id"), nullable=False)
    accessed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_type = Column(
        Enum("manual_override", "maintenance", "configuration"),
        nullable=False
    )
    reason = Column(Text)
    accessed_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    gate = relationship("CampusGate")
    officer = relationship("User", foreign_keys=[accessed_by])