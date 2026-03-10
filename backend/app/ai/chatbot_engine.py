"""
Chatbot Engine — Upgraded Version
Rule-based keyword matching hataya.
Ab: HuggingFace Embeddings + FAISS RAG + Gemini LLM
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import secrets
import time

from app.models.ai_analytics import (
    ChatbotIntent, ChatbotConversation,
    ChatbotMessage, ChatbotFAQ
)
from app.ai.rag_service import RAGService
from app.ai.gemini_service import GeminiService


class ChatbotEngine:

    # ─── Session Management ──────────────────────────────

    @staticmethod
    def get_or_create_session(
        db: Session,
        student_id: int,
        session_id: str = None
    ) -> ChatbotConversation:

        if session_id:
            existing = db.query(ChatbotConversation).filter(
                ChatbotConversation.session_id == session_id,
                ChatbotConversation.student_id == student_id,
                ChatbotConversation.status == "active"
            ).first()
            if existing:
                return existing

        new_session_id = session_id or secrets.token_urlsafe(16)
        conversation = ChatbotConversation(
            student_id=student_id,
            session_id=new_session_id,
            status="active"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    # ─── Student Data Fetch ──────────────────────────────

    @staticmethod
    def get_student_data(db: Session, student_id: int) -> dict:
        """
        Student ki basic info fetch karo for RAG context.
        Aap chahein toh attendance, CGPA etc. bhi yahan add kar sakte ho
        apne existing service methods se.
        """
        try:
            from app.models.user import User
            user = db.query(User).filter(User.id == student_id).first()
            name = user.full_name if user else "Student"
        except Exception:
            name = "Student"

        # TODO: Aap yahan real data add kar sakte ho:
        # attendance = AttendanceService.get_overall(db, student_id)
        # cgpa = ResultService.get_cgpa(db, student_id)
        # courses = EnrollmentService.get_active_courses(db, student_id)

        return {
            "name": name,
            "attendance": "Check your dashboard",
            "cgpa": "Check results section",
            "pending_fee": "Check fee section",
            "semester": "Current semester",
            "courses": [],
        }

    # ─── Core Message Processing ─────────────────────────

    @staticmethod
    def process_message(
        db: Session,
        student_id: int,
        message: str,
        session_id: str = None
    ) -> dict:
        start_time = time.time()

        # 1. Session get ya create karo
        conversation = ChatbotEngine.get_or_create_session(
            db, student_id, session_id
        )

        # 2. Student data fetch karo (RAG context ke liye)
        student_data = ChatbotEngine.get_student_data(db, student_id)

        # 3. RAG: relevant FAQs + student context build karo
        context = RAGService.build_context(db, message, student_data)

        # 4. Gemini se response generate karo
        response = GeminiService.generate_response(message, context)

        # 5. Response time calculate karo
        response_time = int((time.time() - start_time) * 1000)

        # 6. Student message save karo
        student_msg = ChatbotMessage(
            conversation_id=conversation.id,
            sender="student",
            message=message,
            intent_id=None,
            confidence=0.99
        )
        db.add(student_msg)

        # 7. Bot response save karo
        bot_msg = ChatbotMessage(
            conversation_id=conversation.id,
            sender="bot",
            message=response,
            intent_id=None,
            confidence=0.99,
            response_time_ms=response_time
        )
        db.add(bot_msg)

        # 8. Conversation update karo
        conversation.total_messages += 2
        db.commit()

        return {
            "session_id": conversation.session_id,
            "intent": "llm_rag_response",
            "confidence": 0.99,
            "response": response,
            "response_time_ms": response_time,
            "faq_suggestions": []
        }

    # ─── Session End ─────────────────────────────────────

    @staticmethod
    def end_session(db: Session, session_id: str, student_id: int):
        conversation = db.query(ChatbotConversation).filter(
            ChatbotConversation.session_id == session_id,
            ChatbotConversation.student_id == student_id
        ).first()
        if conversation:
            conversation.status = "ended"
            db.commit()
        return conversation

    # ─── Feedback ────────────────────────────────────────

    @staticmethod
    def save_feedback(
        db: Session,
        session_id: str,
        student_id: int,
        rating: int,
        feedback_text: str = None
    ):
        conversation = db.query(ChatbotConversation).filter(
            ChatbotConversation.session_id == session_id,
            ChatbotConversation.student_id == student_id
        ).first()
        if not conversation:
            return None, "Session not found"

        conversation.feedback_rating = rating
        conversation.feedback_text = feedback_text
        db.commit()
        return conversation, None