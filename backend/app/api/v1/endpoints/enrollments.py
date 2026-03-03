from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user, require_teacher
from app.services.enrollment_service import EnrollmentService, StudentProgramService
from app.schemas.enrollment import (
    EnrollmentCreateRequest,
    EnrollmentApproveRequest,
    EnrollmentDropRequest,
    GradeEntryRequest,
    StudentProgramEnrollmentCreateRequest,
    StudentProgramEnrollmentUpdateRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Enrollments"])


# ─── COURSE ENROLLMENTS ─────────────────────────────────

@router.post("/enrollments")
def enroll_student(
    request: EnrollmentCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    enrollment, error = EnrollmentService.enroll(
        db, request.student_id, request.offering_id
    )
    if error:
        return error_response(error, "ENROLLMENT_FAILED")

    return success_response({
        "enrollment_id": enrollment.id,
        "student_id": enrollment.student_id,
        "offering_id": enrollment.offering_id,
        "status": enrollment.status,
        "is_approved": enrollment.is_approved
    }, "Student enrolled successfully", status_code=201)


@router.get("/enrollments/{enrollment_id}")
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollment = EnrollmentService.get_by_id(db, enrollment_id)
    if not enrollment:
        return error_response("Enrollment not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": enrollment.id,
        "student_id": enrollment.student_id,
        "offering_id": enrollment.offering_id,
        "status": enrollment.status,
        "is_approved": enrollment.is_approved,
        "grade_letter": enrollment.grade_letter,
        "grade_points": float(enrollment.grade_points) if enrollment.grade_points else None,
        "enrollment_date": str(enrollment.enrollment_date),
        "advisor_comments": enrollment.advisor_comments
    })


@router.patch("/enrollments/{enrollment_id}/approve")
def approve_enrollment(
    enrollment_id: int,
    request: EnrollmentApproveRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollment, error = EnrollmentService.approve(
        db, enrollment_id,
        approved_by=current_user.id,
        comments=request.comments
    )
    if error:
        return error_response(error, "APPROVE_FAILED")

    return success_response({
        "enrollment_id": enrollment.id,
        "is_approved": enrollment.is_approved,
        "approved_at": str(enrollment.approved_at)
    }, "Enrollment approved successfully")


@router.patch("/enrollments/{enrollment_id}/drop")
def drop_enrollment(
    enrollment_id: int,
    request: EnrollmentDropRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollment, error = EnrollmentService.drop(
        db, enrollment_id, reason=request.reason
    )
    if error:
        return error_response(error, "DROP_FAILED")

    return success_response({
        "enrollment_id": enrollment.id,
        "status": enrollment.status
    }, "Course dropped successfully")


@router.patch("/enrollments/{enrollment_id}/grade")
def enter_grade(
    enrollment_id: int,
    request: GradeEntryRequest,
    db: Session = Depends(get_db),
    teacher = Depends(require_teacher)
):
    enrollment, error = EnrollmentService.enter_grade(
        db, enrollment_id,
        grade_letter=request.grade_letter,
        grade_points=request.grade_points
    )
    if error:
        return error_response(error, "GRADE_ENTRY_FAILED")

    return success_response({
        "enrollment_id": enrollment.id,
        "grade_letter": enrollment.grade_letter,
        "grade_points": float(enrollment.grade_points),
        "status": enrollment.status
    }, "Grade entered successfully")


@router.get("/students/{student_id}/enrollments")
def get_student_enrollments(
    student_id: int,
    semester_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollments = EnrollmentService.get_student_enrollments(
        db, student_id, semester_id
    )
    data = [{
        "enrollment_id": e.id,
        "course_code": e.offering.course.code if e.offering and e.offering.course else None,
        "course_name": e.offering.course.name if e.offering and e.offering.course else None,
        "section": e.offering.section if e.offering else None,
        "instructor": e.offering.instructor.full_name if e.offering and e.offering.instructor else None,
        "credit_hours": e.offering.course.credit_hours if e.offering and e.offering.course else None,
        "status": e.status,
        "is_approved": e.is_approved,
        "grade_letter": e.grade_letter,
        "grade_points": float(e.grade_points) if e.grade_points else None
    } for e in enrollments]

    # CGPA bhi calculate karo
    cgpa = StudentProgramService.calculate_cgpa(db, student_id)

    return success_response({
        "student_id": student_id,
        "total_courses": len(data),
        "cgpa": cgpa,
        "enrollments": data
    }, "Student enrollments retrieved")


@router.get("/students/{student_id}/pending-approvals")
def get_pending_approvals(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollments = EnrollmentService.get_pending_approvals(db, student_id)
    data = [{
        "enrollment_id": e.id,
        "course_name": e.offering.course.name if e.offering and e.offering.course else None,
        "section": e.offering.section if e.offering else None,
        "enrollment_date": str(e.enrollment_date)
    } for e in enrollments]

    return success_response({
        "pending": data,
        "total": len(data)
    }, "Pending approvals retrieved")


# ─── PROGRAM ENROLLMENTS ────────────────────────────────

@router.post("/program-enrollments")
def enroll_in_program(
    request: StudentProgramEnrollmentCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    enrollment, error = StudentProgramService.enroll_in_program(
        db, request.model_dump()
    )
    if error:
        return error_response(error, "ENROLLMENT_FAILED")

    return success_response({
        "id": enrollment.id,
        "student_id": enrollment.student_id,
        "program_id": enrollment.program_id,
        "batch_year": enrollment.batch_year,
        "current_semester": enrollment.current_semester,
        "status": enrollment.status
    }, "Student enrolled in program successfully", status_code=201)


@router.get("/students/{student_id}/program")
def get_student_program(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollment = StudentProgramService.get_student_program(db, student_id)
    if not enrollment:
        return error_response(
            "No program enrollment found", "NOT_FOUND", status_code=404
        )

    return success_response({
        "id": enrollment.id,
        "student_id": enrollment.student_id,
        "program_name": enrollment.program.name if enrollment.program else None,
        "program_code": enrollment.program.code if enrollment.program else None,
        "batch_year": enrollment.batch_year,
        "current_semester": enrollment.current_semester,
        "status": enrollment.status,
        "advisor_name": enrollment.advisor.full_name if enrollment.advisor else None,
        "enrollment_date": str(enrollment.enrollment_date),
        "expected_graduation": str(enrollment.expected_graduation) if enrollment.expected_graduation else None
    })


@router.patch("/program-enrollments/{enrollment_id}")
def update_program_enrollment(
    enrollment_id: int,
    request: StudentProgramEnrollmentUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    enrollment, error = StudentProgramService.update(
        db, enrollment_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response({
        "id": enrollment.id,
        "current_semester": enrollment.current_semester,
        "status": enrollment.status
    }, "Program enrollment updated successfully")