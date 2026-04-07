"""
assignments.py  (UPDATED)
Added two new endpoints at the bottom:
  POST /assignments/{id}/check-plagiarism  → run check
  GET  /assignments/{id}/plagiarism-report → read saved results
All existing routes unchanged.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form
import os
import shutil
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher
from app.services.assessment_service import AssignmentService
from app.schemas.assessment import (
    AssignmentCreateRequest, AssignmentUpdateRequest,
    AssignmentSubmitRequest, GradeSubmissionRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Assignments"])

# ─── Helper: Convert server file_path → public URL ─────────────────────────────
def _file_path_to_url(file_path: str | None) -> str | None:
    if not file_path:
        return None
    file_path = file_path.replace("\\", "/")
    if file_path.startswith("./"):
        file_path = file_path[2:]
    if not file_path.startswith("/"):
        file_path = "/" + file_path
    return file_path


def _file_name_from_path(file_path: str | None) -> str | None:
    if not file_path:
        return None
    return os.path.basename(file_path)


# ────────────────────────────────────────────────────────────────────────────
# CREATE ASSIGNMENT
# ────────────────────────────────────────────────────────────────────────────
@router.post("/offerings/{offering_id}/assignments")
def create_assignment(
    offering_id: int,
    request: AssignmentCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    data = request.model_dump()
    data["offering_id"] = offering_id

    assignment, error = AssignmentService.create(db, data, current_user.id)
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": assignment.id,
        "title": assignment.title,
        "total_marks": assignment.total_marks,
        "due_date": str(assignment.due_date),
        "weightage_percent": float(assignment.weightage_percent)
    }, "Assignment created successfully", status_code=201)


# ────────────────────────────────────────────────────────────────────────────
# LIST ASSIGNMENTS FOR AN OFFERING
# ────────────────────────────────────────────────────────────────────────────
@router.get("/offerings/{offering_id}/assignments")
def get_assignments(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    assignments = AssignmentService.get_offering_assignments(db, offering_id)
    data = [{
        "id": a.id,
        "title": a.title,
        "total_marks": a.total_marks,
        "weightage_percent": float(a.weightage_percent),
        "due_date": str(a.due_date),
        "file_required": a.file_required,
        "allowed_file_types": a.allowed_file_types,
        "total_submissions": len(a.submissions)
    } for a in assignments]

    return success_response({
        "offering_id": offering_id,
        "total": len(data),
        "assignments": data
    }, "Assignments retrieved")


# ────────────────────────────────────────────────────────────────────────────
# GET SINGLE ASSIGNMENT
# ────────────────────────────────────────────────────────────────────────────
@router.get("/assignments/{assignment_id}")
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    assignment = AssignmentService.get_by_id(db, assignment_id)
    if not assignment:
        return error_response("Assignment not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "total_marks": assignment.total_marks,
        "weightage_percent": float(assignment.weightage_percent),
        "due_date": str(assignment.due_date),
        "file_required": assignment.file_required,
        "max_file_size": assignment.max_file_size,
        "allowed_file_types": assignment.allowed_file_types,
        "plagiarism_check": assignment.plagiarism_check,
        "total_submissions": len(assignment.submissions)
    })


# ────────────────────────────────────────────────────────────────────────────
# UPDATE ASSIGNMENT
# ────────────────────────────────────────────────────────────────────────────
@router.put("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: int,
    request: AssignmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    assignment, error = AssignmentService.update(
        db, assignment_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Assignment updated successfully")


# ────────────────────────────────────────────────────────────────────────────
# STUDENT SUBMIT ASSIGNMENT
# ────────────────────────────────────────────────────────────────────────────
@router.post("/assignments/{assignment_id}/submit")
def submit_assignment(
    assignment_id: int,
    file: UploadFile = File(...),
    notes: str = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    upload_dir = "uploads/assignments"
    os.makedirs(upload_dir, exist_ok=True)

    original_filename = os.path.basename(file.filename or "submission")
    stored_filename = f"student_{current_user.id}_assign_{assignment_id}_{original_filename}"
    file_path = f"{upload_dir}/{stored_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    data = {
        "file_path": file_path,
        "remarks": notes
    }

    submission, error = AssignmentService.submit(
        db, assignment_id, current_user.id, data
    )
    if error:
        return error_response(error, "SUBMIT_FAILED")

    return success_response({
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student_id": submission.student_id,
        "submission_date": str(submission.submission_date),
        "status": submission.status,
        "file_path": submission.file_path,
        "file_url": _file_path_to_url(submission.file_path),
        "file_name": original_filename,
    }, "Assignment submitted successfully", status_code=201)


# ────────────────────────────────────────────────────────────────────────────
# TEACHER VIEW SUBMISSIONS
# ────────────────────────────────────────────────────────────────────────────
@router.get("/assignments/{assignment_id}/submissions")
def get_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    submissions = AssignmentService.get_submissions(db, assignment_id)
    data = []
    for s in submissions:
        data.append({
            "id": s.id,
            "student_id": s.student_id,
            "roll_number": s.student.roll_number if s.student else None,
            "full_name": (
                s.student.student_profile.full_name
                if s.student and s.student.student_profile else None
            ),
            "submission_date": str(s.submission_date),
            "status": s.status,
            "obtained_marks": float(s.obtained_marks) if s.obtained_marks else None,
            "feedback": s.feedback,
            "plagiarism_percentage": (
                float(s.plagiarism_percentage) if s.plagiarism_percentage else None
            ),
            "plagiarism_status": s.plagiarism_status,
            "plagiarism_data": s.plagiarism_data,
            "file_url": _file_path_to_url(s.file_path),
            "file_name": _file_name_from_path(s.file_path),
        })

    return success_response({
        "assignment_id": assignment_id,
        "total": len(data),
        "graded": sum(1 for s in submissions if s.status == "graded"),
        "pending": sum(1 for s in submissions if s.status == "submitted"),
        "submissions": data
    }, "Submissions retrieved")


# ────────────────────────────────────────────────────────────────────────────
# GRADE SUBMISSION
# ────────────────────────────────────────────────────────────────────────────
@router.patch("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    request: GradeSubmissionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    submission, error = AssignmentService.grade_submission(
        db,
        submission_id,
        obtained_marks=request.obtained_marks,
        feedback=request.feedback,
        graded_by=current_user.id,
        status=request.status
    )
    if error:
        return error_response(error, "GRADE_FAILED")

    return success_response({
        "submission_id": submission.id,
        "obtained_marks": float(submission.obtained_marks),
        "feedback": submission.feedback,
        "status": submission.status,
        "graded_at": str(submission.graded_at)
    }, "Submission graded successfully")


# ────────────────────────────────────────────────────────────────────────────
# STUDENT VIEW THEIR OWN SUBMISSIONS
# ────────────────────────────────────────────────────────────────────────────
@router.get("/students/{student_id}/submissions")
def get_student_submissions(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role == "student" and current_user.id != student_id:
        return error_response("Access denied", "FORBIDDEN", 403)

    from app.models.assessment import AssignmentSubmission, Assignment

    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == student_id
    ).order_by(AssignmentSubmission.submission_date.desc()).all()

    result = []
    for sub in submissions:
        assignment = db.query(Assignment).filter(
            Assignment.id == sub.assignment_id
        ).first()
        result.append({
            "submission_id": sub.id,
            "assignment_id": sub.assignment_id,
            "assignment_title": assignment.title if assignment else None,
            "offering_id": assignment.offering_id if assignment else None,
            "submission_date": str(sub.submission_date),
            "status": sub.status,
            "obtained_marks": float(sub.obtained_marks) if sub.obtained_marks else None,
            "total_marks": assignment.total_marks if assignment else None,
            "feedback": sub.feedback,
            "plagiarism_percentage": (
                float(sub.plagiarism_percentage) if sub.plagiarism_percentage else None
            ),
            "file_url": _file_path_to_url(sub.file_path),
            "file_name": _file_name_from_path(sub.file_path),
        })

    return success_response({
        "student_id": student_id,
        "total": len(result),
        "submissions": result
    }, "Student submissions retrieved")


# ────────────────────────────────────────────────────────────────────────────
# DELETE ASSIGNMENT
# ────────────────────────────────────────────────────────────────────────────
@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    success, error, status_code = AssignmentService.delete(db, assignment_id)
    if error:
        return error_response(error, "DELETE_FAILED", status_code=status_code)

    return success_response(message="Assignment deleted successfully")


# ════════════════════════════════════════════════════════════════════════════
# ✅ NEW — PLAGIARISM ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@router.post("/assignments/{assignment_id}/check-plagiarism")
async def check_plagiarism(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    """
    Run internal plagiarism check for all submissions of an assignment.
    Compares every student's file against every other student's file.
    Saves results to DB and returns summary + pair details.
    
    This can take a few seconds depending on number of submissions.
    """
    from app.services.plagiarism_service import PlagiarismService
    import asyncio

    # Run in executor so it doesn't block the event loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        PlagiarismService.run_for_assignment,
        db,
        assignment_id
    )

    if "error" in result:
        return error_response(result["error"], "PLAGIARISM_FAILED", status_code=404)

    return success_response(result, "Plagiarism check completed")


@router.get("/assignments/{assignment_id}/plagiarism-report")
def get_plagiarism_report(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    """
    Return previously computed plagiarism results for an assignment.
    No re-computation — reads from DB directly.
    """
    from app.services.plagiarism_service import PlagiarismService

    report = PlagiarismService.get_assignment_report(db, assignment_id)
    return success_response(report, "Plagiarism report retrieved")