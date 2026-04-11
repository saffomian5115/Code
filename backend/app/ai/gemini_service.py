"""
Gemini Service — Final Fixed Version
Uses google-generativeai (your existing package) with key rotation.
Replace: backend/app/ai/gemini_service.py
"""
import re
import os
import json
import time
import threading
from app.core.config import settings

# ─── Key file path ────────────────────────────────────────────
KEYS_FILE = os.path.join(os.path.dirname(__file__), "gemini_keys.json")
_lock = threading.Lock()

SYSTEM_PROMPT = """You are an AI assistant for a university LMS (Learning Management System). Your name is "LMS Assistant".

Help students with:
1. Personal academic data - attendance, fees, CGPA, results, assignments, quizzes, deadlines  
2. Academic subject topics - explain concepts from their enrolled courses
3. University processes - enrollment, semester system, grading
4. Study guidance

Strict rules - Do NOT discuss: politics, religion, entertainment, sports, dating, non-academic topics.

Response style:
- Friendly and supportive
- Match student language (Urdu/English/mix)  
- Use actual data from student context
- Keep responses concise (under 200 words)
"""

# ─── Key Management (embedded — no separate import needed) ─────

def _load_keys() -> list:
    """Load keys from JSON file, create from .env if not exists"""
    if not os.path.exists(KEYS_FILE):
        env_key = settings.GEMINI_API_KEY
        if env_key:
            data = [{
                "id": "default",
                "key": env_key,
                "label": "Default (.env Key)",
                "active": True,
                "quota_exceeded_until": 0,
                "requests_today": 0,
                "quota_hit_count": 0,
                "last_reset": time.strftime("%Y-%m-%d")
            }]
            _save_keys(data)
            return data
        return []
    try:
        with open(KEYS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


def _save_keys(keys: list):
    try:
        with open(KEYS_FILE, "w") as f:
            json.dump(keys, f, indent=2)
    except Exception as e:
        print(f"[GeminiService] Cannot save keys: {e}")


def _get_available_key() -> str | None:
    """Return key with fewest requests today that is not quota-exceeded"""
    with _lock:
        keys = _load_keys()
        if not keys:
            return None

        now   = time.time()
        today = time.strftime("%Y-%m-%d")

        # Reset daily counts
        for k in keys:
            if k.get("last_reset", "") != today:
                k["requests_today"] = 0
                k["last_reset"]     = today
                k["quota_exceeded_until"] = 0
        _save_keys(keys)

        # Filter: active + not quota-exceeded
        available = [
            k for k in keys
            if k.get("active", True)
            and k.get("quota_exceeded_until", 0) < now
        ]

        if not available:
            # All exceeded — return least-exceeded one as last resort
            active = [k for k in keys if k.get("active", True)]
            if active:
                return min(active, key=lambda x: x.get("quota_exceeded_until", 0))["key"]
            return None

        # Pick key with fewest requests today (load balancing)
        available.sort(key=lambda x: x.get("requests_today", 0))
        return available[0]["key"]


def _mark_quota_exceeded(api_key: str, retry_seconds: int = 86400):
    with _lock:
        keys = _load_keys()
        for k in keys:
            if k["key"] == api_key:
                k["quota_exceeded_until"] = time.time() + retry_seconds
                k["quota_hit_count"]      = k.get("quota_hit_count", 0) + 1
                print(f"[GeminiService] Key ...{api_key[-8:]} marked exceeded for {retry_seconds}s")
                break
        _save_keys(keys)


def _increment_count(api_key: str):
    with _lock:
        keys  = _load_keys()
        today = time.strftime("%Y-%m-%d")
        for k in keys:
            if k["key"] == api_key:
                if k.get("last_reset", "") != today:
                    k["requests_today"] = 0
                    k["last_reset"]     = today
                k["requests_today"] = k.get("requests_today", 0) + 1
                break
        _save_keys(keys)


# ─── Gemini Client ────────────────────────────────────────────

def _make_client(api_key: str):
    """Create a Gemini client — tries new package, falls back to old"""
    try:
        from google import genai
        return ("new", genai.Client(api_key=api_key))
    except ImportError:
        pass
    try:
        import google.generativeai as genai_old
        genai_old.configure(api_key=api_key)
        return ("old", genai_old.GenerativeModel("gemini-2.0-flash"))
    except ImportError:
        return (None, None)


def _call_gemini(client_tuple, prompt: str) -> str:
    kind, client = client_tuple
    if kind == "new":
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    elif kind == "old":
        response = client.generate_content(prompt)
        return response.text.strip()
    raise RuntimeError("No Gemini package available")


# ─── Main Service ─────────────────────────────────────────────

class GeminiService:
    MAX_RETRIES = 8   # try up to 8 different keys

    @classmethod
    def generate_response(cls, message: str, context: str) -> str:
        if not settings.GEMINI_API_KEY and not os.path.exists(KEYS_FILE):
            return cls._fallback_response()

        prompt = f"""{SYSTEM_PROMPT}

--- STUDENT CONTEXT ---
{context}
--- END CONTEXT ---

Student: {message}
Assistant:"""

        tried_keys = set()

        for attempt in range(cls.MAX_RETRIES):
            api_key = _get_available_key()

            if not api_key or api_key in tried_keys:
                print(f"[GeminiService] No new keys available after {attempt} attempts")
                break

            tried_keys.add(api_key)

            try:
                client_tuple = _make_client(api_key)
                if client_tuple[0] is None:
                    print("[GeminiService] No Gemini package installed")
                    return cls._fallback_response()

                result = _call_gemini(client_tuple, prompt)
                _increment_count(api_key)
                print(f"[GeminiService] OK — key ...{api_key[-8:]}, attempt {attempt+1}")
                return result

            except Exception as e:
                err = str(e)
                print(f"[GeminiService] Error attempt {attempt+1} key ...{api_key[-8:]}: {err[:120]}")

                # Parse retry delay from error message
                retry_sec = 86400  # default: 24 hours (daily quota)
                match = re.search(r"retry_delay\s*\{[\s\S]*?seconds:\s*(\d+)", err)
                if match:
                    retry_sec = int(match.group(1)) + 10  # add buffer

                is_quota = any(x in err.lower() for x in [
                    "429", "quota", "rate limit", "resource_exhausted",
                    "exceeded", "too many requests", "rateerror"
                ])

                if is_quota:
                    _mark_quota_exceeded(api_key, retry_seconds=retry_sec)
                    # Continue loop → try next key
                    continue
                else:
                    # Non-quota error (network, invalid key, etc.) — stop
                    print(f"[GeminiService] Non-quota error, stopping: {err[:80]}")
                    break

        return cls._fallback_response()

    @staticmethod
    def _fallback_response() -> str:
        return (
            "Maafi chahta hoon, AI service abhi available nahi hai. "
            "Apni attendance, fees aur results dashboard se check karein. "
            "Thodi der baad dobara try karein!"
        )