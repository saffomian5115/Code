"""
Gemini Service
Google Gemini Flash LLM - university-scoped assistant
Subject topics explain karta hai, college boundaries enforce karta hai
"""
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are an AI assistant for a university LMS (Learning Management System). Your name is "LMS Assistant".

## YOUR ROLE
Help students with:
1. Personal academic data - attendance, fees, CGPA, results, assignments, quizzes, deadlines
2. Academic subject topics - explain concepts, theories, formulas from their enrolled courses
3. University processes - enrollment, semester system, grading, how things work
4. Study guidance - tips, how to improve, what to focus on

## STRICT RULES

### What you CAN discuss:
- Any academic subject topic (Math, Physics, CS, Business, Programming, etc.) - explain clearly
- Student's own LMS data (from the context provided)
- University rules, processes, academic calendar
- Study tips and academic help

### What you MUST NOT discuss:
- Politics, religion, personal opinions on controversial topics
- Entertainment, sports, movies, music, social media
- Dating, relationships, personal life advice
- Non-academic news or current events
- Any topic completely unrelated to university/academics

If asked something outside scope, say:
"Yeh topic meri scope se bahar hai. Main academic aur LMS-related help kar sakta hoon."

## RESPONSE STYLE
- Friendly, supportive, encouraging
- Match the student's language (Urdu/English/mix)
- For LMS data: use the actual numbers from student context
- For subject topics: clear explanation with example
- Concise (under 200 words unless complex topic needs more)

## SUBJECT EXPLANATION FORMAT
When explaining academic topics:
1. Simple 1-line definition
2. Core concept / formula
3. Practical example
4. Memory tip if helpful
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
        if not settings.GEMINI_API_KEY:
            return cls._fallback_response()

        prompt = f"""{SYSTEM_PROMPT}

--- STUDENT CONTEXT ---
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
            "Sorry, AI service se connection nahi ho raha. "
            "Apna attendance, fees, aur results dashboard se check karein. "
            "Thodi der baad try karein!"
        )