"""
API Key Manager — reads/writes gemini_keys.json
Place at: backend/app/ai/api_key_manager.py

This is now a thin wrapper — actual logic is in gemini_service.py
to avoid circular imports. This file only exposes the admin API functions.
"""
import os
import json
import time
import uuid
import threading

KEYS_FILE = os.path.join(os.path.dirname(__file__), "gemini_keys.json")
_lock = threading.Lock()


def _load() -> list:
    if not os.path.exists(KEYS_FILE):
        return []
    try:
        with open(KEYS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


def _save(keys: list):
    with open(KEYS_FILE, "w") as f:
        json.dump(keys, f, indent=2)


def get_all_keys_status() -> list:
    keys  = _load()
    now   = time.time()
    today = time.strftime("%Y-%m-%d")
    result = []
    for k in keys:
        exceeded = k.get("quota_exceeded_until", 0) > now
        cooldown = max(0, int(k.get("quota_exceeded_until", 0) - now))
        requests = k.get("requests_today", 0) if k.get("last_reset") == today else 0
        result.append({
            "id":                   k.get("id", k["key"][-8:]),
            "label":                k.get("label", "Unnamed"),
            "key_preview":          "..." + k["key"][-8:],
            "active":               k.get("active", True),
            "quota_exceeded":       exceeded,
            "cooldown_seconds_left": cooldown,
            "requests_today":       requests,
            "quota_hit_count":      k.get("quota_hit_count", 0),
        })
    return result


def add_key(key: str, label: str) -> dict:
    with _lock:
        keys = _load()
        for k in keys:
            if k["key"] == key:
                return {"error": "Key already exists"}
        entry = {
            "id":                  str(uuid.uuid4())[:8],
            "key":                 key,
            "label":               label or f"Key {len(keys)+1}",
            "active":              True,
            "quota_exceeded_until": 0,
            "requests_today":      0,
            "quota_hit_count":     0,
            "last_reset":          time.strftime("%Y-%m-%d"),
        }
        keys.append(entry)
        _save(keys)
        return entry


def toggle_key(key_id: str) -> bool:
    with _lock:
        keys = _load()
        for k in keys:
            if k.get("id") == key_id or k["key"][-8:] == key_id:
                k["active"] = not k.get("active", True)
                _save(keys)
                return k["active"]
    return False


def delete_key(key_id: str) -> bool:
    with _lock:
        keys   = _load()
        before = len(keys)
        keys   = [k for k in keys
                  if k.get("id") != key_id and k["key"][-8:] != key_id]
        if len(keys) < before:
            _save(keys)
            return True
    return False


def reset_key_quota(key_id: str) -> bool:
    with _lock:
        keys = _load()
        for k in keys:
            if k.get("id") == key_id or k["key"][-8:] == key_id:
                k["quota_exceeded_until"] = 0
                k["requests_today"]       = 0
                k["last_reset"]           = time.strftime("%Y-%m-%d")
                _save(keys)
                return True
    return False