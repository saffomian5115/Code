from sqlalchemy import (
    Column, Integer, String, Boolean,
    Text, TIMESTAMP, ForeignKey,
    JSON, DECIMAL, Enum
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudentPerformanceScore(Base):
    __tablename__ = "student_performance_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    academic_score = Column(DECIMAL(5, 2), default=0)
    consistency_index = Column(DECIMAL(5, 2), default=0)
    improvement_index = Column(DECIMAL(5, 2), default=0)
    engagement_level = Column(
        Enum("low", "medium", "high"), default="medium"
    )
    class_rank = Column(Integer, nullable=True)
    section_rank = Column(Integer, nullable=True)
    risk_prediction = Column(JSON, nullable=True)
    weak_subjects = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    score_breakdown = Column(JSON, nullable=True)
    trend_direction = Column(
        Enum("improving", "stable", "declining"), default="stable"
    )
    recommendations_generated_at = Column(TIMESTAMP, nullable=True)
    calculated_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    semester = relationship("Semester")


class ChatbotIntent(Base):
    __tablename__ = "chatbot_intents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    intent_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    category = Column(String(50))
    example_queries = Column(JSON)
    response_template = Column(Text)
    requires_auth = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now())


class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    session_id = Column(String(100), unique=True, nullable=False)
    started_at = Column(TIMESTAMP, server_default=func.now())
    last_activity = Column(TIMESTAMP, server_default=func.now(),
                           onupdate=func.now())
    status = Column(Enum("active", "ended"), default="active")
    context_data = Column(JSON)
    total_messages = Column(Integer, default=0)
    feedback_rating = Column(Integer, nullable=True)
    feedback_text = Column(Text, nullable=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    messages = relationship("ChatbotMessage", back_populates="conversation")


class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(
        Integer, ForeignKey("chatbot_conversations.id", ondelete="CASCADE"),
        nullable=False
    )
    sender = Column(Enum("student", "bot"), nullable=False)
    message = Column(Text, nullable=False)
    intent_id = Column(
        Integer, ForeignKey("chatbot_intents.id"), nullable=True
    )
    confidence = Column(DECIMAL(4, 3), nullable=True)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    response_time_ms = Column(Integer, nullable=True)
    message_metadata = Column(JSON, nullable=True)

    # Relationships
    conversation = relationship("ChatbotConversation", back_populates="messages")
    intent = relationship("ChatbotIntent")


class ChatbotFAQ(Base):
    __tablename__ = "chatbot_faqs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(50))
    tags = Column(JSON)
    view_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now())