from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher, require_admin
from app.services.assessment_service import ExamService
from app.schemas.assessment import ExamCreateRequest, BulkExamResultRequest, ExamUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Exams"])


@router.post("/offerings/{offering_id}/exams")
def create_exam(
    offering_id: int,
    request: ExamCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    data = request.model_dump()
    data["offering_id"] = offering_id

    exam, error = ExamService.create(db, data, current_user.id)
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": exam.id,
        "exam_type": exam.exam_type,
        "title": exam.title,
        "total_marks": exam.total_marks,
        "weightage_percent": float(exam.weightage_percent),
        "exam_date": str(exam.exam_date) if exam.exam_date else None
    }, "Exam created successfully", status_code=201)


@router.get("/offerings/{offering_id}/exams")
def get_exams(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    exams = ExamService.get_offering_exams(db, offering_id)
    data = [{
        "id": e.id,
        "exam_type": e.exam_type,
        "title": e.title,
        "total_marks": e.total_marks,
        "weightage_percent": float(e.weightage_percent),
        "exam_date": str(e.exam_date) if e.exam_date else None,
        "start_time": str(e.start_time) if e.start_time else None,
        "room_number": e.room_number,
        "total_results": len(e.results)
    } for e in exams]

    return success_response({
        "offering_id": offering_id,
        "exams": data
    }, "Exams retrieved")

@router.put("/exams/{exam_id}")
def update_exam(
    exam_id: int,
    request: ExamUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    exam = ExamService.get_by_id(db, exam_id)
    if not exam:
        return error_response("Exam not found", "NOT_FOUND", status_code=404)

    update_data = request.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(exam, key, value)

    db.commit()
    db.refresh(exam)

    return success_response({
        "id": exam.id,
        "exam_type": exam.exam_type,
        "title": exam.title,
        "total_marks": exam.total_marks,
        "weightage_percent": float(exam.weightage_percent),
        "exam_date": str(exam.exam_date) if exam.exam_date else None,
        "start_time": str(exam.start_time) if exam.start_time else None,
        "end_time": str(exam.end_time) if exam.end_time else None,
        "room_number": exam.room_number
    }, "Exam updated successfully")


@router.post("/exams/{exam_id}/results")
def enter_results(
    exam_id: int,
    request: BulkExamResultRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    results_data = [r.model_dump() for r in request.results]
    results, error = ExamService.enter_bulk_results(
        db, exam_id, results_data, entered_by=current_user.id
    )
    if error:
        return error_response(error, "RESULT_ENTRY_FAILED")

    return success_response({
        "exam_id": exam_id,
        "total_entered": len(results)
    }, f"Results entered for {len(results)} students")


@router.get("/exams/{exam_id}/results")
def get_exam_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    exam = ExamService.get_by_id(db, exam_id)
    if not exam:
        return error_response("Exam not found", "NOT_FOUND", status_code=404)

    results = ExamService.get_exam_results(db, exam_id)
    data = [{
        "student_id": r.student_id,
        "roll_number": r.student.roll_number if r.student else None,
        "full_name": r.student.student_profile.full_name
            if r.student and r.student.student_profile else None,
        "obtained_marks": float(r.obtained_marks),
        "percentage": round(
            float(r.obtained_marks) / exam.total_marks * 100, 2
        ),
        "grade": r.grade,
        "remarks": r.remarks
    } for r in results]

    # Stats
    if data:
        marks_list = [r["obtained_marks"] for r in data]
        stats = {
            "highest": max(marks_list),
            "lowest": min(marks_list),
            "average": round(sum(marks_list) / len(marks_list), 2),
            "pass_count": sum(1 for r in results if r.grade != "F"),
            "fail_count": sum(1 for r in results if r.grade == "F")
        }
    else:
        stats = {}

    return success_response({
        "exam_id": exam_id,
        "exam_title": exam.title,
        "total_marks": exam.total_marks,
        "total_results": len(data),
        "stats": stats,
        "results": data
    }, "Exam results retrieved")


@router.get("/students/{student_id}/results")
def get_student_semester_results(
    student_id: int,
    semester_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = ExamService.get_student_semester_results(
        db, student_id, semester_id
    )
    data = [{
        "exam_type": r.exam.exam_type,
        "course_name": r.exam.offering.course.name
            if r.exam and r.exam.offering and r.exam.offering.course else None,
        "total_marks": r.exam.total_marks if r.exam else None,
        "obtained_marks": float(r.obtained_marks),
        "grade": r.grade,
        "weightage": float(r.exam.weightage_percent) if r.exam else None
    } for r in results]

    return success_response({
        "student_id": student_id,
        "semester_id": semester_id,
        "results": data
    }, "Student results retrieved")