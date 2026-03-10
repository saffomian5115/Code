"""
Gemini Service
Google Gemini 1.5 Flash LLM use karta hai smart responses ke liye.
RAG se mila context + student ka question = helpful answer
"""
import google.generativeai as genai
from app.core.config import settings

# API configure karo on import
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a helpful AI assistant for a university LMS (Learning Management System).
Your job is to help students with their academic queries.

You can help with:
- Attendance status and shortage warnings
- Fee payment and vouchers
- Results, grades, and CGPA
- Class schedules and timetables
- Assignments and submission deadlines
- Quizzes and practice tests
- Contacting teachers

Rules:
1. Use the provided Student Profile and FAQ context to give accurate answers.
2. If the student data is available, refer to it specifically (e.g., "Your attendance is 72%").
3. Be concise, friendly, and supportive.
4. If you dont know something, say so honestly and direct them to the relevant section.
5. IMPORTANT: Reply in the SAME language the student used (Urdu, English, or mixed).
6. Keep responses under 150 words unless detail is truly needed.
"""


class GeminiService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = genai.GenerativeModel("gemini-2.5-flash")
        return cls._model

    @classmethod
    def generate_response(cls, message: str, context: str) -> str:
        """
        Student ke message aur retrieved context ko
        Gemini ko deke smart response generate karo
        """
        if not settings.GEMINI_API_KEY:
            return cls._fallback_response()

        prompt = f"""{SYSTEM_PROMPT}

--- CONTEXT ---
{context}
--- END CONTEXT ---

Student: {message}
Assistant:"""

        try:
            model = cls.get_model()
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[GeminiService] Error: {e}")
            return cls._fallback_response()

    @staticmethod
    def _fallback_response() -> str:
        return (
            "I'm having trouble connecting to the AI service right now. "
            "Please check your attendance, fees, and results directly from the dashboard. "
            "Try again shortly!"
        )