from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.ai.face_recognition_engine import FaceRecognitionEngine
from app.services.attendance_service import CampusAttendanceService
from app.schemas.ai_analytics import FaceEnrollRequest, FaceVerifyRequest
from app.utils.response import success_response, error_response
from app.schemas.ai_analytics import FaceEnrollRequest, FaceVerifyRequest, GateAttendanceRequest

router = APIRouter(prefix="/face", tags=["Face Recognition"])


@router.post("/enroll")
def enroll_face(
    request: FaceEnrollRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    result = FaceRecognitionEngine.enroll_face(
        db=db,
        student_id=request.student_id,
        image_base64=request.image_base64
    )

    if not result["success"]:
        return error_response(
            result.get("error", "Enrollment failed"),
            "ENROLLMENT_FAILED"
        )

    return success_response({
        "student_id": result["student_id"],
        "enrolled_at": result["enrolled_at"],
        "processing_time_ms": result["processing_time_ms"]
    }, "Face enrolled successfully")


@router.post("/verify")
def verify_face(
    request: FaceVerifyRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Face recognize karo
    result = FaceRecognitionEngine.recognize_face(
        db=db,
        image_base64=request.image_base64,
        gate_id=request.gate_id,
        camera_id=request.camera_id
    )

    if not result.get("matched"):
        return success_response({
            "matched": False,
            "confidence": result.get("confidence", 0),
            "error": result.get("error")
        }, "Face not recognized")

    # Matched — campus attendance log karo
    attendance_data = {
        "student_id": result["student_id"],
        "gate_id": request.gate_id,
        "camera_id": request.camera_id,
        "entry_direction": request.entry_direction,
        "face_match_confidence": result["confidence"],
        "processing_time_ms": result["processing_time_ms"],
        "spoof_check_passed": result.get("spoof_check_passed", True),
        "liveness_score": result.get("liveness_score", 0.9)
    }

    record, error = CampusAttendanceService.log_entry(db, attendance_data)
    if error:
        return error_response(error, "ATTENDANCE_LOG_FAILED")

    return success_response({
        "matched": True,
        "student_id": result["student_id"],
        "confidence": result["confidence"],
        "processing_time_ms": result["processing_time_ms"],
        "attendance_logged": True,
        "attendance_id": record.id,
        "entry_direction": request.entry_direction,
        "duplicate_filtered": record.is_duplicate_filtered
    }, "Face verified and attendance logged")


@router.post("/ai-quiz/generate-ollama")
async def generate_quiz_ollama(
    course_id: int,
    topic: str,
    difficulty: str,
    num_questions: int = 5,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.services.ai_service import AIQuizOllamaService
    result, error = await AIQuizOllamaService.generate_with_ollama(
        db=db,
        student_id=current_user.id,
        course_id=course_id,
        topic=topic,
        difficulty=difficulty,
        num_questions=num_questions
    )
    if error:
        return error_response(error, "GENERATE_FAILED")

    return success_response(result, "AI Quiz generated with Ollama")

@router.post("/gate-attendance")
def gate_attendance(
    request: GateAttendanceRequest,
    db: Session = Depends(get_db)
    # NO auth — public kiosk endpoint
):
    """Gate camera se auto face attendance. Auth nahi chahiye."""

    # Step 1: Face recognize karo
    result = FaceRecognitionEngine.recognize_face(
        db=db,
        image_base64=request.image_base64,
        gate_id=request.gate_id,
        camera_id=request.camera_id
    )

    if not result.get("matched"):
        return success_response({
            "matched": False,
            "confidence": result.get("confidence", 0),
            "error": result.get("error", "Face not recognized")
        }, "Face not recognized")

    # Step 2: User ka full profile lao
    from app.models.user import User
    user = db.query(User).filter(User.id == result["user_id"]).first()
    if not user or not user.is_active:
        return error_response("User inactive", "USER_INACTIVE")

    full_name = None
    profile_picture_url = None
    roll_number = user.roll_number

    if user.student_profile:
        full_name = user.student_profile.full_name
        profile_picture_url = user.student_profile.profile_picture_url
    elif user.teacher_profile:
        full_name = user.teacher_profile.full_name
        profile_picture_url = user.teacher_profile.profile_picture_url
    elif user.admin_profile:
        full_name = user.admin_profile.full_name
        profile_picture_url = user.admin_profile.profile_picture_url

    # Step 3: Attendance log karo
    attendance_data = {
        "student_id": user.id,
        "gate_id": request.gate_id,
        "camera_id": request.camera_id,
        "entry_direction": request.entry_direction,
        "face_match_confidence": result["confidence"],
        "processing_time_ms": result["processing_time_ms"],
        "spoof_check_passed": True,
        "liveness_score": 0.9
    }

    record, error = CampusAttendanceService.log_entry(db, attendance_data)
    if error:
        return error_response(error, "ATTENDANCE_LOG_FAILED")

    return success_response({
        "matched": True,
        "duplicate": record.is_duplicate_filtered,
        "attendance_id": record.id,
        "user_id": user.id,
        "full_name": full_name,
        "roll_number": roll_number,
        "profile_picture_url": profile_picture_url,
        "role": user.role,
        "confidence": result["confidence"],
        "entry_direction": request.entry_direction,
        "entry_time": str(record.entry_time),
        "processing_time_ms": result["processing_time_ms"]
    }, "Attendance logged successfully")