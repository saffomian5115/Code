from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_teacher
from app.services.communication_service import AnnouncementService
from app.schemas.communication import (
    AnnouncementCreateRequest, AnnouncementUpdateRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/announcements", tags=["Announcements"])


# ✅ FIX #3: require_teacher → require_admin (admin page se create hota hai)
@router.post("")
def create_announcement(
    request: AnnouncementCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    announcement, error = AnnouncementService.create(
        db, request.model_dump(), created_by=current_user.id
    )
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": announcement.id,
        "title": announcement.title,
        "priority": announcement.priority,
        "target_type": announcement.target_type,
        "created_at": str(announcement.created_at)
    }, "Announcement created successfully", status_code=201)


@router.get("")
def get_announcements(
    target_type: str = None,
    target_id: int = None,
    priority: str = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    announcements, total = AnnouncementService.get_all(
        db, target_type, target_id, priority, page, per_page
    )
    data = [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "priority": a.priority,
        "target_type": a.target_type,
        "target_id": a.target_id,
        "attachment_url": a.attachment_url,
        "pinned_until": str(a.pinned_until) if a.pinned_until else None,
        "created_by_name": a.creator.student_profile.full_name
            if a.creator and a.creator.student_profile
            else (a.creator.teacher_profile.full_name
            if a.creator and a.creator.teacher_profile
            else (a.creator.admin_profile.full_name
            if a.creator and a.creator.admin_profile else None)),
        "created_at": str(a.created_at)
    } for a in announcements]

    return success_response({
        "announcements": data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    }, "Announcements retrieved")


@router.get("/pinned")
def get_pinned_announcements(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    announcements = AnnouncementService.get_pinned(db)
    data = [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "priority": a.priority,
        "pinned_until": str(a.pinned_until),
        "created_at": str(a.created_at)
    } for a in announcements]

    return success_response({
        "pinned_count": len(data),
        "announcements": data
    }, "Pinned announcements retrieved")


@router.get("/my")
def get_my_announcements(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Student ke liye relevant announcements
    announcements = AnnouncementService.get_for_student(db, current_user.id)
    data = [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "priority": a.priority,
        "target_type": a.target_type,
        "attachment_url": a.attachment_url,
        "created_at": str(a.created_at)
    } for a in announcements]

    return success_response({
        "total": len(data),
        "announcements": data
    }, "Your announcements retrieved")


@router.get("/{announcement_id}")
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    announcement = AnnouncementService.get_by_id(db, announcement_id)
    if not announcement:
        return error_response(
            "Announcement not found", "NOT_FOUND", status_code=404
        )

    return success_response({
        "id": announcement.id,
        "title": announcement.title,
        "content": announcement.content,
        "priority": announcement.priority,
        "target_type": announcement.target_type,
        "target_id": announcement.target_id,
        "attachment_url": announcement.attachment_url,
        "pinned_until": str(announcement.pinned_until)
            if announcement.pinned_until else None,
        "created_at": str(announcement.created_at),
        "updated_at": str(announcement.updated_at)
    })


# ✅ FIX #3: require_teacher → require_admin
@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: int,
    request: AnnouncementUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    announcement, error = AnnouncementService.update(
        db, announcement_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Announcement updated successfully")


# ✅ FIX #3: require_teacher → require_admin
@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    success, error = AnnouncementService.delete(db, announcement_id)
    if not success:
        return error_response(error, "DELETE_FAILED", status_code=404)

    return success_response(message="Announcement deleted successfully")