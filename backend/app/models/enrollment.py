from sqlalchemy import (
    Column, Integer, String, Boolean,
    Text, Date, TIMESTAMP, ForeignKey,
    JSON, DECIMAL, Enum
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class CourseOffering(Base):
    __tablename__ = "course_offerings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    instructor_id = Column(
        Integer, ForeignKey("teacher_profiles.user_id"), nullable=False
    )
    section = Column(String(10), nullable=False)
    max_students = Column(Integer, default=50)
    enrolled_students = Column(Integer, default=0)
    room_number = Column(String(50))
    lab_number = Column(String(50))
    schedule_json = Column(JSON)
    online_meet_link = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    course = relationship("Course")
    semester = relationship("Semester")
    instructor = relationship("TeacherProfile")
    enrollments = relationship("Enrollment", back_populates="offering")
    lecture_sessions = relationship("LectureSession", back_populates="offering")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    offering_id = Column(
        Integer, ForeignKey("course_offerings.id"), nullable=False
    )
    enrollment_date = Column(TIMESTAMP, server_default=func.now())
    status = Column(
        Enum("enrolled", "dropped", "completed", "failed"),
        default="enrolled"
    )
    grade_letter = Column(String(2), nullable=True)
    grade_points = Column(DECIMAL(3, 2), nullable=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(TIMESTAMP, nullable=True)
    advisor_remarks = Column(Text)
    advisor_approval_requested = Column(Boolean, default=False)
    advisor_approval_date = Column(TIMESTAMP, nullable=True)
    advisor_comments = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    offering = relationship("CourseOffering", back_populates="enrollments")
    approver = relationship("User", foreign_keys=[approved_by])


class StudentProgramEnrollment(Base):
    __tablename__ = "student_program_enrollment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    batch_year = Column(Integer, nullable=False)
    enrollment_semester_id = Column(
        Integer, ForeignKey("semesters.id"), nullable=False
    )
    current_semester = Column(Integer, default=1)
    status = Column(
        Enum("active", "graduated", "suspended", "withdrawn"),
        default="active"
    )
    advisor_id = Column(
        Integer, ForeignKey("teacher_profiles.user_id"), nullable=True
    )
    enrollment_date = Column(Date, nullable=False)
    expected_graduation = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    program = relationship("Program")
    semester = relationship("Semester")
    advisor = relationship("TeacherProfile")