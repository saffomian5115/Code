from sqlalchemy import (
    Column, Integer, String, Boolean,
    Enum, TIMESTAMP, Date, Text, BLOB,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    roll_number = Column(String(20), unique=True, nullable=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("admin", "teacher", "student"), nullable=False)
    is_active = Column(Boolean, default=True)
    face_embedding = Column(BLOB, nullable=True)
    face_enrolled_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    last_login = Column(TIMESTAMP, nullable=True)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    registration_number = Column(String(50), unique=True)
    full_name = Column(String(100), nullable=False)
    father_name = Column(String(100))
    date_of_birth = Column(Date)
    gender = Column(Enum("male", "female", "other"))
    cnic = Column(String(15), unique=True)
    phone = Column(String(20))
    alternate_phone = Column(String(20))
    current_address = Column(Text)
    permanent_address = Column(Text)
    city = Column(String(50))
    guardian_phone = Column(String(20))
    guardian_cnic = Column(String(15))
    guardian_relation = Column(String(50))
    profile_picture_url = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="student_profile")


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    employee_id = Column(String(50), unique=True)
    full_name = Column(String(100), nullable=False)
    designation = Column(String(100))
    qualification = Column(Text)
    specialization = Column(String(200))
    joining_date = Column(Date)
    phone = Column(String(20))
    email = Column(String(100))
    cnic = Column(String(15))
    address = Column(Text)
    profile_picture_url = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="teacher_profile")


class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    employee_id = Column(String(50), unique=True)
    full_name = Column(String(100), nullable=False)
    designation = Column(String(100))
    phone = Column(String(20))
    email_official = Column(String(100))
    profile_picture_url = Column(Text)  # ← NAYA ADD HUA
    role_type = Column(
        Enum("admin", "security_admin", "gate_operator"),
        default="admin"
    )
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="admin_profile")