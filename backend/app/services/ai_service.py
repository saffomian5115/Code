from sqlalchemy.orm import Session
from app.ai.analytics_engine import AnalyticsEngine
from app.ai.chatbot_engine import ChatbotEngine
from app.ai.face_recognition_engine import FaceRecognitionEngine
from app.ai.ollama_service import OllamaService
from app.models.ai_analytics import (
    StudentPerformanceScore, ChatbotFAQ
)
from app.models.enrollment import CourseOffering
from app.models.assessment import AIQuiz


class AnalyticsService:

    @staticmethod
    def calculate_and_save(db: Session, student_id: int, semester_id: int):
        data = AnalyticsEngine.calculate_for_student(
            db, student_id, semester_id
        )
        score = AnalyticsEngine.save_score(db, data)
        return score, None

    @staticmethod
    def get_student_score(db: Session, student_id: int, semester_id: int):
        return db.query(StudentPerformanceScore).filter(
            StudentPerformanceScore.student_id == student_id,
            StudentPerformanceScore.semester_id == semester_id
        ).first()

    @staticmethod
    def get_all_scores(db: Session, semester_id: int):
        return db.query(StudentPerformanceScore).filter(
            StudentPerformanceScore.semester_id == semester_id
        ).order_by(
            StudentPerformanceScore.academic_score.desc()
        ).all()

    @staticmethod
    def calculate_ranks(db: Session, semester_id: int):
        count = AnalyticsEngine.calculate_ranks(db, semester_id)
        return count


class FAQService:

    @staticmethod
    def create(db: Session, data: dict):
        faq = ChatbotFAQ(**data)
        db.add(faq)
        db.commit()
        db.refresh(faq)
        return faq, None

    @staticmethod
    def get_all(db: Session, category: str = None):
        query = db.query(ChatbotFAQ).filter(ChatbotFAQ.is_active == True)
        if category:
            query = query.filter(ChatbotFAQ.category == category)
        return query.order_by(ChatbotFAQ.view_count.desc()).all()

    @staticmethod
    def get_by_id(db: Session, faq_id: int):
        return db.query(ChatbotFAQ).filter(
            ChatbotFAQ.id == faq_id
        ).first()

    @staticmethod
    def update(db: Session, faq_id: int, data: dict):
        faq = db.query(ChatbotFAQ).filter(ChatbotFAQ.id == faq_id).first()
        if not faq:
            return None, "FAQ not found"
        for key, value in data.items():
            setattr(faq, key, value)
        db.commit()
        db.refresh(faq)
        return faq, None

    @staticmethod
    def vote(db: Session, faq_id: int, helpful: bool):
        faq = db.query(ChatbotFAQ).filter(ChatbotFAQ.id == faq_id).first()
        if not faq:
            return None, "FAQ not found"
        if helpful:
            faq.helpful_count += 1
        else:
            faq.not_helpful_count += 1
        db.commit()
        return faq, None

    @staticmethod
    def search(db: Session, query: str):
        return ChatbotEngine.search_faqs(db, query)


class AIQuizOllamaService:

    @staticmethod
    async def generate_with_ollama(
        db: Session,
        student_id: int,
        course_id: int,
        topic: str,
        difficulty: str,
        num_questions: int = 5
    ):
        # Course name lao context ke liye
        from app.models.academic import Course
        course = db.query(Course).filter(Course.id == course_id).first()
        course_context = course.name if course else ""

        # Ollama se generate karo
        questions = await OllamaService.generate_mcqs(
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions,
            course_context=course_context
        )

        # DB mein save karo
        ai_quiz = AIQuiz(
            student_id=student_id,
            course_id=course_id,
            topic=topic,
            difficulty=difficulty,
            questions_generated=questions
        )
        db.add(ai_quiz)
        db.commit()
        db.refresh(ai_quiz)

        return {
            "ai_quiz_id": ai_quiz.id,
            "topic": topic,
            "difficulty": difficulty,
            "total_questions": len(questions),
            "questions": questions,
            "ollama_used": await OllamaService.is_available()
        }, None