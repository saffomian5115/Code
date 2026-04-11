"""
API Keys Management Endpoint
Place at: backend/app/api/v1/endpoints/api_keys.py
Then add to router.py:
  from app.api.v1.endpoints import api_keys
  api_router.include_router(api_keys.router)
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import require_admin
from app.ai.api_key_manager import (
    get_all_keys_status, add_key, toggle_key,
    delete_key, reset_key_quota
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/admin/api-keys", tags=["API Key Management"])


class AddKeyRequest(BaseModel):
    key: str
    label: Optional[str] = None


@router.get("")
def list_keys(admin=Depends(require_admin)):
    keys = get_all_keys_status()
    available = sum(1 for k in keys if k["active"] and not k["quota_exceeded"])
    return success_response({
        "keys": keys,
        "total": len(keys),
        "available": available,
        "quota_exceeded": sum(1 for k in keys if k["quota_exceeded"]),
    }, "API keys retrieved")


@router.post("")
def create_key(request: AddKeyRequest, admin=Depends(require_admin)):
    if not request.key or len(request.key) < 10:
        return error_response("Invalid API key", "INVALID_KEY")
    result = add_key(request.key, request.label or "")
    if "error" in result:
        return error_response(result["error"], "DUPLICATE_KEY")
    return success_response({"id": result["id"], "label": result["label"]},
                            "API key added successfully", status_code=201)


@router.patch("/{key_id}/toggle")
def toggle(key_id: str, admin=Depends(require_admin)):
    new_state = toggle_key(key_id)
    status = "activated" if new_state else "deactivated"
    return success_response({"active": new_state}, f"Key {status}")


@router.patch("/{key_id}/reset-quota")
def reset_quota(key_id: str, admin=Depends(require_admin)):
    ok = reset_key_quota(key_id)
    if not ok:
        return error_response("Key not found", "NOT_FOUND", status_code=404)
    return success_response(message="Quota reset successfully")


@router.delete("/{key_id}")
def remove_key(key_id: str, admin=Depends(require_admin)):
    ok = delete_key(key_id)
    if not ok:
        return error_response("Key not found", "NOT_FOUND", status_code=404)
    return success_response(message="Key deleted successfully")