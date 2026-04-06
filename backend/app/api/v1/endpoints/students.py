from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user, require_student
from app.services.user_service import UserService
from app.services.enrollment_service import EnrollmentService, StudentProgramService
from app.services.ai_service import AnalyticsService
from app.services.fee_service import VoucherService, PaymentService
from app.schemas.user import StudentCreateRequest, StudentUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me")
def get_student_me(
    db: Session = Depends(get_db),
    current_user = Depends(require_student)
):
    student = UserService.get_student_by_id(db, current_user.id)
    if not student:
        return error_response("Student profile not found", "NOT_FOUND", status_code=404)
    
    p = student.student_profile
    return success_response({
        "user_id": student.id,
        "roll_number": student.roll_number,
        "email": student.email,
        "is_active": student.is_active,
        "profile": {
            "full_name": p.full_name if p else None,
            "father_name": p.father_name if p else None,
            "date_of_birth": str(p.date_of_birth) if p and p.date_of_birth else None,
            "gender": p.gender if p else None,
            "cnic": p.cnic if p else None,
            "phone": p.phone if p else None,
            "city": p.city if p else None,
            "current_address": p.current_address if p else None,
            "guardian_phone": p.guardian_phone if p else None,
            "guardian_relation": p.guardian_relation if p else None,
        }
    }, "Profile retrieved")


@router.get("/me/analytics")
def get_my_analytics(
    semester_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_student)
):
    if not semester_id:
        from app.models.academic import Semester
        current_sem = db.query(Semester).filter(Semester.is_active == True).first()
        if not current_sem:
            return error_response("No active semester found", "NOT_FOUND", status_code=404)
        semester_id = current_sem.id

    score = AnalyticsService.get_student_score(db, current_user.id, semester_id)
    if not score:
        score, error = AnalyticsService.calculate_and_save(db, current_user.id, semester_id)
        if error:
            return error_response(error, "ANALYTICS_FAILED")

    return success_response({
        "academic_score": float(score.academic_score),
        "consistency_index": float(score.consistency_index),
        "engagement_level": score.engagement_level,
        "trend_direction": score.trend_direction,
        "class_rank": score.class_rank,
        "recommendations": score.recommendations,
        "score_breakdown": score.score_breakdown
    }, "Analytics retrieved")


@router.get("/me/enrollments")
def get_my_enrollments(
    semester_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_student)
):
    enrollments = EnrollmentService.get_student_enrollments(db, current_user.id, semester_id)

    # CGPA calculate karo
    cgpa = StudentProgramService.calculate_cgpa(db, current_user.id)

    data = [{
        "enrollment_id": e.id,
        "offering_id": e.offering_id,
        "course_id": e.offering.course.id if e.offering and e.offering.course else None,
        "course_code": e.offering.course.code if e.offering and e.offering.course else None,
        "course_name": e.offering.course.name if e.offering and e.offering.course else None,
        "credit_hours": e.offering.course.credit_hours if e.offering and e.offering.course else None,
        "section": e.offering.section if e.offering else None,
        # FIX: semester_id aur semester_name add kiye gaye
        "semester_id": e.offering.semester_id if e.offering else None,
        "semester_name": e.offering.semester.name if e.offering and e.offering.semester else None,
        "instructor": e.offering.instructor.full_name if e.offering and e.offering.instructor else None,
        "status": e.status,
        "is_approved": e.is_approved,
        "grade_letter": e.grade_letter,
        "grade_points": float(e.grade_points) if e.grade_points else None,
    } for e in enrollments]

    return success_response({
        "total": len(data),
        "cgpa": cgpa,
        "enrollments": data
    }, "Enrollments retrieved")


@router.get("/me/vouchers")
def get_my_vouchers(
    db: Session = Depends(get_db),
    current_user = Depends(require_student)
):
    vouchers = VoucherService.get_student_vouchers(db, current_user.id)
    summary = PaymentService.get_fee_summary(db, current_user.id)
    
    data = [{
        "id": v.id,
        "voucher_number": v.voucher_number,
        "amount": float(v.amount),
        "status": v.status,
        "due_date": str(v.due_date)
    } for v in vouchers]
    
    return success_response({
        "fee_summary": summary,
        "vouchers": data
    }, "Vouchers retrieved")


@router.post("")
def create_student(
    request: StudentCreateRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result, error = UserService.create_student(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "user_id": result["user"].id,
        "roll_number": result["user"].roll_number,
        "email": result["user"].email,
        "temp_password": result["temp_password"],
        "message": "Share this temp password with student"
    }, "Student created successfully", status_code=201)


@router.get("")
def get_students(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    students, total = UserService.get_students(db, page, per_page, search)

    students_data = []
    for s in students:
        p = s.student_profile
        students_data.append({
            "user_id": s.id,
            "roll_number": s.roll_number,
            "email": s.email,
            "full_name": p.full_name if p else None,
            "father_name": p.father_name if p else None,
            "phone": p.phone if p else None,
            "gender": p.gender if p else None,
            "city": p.city if p else None,
            "cnic": p.cnic if p else None,
            "is_active": s.is_active,
            "created_at": str(s.created_at),
        })

    return success_response({
        "students": students_data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    }, "Students retrieved successfully")


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    student = UserService.get_student_by_id(db, student_id)
    if not student:
        return error_response("Student not found", "NOT_FOUND", status_code=404)

    p = student.student_profile
    return success_response({
        "user_id": student.id,
        "roll_number": student.roll_number,
        "email": student.email,
        "is_active": student.is_active,
        "created_at": str(student.created_at),
        "profile": {
            "full_name": p.full_name if p else None,
            "father_name": p.father_name if p else None,
            "date_of_birth": str(p.date_of_birth) if p and p.date_of_birth else None,
            "gender": p.gender if p else None,
            "cnic": p.cnic if p else None,
            "phone": p.phone if p else None,
            "city": p.city if p else None,
            "current_address": p.current_address if p else None,
            "guardian_phone": p.guardian_phone if p else None,
            "guardian_relation": p.guardian_relation if p else None,
        }
    }, "Student retrieved")


@router.put("/{student_id}")
def update_student(
    student_id: int,
    request: StudentUpdateRequest,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user, error = UserService.update_student(
        db, student_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    p = user.student_profile
    return success_response({
        "user_id": user.id,
        "full_name": p.full_name if p else None,
    }, "Student updated successfully")


@router.patch("/{student_id}/status")
def toggle_status(
    student_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user, error = UserService.toggle_student_status(db, student_id)
    if error:
        return error_response(error, "TOGGLE_FAILED", status_code=404)
    return success_response({
        "user_id": user.id,
        "is_active": user.is_active
    }, f"Student {'activated' if user.is_active else 'deactivated'}")

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    from app.models.user import User
    student = db.query(User).filter(
        User.id == student_id,
        User.role == "student"
    ).first()
    if not student:
        return error_response("Student not found", "NOT_FOUND", status_code=404)
    try:
        db.execute(
            __import__('sqlalchemy').text("DELETE FROM users WHERE id = :id"),
            {"id": student_id}
        )
        db.commit()
        return success_response(message="Student deleted successfully")
    except Exception as e:
        db.rollback()
        return error_response(str(e), "DELETE_FAILED", status_code=400)