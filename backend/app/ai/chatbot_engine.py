from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime, timezone
import secrets
import time
from app.models.ai_analytics import (
    ChatbotIntent, ChatbotConversation,
    ChatbotMessage, ChatbotFAQ
)


class ChatbotEngine:
    """
    Simple intent-based chatbot.
    Phase 8 mein rule-based hai —
    baad mein NLP/LLM se upgrade hoga.
    """

    # Intent keywords map
    INTENT_MAP = {
        "check_attendance": [
            "attendance", "absent", "present",
            "percentage", "short attendance", "classes"
        ],
        "check_fee": [
            "fee", "voucher", "payment", "due",
            "fine", "challan", "pay"
        ],
        "check_result": [
            "result", "grade", "marks", "cgpa",
            "gpa", "exam result", "score"
        ],
        "check_schedule": [
            "schedule", "timetable", "class time",
            "when", "timing", "lecture time"
        ],
        "assignment_info": [
            "assignment", "submission", "deadline",
            "due date", "submit"
        ],
        "quiz_info": [
            "quiz", "test", "mcq", "practice"
        ],
        "contact_teacher": [
            "teacher", "instructor", "contact",
            "email teacher", "professor"
        ],
        "general_help": [
            "help", "hi", "hello", "what can you do",
            "how to", "guide", "support"
        ]
    }

    # Response templates
    RESPONSES = {
        "check_attendance": (
            "Your attendance information is available in the "
            "Attendance section of your dashboard. "
            "If below 75%, you may face shortage issues."
        ),
        "check_fee": (
            "You can view your fee vouchers and payment status "
            "in the Fee Management section. "
            "Contact admin if you have any payment issues."
        ),
        "check_result": (
            "Your results and grades are available in the "
            "Results section. CGPA is calculated based on "
            "all completed courses."
        ),
        "check_schedule": (
            "Your class schedule is available in your "
            "enrolled courses section. Each course shows "
            "the weekly schedule and room number."
        ),
        "assignment_info": (
            "Assignment details including deadlines are "
            "visible in each course's Assignment section. "
            "Make sure to submit before the due date."
        ),
        "quiz_info": (
            "You can attempt quizzes from your course page. "
            "AI Practice Quizzes are also available for "
            "self-practice anytime."
        ),
        "contact_teacher": (
            "You can find your teacher's contact information "
            "in the course details. Use the class chat group "
            "to message your teacher directly."
        ),
        "general_help": (
            "I can help you with: attendance, fee, results, "
            "schedule, assignments, and quizzes. "
            "Just ask me anything!"
        ),
        "unknown": (
            "I'm not sure I understand that. Could you rephrase? "
            "You can ask about attendance, fees, results, "
            "schedule, assignments, or quizzes."
        )
    }

    @staticmethod
    def detect_intent(message: str) -> tuple:
        message_lower = message.lower().strip()

        best_intent = "unknown"
        best_score = 0

        for intent, keywords in ChatbotEngine.INTENT_MAP.items():
            score = sum(
                1 for keyword in keywords
                if keyword in message_lower
            )
            if score > best_score:
                best_score = score
                best_intent = intent

        # Confidence calculate karo
        total_keywords = len(
            ChatbotEngine.INTENT_MAP.get(best_intent, [])
        )
        confidence = round(
            (best_score / total_keywords) if total_keywords > 0 else 0,
            3
        )

        if best_score == 0:
            return "unknown", 0.0

        return best_intent, min(confidence, 1.0)

    @staticmethod
    def get_response(intent: str) -> str:
        return ChatbotEngine.RESPONSES.get(
            intent,
            ChatbotEngine.RESPONSES["unknown"]
        )

    @staticmethod
    def search_faqs(db: Session, query: str) -> list:
        # Full text search on FAQs
        results = db.query(ChatbotFAQ).filter(
            ChatbotFAQ.is_active == True,
            or_(
                ChatbotFAQ.question.contains(query),
                ChatbotFAQ.answer.contains(query)
            )
        ).limit(3).all()
        return results

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

        # New session
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

    @staticmethod
    def process_message(
        db: Session,
        student_id: int,
        message: str,
        session_id: str = None
    ) -> dict:
        start_time = time.time()

        # Session get/create
        conversation = ChatbotEngine.get_or_create_session(
            db, student_id, session_id
        )

        # Intent detect karo
        intent, confidence = ChatbotEngine.detect_intent(message)

        # FAQ search bhi karo
        faq_results = ChatbotEngine.search_faqs(db, message)

        # Response decide karo
        if faq_results and confidence < 0.5:
            # FAQ se answer lao
            response = faq_results[0].answer
            faq_results[0].view_count += 1
            db.commit()
        else:
            response = ChatbotEngine.get_response(intent)

        # Response time
        response_time = int((time.time() - start_time) * 1000)

        # Intent DB se lao
        intent_obj = db.query(ChatbotIntent).filter(
            ChatbotIntent.intent_name == intent
        ).first()

        # Student message save karo
        student_msg = ChatbotMessage(
            conversation_id=conversation.id,
            sender="student",
            message=message,
            intent_id=intent_obj.id if intent_obj else None,
            confidence=confidence
        )
        db.add(student_msg)

        # Bot response save karo
        bot_msg = ChatbotMessage(
            conversation_id=conversation.id,
            sender="bot",
            message=response,
            intent_id=intent_obj.id if intent_obj else None,
            confidence=confidence,
            response_time_ms=response_time
        )
        db.add(bot_msg)

        # Conversation update karo
        conversation.total_messages += 2
        db.commit()

        return {
            "session_id": conversation.session_id,
            "intent": intent,
            "confidence": confidence,
            "response": response,
            "response_time_ms": response_time,
            "faq_suggestions": [{
                "id": f.id,
                "question": f.question,
                "answer": f.answer
            } for f in faq_results[:2]]
        }

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