from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_teacher
from app.services.communication_service import NoticeBoardService
from app.schemas.communication import NoticeCreateRequest, NoticeUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/notices", tags=["Notice Board"])


@router.post("")
def create_notice(
    request: NoticeCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    notice, error = NoticeBoardService.create(
        db, request.model_dump(), posted_by=current_user.id
    )
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": notice.id,
        "title": notice.title,
        "category": notice.category,
        "expiry_date": str(notice.expiry_date) if notice.expiry_date else None,
        "posted_at": str(notice.posted_at)
    }, "Notice posted successfully", status_code=201)


@router.get("")
def get_notices(
    category: str = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notices, total = NoticeBoardService.get_all(
        db, category, is_public=True, page=page, per_page=per_page
    )
    data = [{
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "category": n.category,
        "expiry_date": str(n.expiry_date) if n.expiry_date else None,
        "file_attachments": n.file_attachments,
        "views": n.views,
        "posted_at": str(n.posted_at)
    } for n in notices]

    return success_response({
        "notices": data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    }, "Notices retrieved")


@router.get("/{notice_id}")
def get_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notice = NoticeBoardService.get_by_id(db, notice_id)
    if not notice:
        return error_response("Notice not found", "NOT_FOUND", status_code=404)

    # View count increment
    NoticeBoardService.increment_view(db, notice_id)

    return success_response({
        "id": notice.id,
        "title": notice.title,
        "content": notice.content,
        "category": notice.category,
        "file_attachments": notice.file_attachments,
        "expiry_date": str(notice.expiry_date) if notice.expiry_date else None,
        "views": notice.views + 1,
        "posted_by": notice.poster.teacher_profile.full_name
            if notice.poster and notice.poster.teacher_profile else None,
        "posted_at": str(notice.posted_at)
    })


@router.put("/{notice_id}")
def update_notice(
    notice_id: int,
    request: NoticeUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    notice, error = NoticeBoardService.update(
        db, notice_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Notice updated successfully")


@router.delete("/{notice_id}")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    success, error = NoticeBoardService.delete(db, notice_id)
    if not success:
        return error_response(error, "DELETE_FAILED", status_code=404)

    return success_response(message="Notice deleted successfully")