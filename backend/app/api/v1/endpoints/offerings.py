from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user, require_teacher
from app.services.enrollment_service import OfferingService
from app.schemas.enrollment import CourseOfferingCreateRequest, CourseOfferingUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/offerings", tags=["Course Offerings"])


@router.post("")
def create_offering(
    request: CourseOfferingCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    offering, error = OfferingService.create(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": offering.id,
        "course_id": offering.course_id,
        "section": offering.section,
        "semester_id": offering.semester_id,
        "instructor_id": offering.instructor_id,
        "max_students": offering.max_students
    }, "Course offering created successfully", status_code=201)


@router.get("")
def get_offerings(
    semester_id: int = None,
    instructor_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    offerings = OfferingService.get_all(db, semester_id, instructor_id)
    data = [{
        "id": o.id,
        "course_code": o.course.code if o.course else None,
        "course_name": o.course.name if o.course else None,
        "section": o.section,
        "semester_name": o.semester.name if o.semester else None,
        "instructor_name": o.instructor.full_name if o.instructor else None,
        "enrolled_students": o.enrolled_students,
        "max_students": o.max_students,
        "room_number": o.room_number,
        "is_active": o.is_active,
        "schedule": o.schedule_json
    } for o in offerings]

    return success_response({"offerings": data}, "Offerings retrieved")


@router.get("/{offering_id}")
def get_offering(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    offering = OfferingService.get_by_id(db, offering_id)
    if not offering:
        return error_response("Offering not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": offering.id,
        "course": {
            "id": offering.course.id,
            "code": offering.course.code,
            "name": offering.course.name,
            "credit_hours": offering.course.credit_hours
        } if offering.course else None,
        "semester": {
            "id": offering.semester.id,
            "name": offering.semester.name
        } if offering.semester else None,
        "instructor": {
            "id": offering.instructor.user_id,
            "name": offering.instructor.full_name
        } if offering.instructor else None,
        "section": offering.section,
        "max_students": offering.max_students,
        "enrolled_students": offering.enrolled_students,
        "room_number": offering.room_number,
        "lab_number": offering.lab_number,
        "schedule": offering.schedule_json,
        "online_meet_link": offering.online_meet_link,
        "is_active": offering.is_active
    })


@router.put("/{offering_id}")
def update_offering(
    offering_id: int,
    request: CourseOfferingUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    offering, error = OfferingService.update(
        db, offering_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Offering updated successfully")


@router.get("/{offering_id}/students")
def get_enrolled_students(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    enrollments = OfferingService.get_enrolled_students(db, offering_id)
    data = [{
        "enrollment_id": e.id,
        "student_id": e.student_id,
        "roll_number": e.student.roll_number if e.student else None,
        "full_name": e.student.student_profile.full_name if e.student and e.student.student_profile else None,
        "status": e.status,
        "is_approved": e.is_approved,
        "enrollment_date": str(e.enrollment_date)
    } for e in enrollments]

    return success_response({
        "offering_id": offering_id,
        "total": len(data),
        "students": data
    }, "Enrolled students retrieved")