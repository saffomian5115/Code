from sqlalchemy import (
    Column, Integer, String, Boolean,
    Text, DateTime, TIMESTAMP, ForeignKey,
    JSON, DECIMAL, Enum, Date, Time
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    offering_id = Column(
        Integer, ForeignKey("course_offerings.id"), nullable=False
    )
    title = Column(String(200), nullable=False)
    description = Column(Text)
    total_marks = Column(Integer, nullable=False)
    weightage_percent = Column(DECIMAL(5, 2), default=0)
    due_date = Column(DateTime, nullable=False)
    file_required = Column(Boolean, default=True)
    max_file_size = Column(Integer, default=10)       # MB
    allowed_file_types = Column(String(255), default=".pdf,.docx,.zip")
    plagiarism_check = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    offering = relationship("CourseOffering")
    creator = relationship("User", foreign_keys=[created_by])
    submissions = relationship("AssignmentSubmission", back_populates="assignment")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(
        Integer, ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False
    )
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_date = Column(TIMESTAMP, server_default=func.now())
    file_path = Column(Text, nullable=False)
    remarks = Column(Text)
    obtained_marks = Column(DECIMAL(7, 2), nullable=True)
    feedback = Column(Text)
    plagiarism_percentage = Column(DECIMAL(5, 2), nullable=True)
    plagiarism_report_url = Column(Text)
    plagiarism_status = Column(
        Enum("pending", "completed", "failed"), default="pending"
    )
    plagiarism_data = Column(JSON)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(TIMESTAMP, nullable=True)
    status = Column(
        Enum("submitted", "late", "graded", "resubmit"), default="submitted"
    )

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    grader = relationship("User", foreign_keys=[graded_by])


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    offering_id = Column(
        Integer, ForeignKey("course_offerings.id"), nullable=False
    )
    title = Column(String(200), nullable=False)
    description = Column(Text)
    quiz_type = Column(
        Enum("teacher", "ai_generated"), default="teacher"
    )
    total_questions = Column(Integer, nullable=False)
    total_marks = Column(Integer, nullable=False)
    time_limit_minutes = Column(Integer)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    is_mandatory = Column(Boolean, default=True)
    auto_grading = Column(Boolean, default=True)
    shuffle_questions = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    offering = relationship("CourseOffering")
    creator = relationship("User", foreign_keys=[created_by])
    questions = relationship(
        "QuizQuestion", back_populates="quiz", cascade="all, delete"
    )
    attempts = relationship("QuizAttempt", back_populates="quiz")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(
        Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    question_text = Column(Text, nullable=False)
    question_type = Column(
        Enum("mcq", "true_false", "short"), default="mcq"
    )
    options = Column(JSON)          # MCQ options list
    correct_answer = Column(String(500))
    marks = Column(Integer, default=1)
    difficulty = Column(
        Enum("easy", "medium", "hard"), default="medium"
    )
    explanation = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(TIMESTAMP, server_default=func.now())
    end_time = Column(TIMESTAMP, nullable=True)
    score = Column(DECIMAL(7, 2), default=0)
    total_marks = Column(Integer)
    percentage = Column(DECIMAL(5, 2))
    answers = Column(JSON)          # {question_id: answer} format
    status = Column(
        Enum("in_progress", "completed", "abandoned"), default="in_progress"
    )

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("User", foreign_keys=[student_id])


class AIQuiz(Base):
    __tablename__ = "ai_quizzes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    topic = Column(String(200))
    difficulty = Column(
        Enum("easy", "medium", "hard"), nullable=False
    )
    questions_generated = Column(JSON)
    student_answers = Column(JSON)
    score = Column(DECIMAL(5, 2))
    feedback = Column(Text)
    weak_areas_identified = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    offering_id = Column(
        Integer, ForeignKey("course_offerings.id"), nullable=False
    )
    exam_type = Column(
        Enum("midterm", "final", "special"), nullable=False
    )
    title = Column(String(200), nullable=False)
    total_marks = Column(Integer, nullable=False)
    weightage_percent = Column(DECIMAL(5, 2), nullable=False)
    exam_date = Column(Date)
    start_time = Column(String(10))
    end_time = Column(String(10))
    room_number = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    offering = relationship("CourseOffering")
    results = relationship("ExamResult", back_populates="exam")


class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    obtained_marks = Column(DECIMAL(7, 2), nullable=False)
    grade = Column(String(2))
    remarks = Column(Text)
    entered_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    entered_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    exam = relationship("Exam", back_populates="results")
    student = relationship("User", foreign_keys=[student_id])
    enterer = relationship("User", foreign_keys=[entered_by])