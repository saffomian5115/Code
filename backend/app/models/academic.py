from sqlalchemy import (
    Column, Integer, String, Boolean,
    Text, Date, TIMESTAMP, ForeignKey, JSON
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), unique=True)
    description = Column(Text)
    head_of_department = Column(
        Integer, ForeignKey("teacher_profiles.user_id"), nullable=True
    )
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    hod = relationship("TeacherProfile", foreign_keys=[head_of_department])
    programs = relationship("Program", back_populates="department")
    courses = relationship("Course", back_populates="department")


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    duration_years = Column(Integer, default=4)
    total_credit_hours = Column(Integer)
    degree_type = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    department = relationship("Department", back_populates="programs")
    courses = relationship("Course", back_populates="program")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    code = Column(String(20), unique=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    registration_start = Column(Date)
    registration_end = Column(Date)
    add_drop_last_date = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    credit_hours = Column(Integer, nullable=False)
    lecture_hours = Column(Integer, default=0)
    lab_hours = Column(Integer, default=0)
    description = Column(Text)
    syllabus = Column(Text)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    semester_level = Column(Integer)
    is_elective = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="courses")
    program = relationship("Program", back_populates="courses")
    clos = relationship("CourseCLO", back_populates="course")


class CourseCLO(Base):
    __tablename__ = "course_clos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    clo_number = Column(String(10), nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String(50))
    level = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    course = relationship("Course", back_populates="clos")