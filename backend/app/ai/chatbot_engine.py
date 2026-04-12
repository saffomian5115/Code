"""
Chatbot Engine — Upgraded Version
Real student data fetch karta hai DB se
HuggingFace Embeddings + FAISS RAG + Gemini LLM
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

    # ─── Real Student Data Fetch ─────────────────────────

    @staticmethod
    def get_student_data(db: Session, student_id: int) -> dict:
        """
        Student ki REAL info fetch karo DB se for RAG context.
        Attendance, CGPA, courses, fees — sab real data.
        """
        from app.models.user import User
        from app.models.enrollment import Enrollment, CourseOffering, StudentProgramEnrollment
        from app.models.attendance import AttendanceSummary
        from app.models.fee import FeeVoucher
        from app.models.academic import Semester

        # ── Basic Info ────────────────────────────────────
        # ── Basic Info ────────────────────────────────────
        try:
            user = db.query(User).filter(User.id == student_id).first()
            roll_number = user.roll_number if user and user.roll_number else "N/A"
            # full_name is in student_profile, not on User model directly
            if user and user.student_profile and user.student_profile.full_name:
                name = user.student_profile.full_name
            elif user and user.teacher_profile and user.teacher_profile.full_name:
                name = user.teacher_profile.full_name
            elif user and user.email:
                name = user.email.split('@')[0]
            else:
                name = "Student"
        except Exception as e:
            print(f"[ChatbotEngine] get_student_data basic info error: {e}")
            name = "Student"
            roll_number = "N/A"

        # ── Active Semester ───────────────────────────────
        try:
            active_sem = db.query(Semester).filter(Semester.is_active == True).first()
            semester_name = active_sem.name if active_sem else "Current Semester"
            semester_id = active_sem.id if active_sem else None
        except Exception:
            semester_name = "Current Semester"
            semester_id = None

        # ── Program / CGPA ────────────────────────────────
        try:
            prog_enrollment = db.query(StudentProgramEnrollment).filter(
                StudentProgramEnrollment.student_id == student_id,
                StudentProgramEnrollment.status == "active"
            ).first()
            program_name = prog_enrollment.program.name if prog_enrollment and prog_enrollment.program else "N/A"
            current_sem_num = prog_enrollment.current_semester if prog_enrollment else "N/A"
        except Exception:
            program_name = "N/A"
            current_sem_num = "N/A"

        # ── CGPA from completed enrollments ───────────────
        try:
            completed = db.query(Enrollment).filter(
                Enrollment.student_id == student_id,
                Enrollment.status == "completed",
                Enrollment.grade_points.isnot(None)
            ).all()
            if completed:
                total_pts = sum(
                    float(e.grade_points) * (
                        e.offering.course.credit_hours if e.offering and e.offering.course else 3
                    )
                    for e in completed
                )
                total_ch = sum(
                    e.offering.course.credit_hours if e.offering and e.offering.course else 3
                    for e in completed
                )
                cgpa = round(total_pts / total_ch, 2) if total_ch > 0 else "N/A"
            else:
                cgpa = "N/A"
        except Exception:
            cgpa = "N/A"

        # ── Current Enrolled Courses ──────────────────────
        try:
            enrollments = db.query(Enrollment).join(CourseOffering).filter(
                Enrollment.student_id == student_id,
                Enrollment.status == "enrolled"
            )
            if semester_id:
                enrollments = enrollments.filter(CourseOffering.semester_id == semester_id)
            enrollments = enrollments.all()

            courses_info = []
            for e in enrollments:
                if e.offering and e.offering.course:
                    c = e.offering.course
                    courses_info.append({
                        "name": c.name,
                        "code": c.code,
                        "credit_hours": c.credit_hours,
                        "offering_id": e.offering_id,
                        "enrollment_id": e.id,
                    })
            course_names = [c["name"] for c in courses_info]
        except Exception:
            courses_info = []
            course_names = []

        # ── Attendance per Course ─────────────────────────
        try:
            att_data = {}
            offering_ids = [c["offering_id"] for c in courses_info]
            if offering_ids:
                summaries = db.query(AttendanceSummary).filter(
                    AttendanceSummary.student_id == student_id,
                    AttendanceSummary.offering_id.in_(offering_ids)
                ).all()
                for s in summaries:
                    # Find course name for this offering
                    for c in courses_info:
                        if c["offering_id"] == s.offering_id:
                            att_data[c["name"]] = {
                                "percentage": float(s.percentage),
                                "total": s.total_classes,
                                "attended": s.attended_classes,
                                "alert": s.alert_triggered
                            }

            # Overall attendance
            if att_data:
                avg_att = round(
                    sum(v["percentage"] for v in att_data.values()) / len(att_data), 1
                )
            else:
                avg_att = "N/A"
        except Exception:
            att_data = {}
            avg_att = "N/A"

        # ── Short Attendance Courses ──────────────────────
        short_att_courses = [
            name for name, data in att_data.items()
            if data["percentage"] < 75
        ]

        # ── Fee / Vouchers ────────────────────────────────
        try:
            vouchers = db.query(FeeVoucher).filter(
                FeeVoucher.student_id == student_id
            ).all()
            unpaid = [v for v in vouchers if v.status in ("unpaid", "overdue", "partial")]
            pending_fee = sum(float(v.amount) + float(v.fine_amount or 0) for v in unpaid)
            overdue_count = sum(1 for v in vouchers if v.status == "overdue")
            pending_fee_str = f"Rs. {pending_fee:,.0f}" if pending_fee > 0 else "No pending fee"
        except Exception:
            pending_fee_str = "N/A"
            overdue_count = 0

        # ── Current Semester Grades ───────────────────────
        try:
            current_grades = {}
            if semester_id:
                sem_enrollments = db.query(Enrollment).join(CourseOffering).filter(
                    Enrollment.student_id == student_id,
                    CourseOffering.semester_id == semester_id,
                    Enrollment.grade_letter.isnot(None)
                ).all()
                for e in sem_enrollments:
                    if e.offering and e.offering.course:
                        current_grades[e.offering.course.name] = {
                            "grade": e.grade_letter,
                            "gpa_points": float(e.grade_points) if e.grade_points else None
                        }
        except Exception:
            current_grades = {}

        return {
            "name": name,
            "roll_number": roll_number,
            "program": program_name,
            "current_semester_number": current_sem_num,
            "current_semester_name": semester_name,
            "cgpa": cgpa,
            "overall_attendance": avg_att,
            "attendance_per_course": att_data,
            "short_attendance_courses": short_att_courses,
            "enrolled_courses": course_names,
            "courses_detail": courses_info,
            "pending_fee": pending_fee_str,
            "overdue_vouchers": overdue_count,
            "current_grades": current_grades,
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

        # 2. Real student data fetch karo (RAG context ke liye)
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