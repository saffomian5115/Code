from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.services.academic_service import CourseService
from app.schemas.academic import (
    CourseCreateRequest, CourseUpdateRequest, CLOCreateRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.post("")
def create_course(
    request: CourseCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    course, error = CourseService.create(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": course.id,
        "code": course.code,
        "name": course.name,
        "credit_hours": course.credit_hours
    }, "Course created successfully", status_code=201)

@router.get("")
def get_courses(
    department_id: int = None,
    program_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    courses = CourseService.get_all(db, department_id, program_id)
    data = [{
        "id": c.id,
        "code": c.code,
        "name": c.name,
        "credit_hours": c.credit_hours,
        "lecture_hours": c.lecture_hours,
        "lab_hours": c.lab_hours,
        "department_id": c.department_id,
        "department_name": c.department.name if c.department else None,
        "program_id": c.program_id,
        "program_name": c.program.name if c.program else None,
        "semester_level": c.semester_level,
        "is_elective": c.is_elective,
        "description": c.description,
    } for c in courses]

    return success_response({"courses": data}, "Courses retrieved")

@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    course = CourseService.get_by_id(db, course_id)
    if not course:
        return error_response("Course not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": course.id,
        "code": course.code,
        "name": course.name,
        "credit_hours": course.credit_hours,
        "lecture_hours": course.lecture_hours,
        "lab_hours": course.lab_hours,
        "description": course.description,
        "syllabus": course.syllabus,
        "department_name": course.department.name if course.department else None,
        "program_name": course.program.name if course.program else None,
        "semester_level": course.semester_level,
        "is_elective": course.is_elective,
        "total_clos": len(course.clos)
    })

@router.put("/{course_id}")
def update_course(
    course_id: int,
    request: CourseUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    course, error = CourseService.update(
        db, course_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Course updated successfully")

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    course = CourseService.get_by_id(db, course_id)
    if not course:
        return error_response("Course not found", "NOT_FOUND", status_code=404)
    try:
        db.delete(course)
        db.commit()
        return success_response(message="Course deleted successfully")
    except Exception:
        db.rollback()
        return error_response("Cannot delete — course may have linked offerings or enrollments", "DELETE_FAILED", status_code=400)

# ─── CLO Endpoints ──────────────────────────────────────

@router.post("/{course_id}/clos")
def add_clo(
    course_id: int,
    request: CLOCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    clo, error = CourseService.add_clo(db, course_id, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": clo.id,
        "clo_number": clo.clo_number,
        "description": clo.description,
        "domain": clo.domain,
        "level": clo.level
    }, "CLO added successfully", status_code=201)

@router.get("/{course_id}/clos")
def get_clos(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    clos = CourseService.get_clos(db, course_id)
    data = [{
        "id": c.id,
        "clo_number": c.clo_number,
        "description": c.description,
        "domain": c.domain,
        "level": c.level
    } for c in clos]

    return success_response({"clos": data}, "CLOs retrieved")

@router.delete("/{course_id}/clos/{clo_id}")
def delete_clo(
    course_id: int,
    clo_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    success, error = CourseService.delete_clo(db, clo_id)
    if not success:
        return error_response(error, "DELETE_FAILED", status_code=404)

    return success_response(message="CLO deleted successfully")

@router.put("/{course_id}/clos/{clo_id}")
def update_clo(
    course_id: int,
    clo_id: int,
    request: CLOCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    from app.models.academic import CourseCLO
    clo = db.query(CourseCLO).filter(
        CourseCLO.id == clo_id,
        CourseCLO.course_id == course_id
    ).first()
    if not clo:
        return error_response("CLO not found", "NOT_FOUND", status_code=404)
    data = request.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(clo, key, value)
    db.commit()
    db.refresh(clo)
    return success_response(message="CLO updated successfully")
