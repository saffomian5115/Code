from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_teacher
from app.services.ai_service import AnalyticsService
from app.schemas.ai_analytics import AnalyticsCalculateRequest, BulkAnalyticsRequest
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/analytics", tags=["AI Analytics"])


@router.post("/calculate")
def calculate_student_score(
    request: AnalyticsCalculateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    score, error = AnalyticsService.calculate_and_save(
        db, request.student_id, request.semester_id
    )
    if error:
        return error_response(error, "CALCULATION_FAILED")

    return success_response({
        "student_id": score.student_id,
        "semester_id": score.semester_id,
        "academic_score": float(score.academic_score),
        "consistency_index": float(score.consistency_index),
        "engagement_level": score.engagement_level,
        "trend_direction": score.trend_direction,
        "class_rank": score.class_rank,
        "risk_prediction": score.risk_prediction,
        "weak_subjects": score.weak_subjects,
        "recommendations": score.recommendations,
        "score_breakdown": score.score_breakdown,
        "calculated_at": str(score.calculated_at)
    }, "Analytics calculated successfully")


@router.get("/students/{student_id}")
def get_student_analytics(
    student_id: int,
    semester_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    score = AnalyticsService.get_student_score(db, student_id, semester_id)

    if not score:
        # Calculate karo agar exist nahi karta
        score, error = AnalyticsService.calculate_and_save(
            db, student_id, semester_id
        )
        if error:
            return error_response(error, "NOT_FOUND", status_code=404)

    return success_response({
        "student_id": score.student_id,
        "semester_id": score.semester_id,
        "academic_score": float(score.academic_score),
        "consistency_index": float(score.consistency_index),
        "engagement_level": score.engagement_level,
        "trend_direction": score.trend_direction,
        "class_rank": score.class_rank,
        "section_rank": score.section_rank,
        "risk_prediction": score.risk_prediction,
        "weak_subjects": score.weak_subjects,
        "recommendations": score.recommendations,
        "score_breakdown": score.score_breakdown,
        "calculated_at": str(score.calculated_at)
    }, "Student analytics retrieved")


@router.get("/semester/{semester_id}/leaderboard")
def get_leaderboard(
    semester_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    scores = AnalyticsService.get_all_scores(db, semester_id)

    data = [{
        "rank": i + 1,
        "student_id": s.student_id,
        "roll_number": s.student.roll_number if s.student else None,
        "full_name": s.student.student_profile.full_name
            if s.student and s.student.student_profile else None,
        "academic_score": float(s.academic_score),
        "engagement_level": s.engagement_level,
        "trend_direction": s.trend_direction
    } for i, s in enumerate(scores[:limit])]

    return success_response({
        "semester_id": semester_id,
        "total_students": len(scores),
        "leaderboard": data
    }, "Leaderboard retrieved")


@router.get("/semester/{semester_id}/at-risk")
def get_at_risk_students(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    scores = AnalyticsService.get_all_scores(db, semester_id)
    at_risk = [
        s for s in scores
        if s.risk_prediction and s.risk_prediction.get("at_risk")
    ]

    data = [{
        "student_id": s.student_id,
        "roll_number": s.student.roll_number if s.student else None,
        "full_name": s.student.student_profile.full_name
            if s.student and s.student.student_profile else None,
        "academic_score": float(s.academic_score),
        "risk_level": s.risk_prediction.get("level"),
        "risk_factors": s.risk_prediction.get("factors", []),
        "engagement_level": s.engagement_level
    } for s in at_risk]

    return success_response({
        "semester_id": semester_id,
        "at_risk_count": len(data),
        "students": data
    }, "At-risk students retrieved")


@router.patch("/semester/{semester_id}/calculate-ranks")
def calculate_ranks(
    semester_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    count = AnalyticsService.calculate_ranks(db, semester_id)
    return success_response({
        "semester_id": semester_id,
        "students_ranked": count
    }, f"Ranks calculated for {count} students")