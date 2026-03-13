from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user, require_teacher
from app.services.user_service import UserService
from app.services.enrollment_service import OfferingService
from app.schemas.user import TeacherCreateRequest, TeacherUpdateRequest, UpdateProfileRequest
from app.utils.response import success_response, error_response
from app.models.user import User

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.get("/me")
def get_teacher_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    teacher = UserService.get_teacher_by_id(db, current_user.id)
    if not teacher:
        return error_response("Teacher profile not found", "NOT_FOUND", status_code=404)

    p = teacher.teacher_profile
    return success_response({
        "user_id": teacher.id,
        "email": teacher.email,
        "is_active": teacher.is_active,
        "employee_id": p.employee_id if p else None,
        "full_name": p.full_name if p else None,
        "designation": p.designation if p else None,
        "qualification": p.qualification if p else None,
        "specialization": p.specialization if p else None,
        "joining_date": str(p.joining_date) if p and p.joining_date else None,
        "phone": p.phone if p else None,
        "cnic": p.cnic if p else None,
        "address": p.address if p else None,
    }, "Profile retrieved")


@router.put("/me")
def update_teacher_me(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    teacher, error = UserService.update_teacher(
        db, current_user.id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)
    return success_response(message="Profile updated successfully")


@router.get("/me/offerings")
def get_teacher_offerings(
    semester_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    offerings = OfferingService.get_all(db, semester_id=semester_id, instructor_id=current_user.id)
    data = [{
        "id": o.id,
        "course_code": o.course.code if o.course else None,
        "course_name": o.course.name if o.course else None,
        "section": o.section,
        "semester_name": o.semester.name if o.semester else None,
        "enrolled_students": o.enrolled_students,
        "max_students": o.max_students,
        "room_number": o.room_number,
        "is_active": o.is_active,
        "schedule": o.schedule_json
    } for o in offerings]

    return success_response({"offerings": data}, "Offerings retrieved")


@router.post("")
def create_teacher(
    request: TeacherCreateRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result, error = UserService.create_teacher(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "user_id": result["user"].id,
        "employee_id": result["user"].teacher_profile.employee_id,
        "email": result["user"].email,
        "temp_password": result["temp_password"],
        "message": "Share this temp password with teacher"
    }, "Teacher created successfully", status_code=201)


@router.get("")
def get_teachers(
    page: int = 1,
    per_page: int = 20,
    search: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    teachers, total = UserService.get_teachers(db, page, per_page, search)

    teachers_data = []
    for t in teachers:
        p = t.teacher_profile
        teachers_data.append({
            "user_id": t.id,
            "email": t.email,
            "is_active": t.is_active,
            "employee_id": p.employee_id if p else None,
            "full_name": p.full_name if p else None,
            "designation": p.designation if p else None,
            "specialization": p.specialization if p else None,
            "qualification": p.qualification if p else None,
            "phone": p.phone if p else None,
            "cnic": p.cnic if p else None,
            "joining_date": str(p.joining_date) if p and p.joining_date else None,
        })

    return success_response({
        "teachers": teachers_data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    }, "Teachers retrieved successfully")


@router.get("/{teacher_id}")
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    teacher = UserService.get_teacher_by_id(db, teacher_id)
    if not teacher:
        return error_response("Teacher not found", "NOT_FOUND", status_code=404)

    p = teacher.teacher_profile
    return success_response({
        "user_id": teacher.id,
        "email": teacher.email,
        "is_active": teacher.is_active,
        "employee_id": p.employee_id if p else None,
        "full_name": p.full_name if p else None,
        "designation": p.designation if p else None,
        "qualification": p.qualification if p else None,
        "specialization": p.specialization if p else None,
        "joining_date": str(p.joining_date) if p and p.joining_date else None,
        "phone": p.phone if p else None,
        "cnic": p.cnic if p else None,
        "address": p.address if p else None,
    }, "Teacher retrieved successfully")


@router.put("/{teacher_id}")
def update_teacher(
    teacher_id: int,
    request: TeacherUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    teacher, error = UserService.update_teacher(
        db, teacher_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)
    return success_response(message="Teacher updated successfully")


@router.patch("/{teacher_id}/status")
def toggle_teacher_status(
    teacher_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    teacher, error = UserService.toggle_teacher_status(db, teacher_id)
    if error:
        return error_response(error, "NOT_FOUND", status_code=404)

    status = "activated" if teacher.is_active else "deactivated"
    return success_response(
        {"is_active": teacher.is_active},
        f"Teacher {status} successfully"
    )

@router.delete("/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    from app.models.user import User
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.role == "teacher"
    ).first()
    if not teacher:
        return error_response("Teacher not found", "NOT_FOUND", status_code=404)
    try:
        db.execute(
            __import__('sqlalchemy').text("DELETE FROM users WHERE id = :id"),
            {"id": teacher_id}
        )
        db.commit()
        return success_response(message="Teacher deleted successfully")
    except Exception as e:
        db.rollback()
        return error_response(str(e), "DELETE_FAILED", status_code=400)