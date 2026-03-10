"""
RAG Service (Retrieval-Augmented Generation)
FAQs aur student data ko vector store mein rakh ke relevant context dhundta hai
FAISS use karta hai fast similarity search ke liye
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
        2. Student ki personal data add karo
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
            # FAISS ke saath fast search
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
            # Fallback: numpy dot product
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
        """Student ki info ko readable context mein format karo"""
        name        = data.get("name", "Student")
        attendance  = data.get("attendance", "N/A")
        cgpa        = data.get("cgpa", "N/A")
        courses     = data.get("courses", [])
        pending_fee = data.get("pending_fee", "N/A")
        semester    = data.get("semester", "N/A")

        courses_str = ", ".join(courses) if courses else "N/A"

        return f"""Student Profile:
- Name: {name}
- Current Semester: {semester}
- CGPA: {cgpa}
- Overall Attendance: {attendance}%
- Pending Fee: {pending_fee}
- Enrolled Courses: {courses_str}"""