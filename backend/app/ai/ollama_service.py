import httpx
import json
from typing import Optional


class OllamaService:
    """
    Ollama local LLM se MCQ generate karne ka service.
    Model: mistral ya llama3
    """

    BASE_URL = "http://localhost:11434"
    MODEL = "mistral"   # Ya "llama3"

    @staticmethod
    async def is_available() -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{OllamaService.BASE_URL}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

    @staticmethod
    async def generate_mcqs(
        topic: str,
        difficulty: str,
        num_questions: int = 5,
        course_context: str = ""
    ) -> list:

        prompt = f"""Generate {num_questions} multiple choice questions about "{topic}".
Difficulty level: {difficulty}
{f'Course context: {course_context}' if course_context else ''}

Return ONLY a valid JSON array in this exact format (no extra text):
[
  {{
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Brief explanation why this is correct"
  }}
]

Generate exactly {num_questions} questions."""

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{OllamaService.BASE_URL}/api/generate",
                    json={
                        "model": OllamaService.MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9
                        }
                    }
                )

                if response.status_code != 200:
                    return OllamaService._fallback_questions(
                        topic, difficulty, num_questions
                    )

                result = response.json()
                raw_text = result.get("response", "")

                # JSON extract karo
                questions = OllamaService._parse_questions(raw_text)

                if not questions:
                    return OllamaService._fallback_questions(
                        topic, difficulty, num_questions
                    )

                return questions

        except Exception as e:
            print(f"Ollama error: {e}")
            return OllamaService._fallback_questions(
                topic, difficulty, num_questions
            )

    @staticmethod
    def _parse_questions(raw_text: str) -> list:
        try:
            # JSON array dhundo
            start = raw_text.find("[")
            end = raw_text.rfind("]") + 1
            if start == -1 or end == 0:
                return []

            json_str = raw_text[start:end]
            questions = json.loads(json_str)

            # Validate karo
            validated = []
            for i, q in enumerate(questions):
                if all(k in q for k in ["question", "options", "correct_answer"]):
                    validated.append({
                        "id": i + 1,
                        "question": q["question"],
                        "options": q["options"][:4],
                        "correct_answer": q["correct_answer"],
                        "explanation": q.get("explanation", "")
                    })

            return validated

        except json.JSONDecodeError:
            return []

    @staticmethod
    def _fallback_questions(
        topic: str,
        difficulty: str,
        num_questions: int
    ) -> list:
        # Ollama available nahi — placeholder
        questions = []
        for i in range(1, num_questions + 1):
            questions.append({
                "id": i,
                "question": f"[{difficulty.upper()}] Question {i} about {topic}?",
                "options": [
                    f"Option A for Q{i}",
                    f"Option B for Q{i}",
                    f"Option C for Q{i}",
                    f"Option D for Q{i}"
                ],
                "correct_answer": f"Option A for Q{i}",
                "explanation": f"This is a placeholder question. "
                               f"Install Ollama for AI-generated questions."
            })
        return questions