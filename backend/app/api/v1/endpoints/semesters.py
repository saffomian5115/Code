from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.services.academic_service import SemesterService
from app.schemas.academic import SemesterCreateRequest, SemesterUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/semesters", tags=["Semesters"])

@router.post("")
def create_semester(
    request: SemesterCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    semester, error = SemesterService.create(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": semester.id,
        "name": semester.name,
        "code": semester.code,
        "start_date": str(semester.start_date),
        "end_date": str(semester.end_date)
    }, "Semester created successfully", status_code=201)

@router.get("")
def get_semesters(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    semesters = SemesterService.get_all(db)
    data = [{
        "id": s.id,
        "name": s.name,
        "code": s.code,
        "start_date": str(s.start_date),
        "end_date": str(s.end_date),
        "is_active": s.is_active,
        "registration_start": str(s.registration_start) if s.registration_start else None,
        "registration_end": str(s.registration_end) if s.registration_end else None,
        "add_drop_last_date": str(s.add_drop_last_date) if s.add_drop_last_date else None
    } for s in semesters]

    return success_response({"semesters": data}, "Semesters retrieved")

@router.get("/active")
def get_active_semester(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    semester = SemesterService.get_active(db)
    if not semester:
        return error_response("No active semester found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": semester.id,
        "name": semester.name,
        "code": semester.code,
        "start_date": str(semester.start_date),
        "end_date": str(semester.end_date),
        "add_drop_last_date": str(semester.add_drop_last_date) if semester.add_drop_last_date else None
    }, "Active semester retrieved")

@router.get("/{semester_id}")
def get_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    semester = SemesterService.get_by_id(db, semester_id)
    if not semester:
        return error_response("Semester not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": semester.id,
        "name": semester.name,
        "code": semester.code,
        "start_date": str(semester.start_date),
        "end_date": str(semester.end_date),
        "is_active": semester.is_active
    })

@router.patch("/{semester_id}/activate")
def activate_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    semester, error = SemesterService.activate(db, semester_id)
    if error:
        return error_response(error, "NOT_FOUND", status_code=404)

    return success_response({
        "id": semester.id,
        "name": semester.name,
        "is_active": semester.is_active
    }, f"'{semester.name}' is now active semester")

@router.put("/{semester_id}")
def update_semester(
    semester_id: int,
    request: SemesterUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    semester, error = SemesterService.update(
        db, semester_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Semester updated successfully")