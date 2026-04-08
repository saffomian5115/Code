"""
RAG Service (Retrieval-Augmented Generation)
FAQs aur student data ko vector store mein rakh ke relevant context dhundta hai
FAISS use karta hai fast similarity search ke liye
Real student data ko properly format karta hai
"""
import numpy as np
from sqlalchemy.orm import Session

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[RAGService] Warning: faiss-cpu not installed. Using fallback cosine search.")

from app.ai.embedding_service import EmbeddingService
from app.models.ai_analytics import ChatbotFAQ


class RAGService:

    @staticmethod
    def build_context(db: Session, query: str, student_data: dict) -> str:
        """
        Student ke question ke liye relevant context tayyar karo:
        1. FAQs mein se top matches dhundho
        2. Student ki real personal data add karo
        """
        # FAQs fetch karo
        faqs = db.query(ChatbotFAQ).filter(
            ChatbotFAQ.is_active == True
        ).all()

        faq_context = ""
        if faqs:
            faq_context = RAGService._search_faqs(query, faqs)

        student_ctx = RAGService._format_student_data(student_data)

        parts = [student_ctx]
        if faq_context:
            parts.append(f"Relevant FAQs:\n{faq_context}")

        return "\n\n".join(parts)

    @staticmethod
    def _search_faqs(query: str, faqs: list, top_k: int = 3, threshold: float = 0.35) -> str:
        """FAQ list mein se query se similar entries dhundho"""
        if not faqs:
            return ""

        faq_texts = [f"{f.question} {f.answer}" for f in faqs]
        query_embedding = EmbeddingService.encode([query])
        faq_embeddings = EmbeddingService.encode(faq_texts)

        if FAISS_AVAILABLE:
            dim = faq_embeddings.shape[1]
            index = faiss.IndexFlatIP(dim)
            index.add(faq_embeddings.astype("float32"))
            scores, indices = index.search(query_embedding.astype("float32"), min(top_k, len(faqs)))
            results = [
                (faqs[idx], float(score))
                for score, idx in zip(scores[0], indices[0])
                if float(score) >= threshold
            ]
        else:
            scores = np.dot(faq_embeddings, query_embedding[0])
            top_indices = np.argsort(scores)[::-1][:top_k]
            results = [
                (faqs[i], float(scores[i]))
                for i in top_indices
                if float(scores[i]) >= threshold
            ]

        if not results:
            return ""

        lines = []
        for faq, score in results:
            lines.append(f"Q: {faq.question}\nA: {faq.answer}")

        return "\n\n".join(lines)

    @staticmethod
    def _format_student_data(data: dict) -> str:
        """Student ki real info ko readable context mein format karo"""
        name = data.get("name", "Student")
        roll = data.get("roll_number", "N/A")
        program = data.get("program", "N/A")
        sem_name = data.get("current_semester_name", "N/A")
        sem_num = data.get("current_semester_number", "N/A")
        cgpa = data.get("cgpa", "N/A")
        overall_att = data.get("overall_attendance", "N/A")
        pending_fee = data.get("pending_fee", "N/A")
        overdue = data.get("overdue_vouchers", 0)
        courses = data.get("enrolled_courses", [])
        att_per_course = data.get("attendance_per_course", {})
        short_att = data.get("short_attendance_courses", [])
        current_grades = data.get("current_grades", {})

        courses_str = ", ".join(courses) if courses else "N/A"

        # Attendance detail per course
        att_details = ""
        if att_per_course:
            att_lines = []
            for course, info in att_per_course.items():
                status = "⚠️ SHORT" if info["percentage"] < 75 else "✓ OK"
                att_lines.append(
                    f"  - {course}: {info['percentage']}% "
                    f"({info['attended']}/{info['total']} classes) {status}"
                )
            att_details = "\nAttendance per Course:\n" + "\n".join(att_lines)

        # Grades detail
        grades_detail = ""
        if current_grades:
            g_lines = []
            for course, g in current_grades.items():
                g_lines.append(f"  - {course}: {g['grade']} ({g['gpa_points']} GP)")
            grades_detail = "\nCurrent Grades:\n" + "\n".join(g_lines)

        # Short attendance warning
        short_warning = ""
        if short_att:
            short_warning = f"\n⚠️ SHORT ATTENDANCE (below 75%): {', '.join(short_att)}"

        # Fee warning
        fee_warning = ""
        if overdue > 0:
            fee_warning = f"\n⚠️ {overdue} overdue fee voucher(s)"

        context = f"""Student Profile:
- Name: {name}
- Roll Number: {roll}
- Program: {program}
- Semester: {sem_name} (Semester {sem_num})
- CGPA: {cgpa}
- Overall Attendance: {overall_att}%
- Enrolled Courses: {courses_str}
- Pending Fee: {pending_fee}{fee_warning}{att_details}{grades_detail}{short_warning}"""

        return context