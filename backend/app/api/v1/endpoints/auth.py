import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.schemas.user import (
    LoginRequest, ChangePasswordRequest,
    RefreshTokenRequest, UpdateProfileRequest,
    FaceLoginRequest, FaceEnrollRequest,         
)
from app.utils.response import success_response, error_response
from app.models.user import User
from app.ai.face_recognition_engine import FaceRecognitionEngine  
from app.core.security import create_access_token, create_refresh_token  
from datetime import datetime, timezone  

router = APIRouter(prefix="/auth", tags=["Authentication"])

UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── Helper: profile data extract ───────────────────────
def _build_profile(user: User) -> dict:
    base = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "face_enrolled": user.face_embedding is not None,  # ← NEW
        "last_login": str(user.last_login) if user.last_login else None,
        "created_at": str(user.created_at) if user.created_at else None,
    }

    if user.role == "student" and user.student_profile:
        p = user.student_profile
        base.update({
            "full_name": p.full_name,
            "phone": p.phone,
            "profile_picture_url": p.profile_picture_url,
            "roll_number": user.roll_number,
            "father_name": p.father_name,
            "date_of_birth": str(p.date_of_birth) if p.date_of_birth else None,
            "gender": p.gender,
            "cnic": p.cnic,
            "city": p.city,
            "current_address": p.current_address,
            "guardian_phone": p.guardian_phone,
        })

    elif user.role == "teacher" and user.teacher_profile:
        p = user.teacher_profile
        base.update({
            "full_name": p.full_name,
            "phone": p.phone,
            "profile_picture_url": p.profile_picture_url,
            "employee_id": p.employee_id,
            "designation": p.designation,
            "qualification": p.qualification,
            "specialization": p.specialization,
            "joining_date": str(p.joining_date) if p.joining_date else None,
            "cnic": p.cnic,
            "address": p.address,
        })

    elif user.role == "admin" and user.admin_profile:
        p = user.admin_profile
        base.update({
            "full_name": p.full_name,
            "phone": p.phone,
            "profile_picture_url": p.profile_picture_url,
            "employee_id": p.employee_id,
            "designation": p.designation,
            "role_type": p.role_type,
        })
    else:
        base["full_name"] = user.email

    return base


# ─── ENDPOINTS ──────────────────────────────────────────

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    result, error = AuthService.login(db, request.email, request.password)
    if error:
        return error_response(error, "LOGIN_FAILED", status_code=401)
    return success_response(result, "Login successful")


# ─── FACE LOGIN ─────────────────────────────────────────
@router.post("/face-login")
def face_login(request: FaceLoginRequest, db: Session = Depends(get_db)):
    result = FaceRecognitionEngine.login_by_face(
        db=db,
        image_base64=request.image_base64
    )

    if not result["success"]:
        return error_response(
            result.get("error", "Face not recognized"),
            "FACE_LOGIN_FAILED",
            status_code=401
        )

    user = db.query(User).filter(User.id == result["user_id"]).first()
    if not user or not user.is_active:
        return error_response("User not found or inactive", "USER_INACTIVE", status_code=401)

    token_data = {"sub": str(user.id), "role": user.role}
    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    full_name           = AuthService._get_full_name(user)
    profile_picture_url = AuthService._get_profile_picture(user)

    return success_response({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": full_name,
        "profile_picture_url": profile_picture_url,
        "face_confidence": result.get("confidence"),
        "processing_time_ms": result.get("processing_time_ms"),
    }, "Face login successful")


# ─── FACE ENROLL (Profile page se) ──────────────────────
@router.post("/enroll-face")
def enroll_face_self(
    request: FaceEnrollRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
   
    result = FaceRecognitionEngine.enroll_face(
        db=db,
        user_id=current_user.id,
        image_base64=request.image_base64
    )

    if not result["success"]:
        return error_response(result.get("error", "Enrollment failed"), "ENROLL_FAILED")

    return success_response({
        "user_id": result["user_id"],
        "enrolled_at": result["enrolled_at"],
        "processing_time_ms": result["processing_time_ms"],
    }, "Face enrolled successfully")


@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user.id).first()
    return success_response(_build_profile(user), "Profile retrieved")


@router.put("/profile")
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user, error = AuthService.update_profile(db, current_user, request.model_dump(exclude_none=True))
    if error:
        return error_response(error, "UPDATE_FAILED")
    return success_response(_build_profile(user), "Profile updated successfully")


@router.post("/profile/upload-picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        return error_response("Only JPEG/PNG/WebP allowed", "INVALID_FILE")

    ext = file.filename.rsplit(".", 1)[-1]
    filename = f"user_{current_user.id}_{int(datetime.now().timestamp())}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    url = f"/uploads/avatars/{filename}"

    # Profile mein save karo
    if current_user.role == "student" and current_user.student_profile:
        current_user.student_profile.profile_picture_url = url
    elif current_user.role == "teacher" and current_user.teacher_profile:
        current_user.teacher_profile.profile_picture_url = url
    elif current_user.role == "admin" and current_user.admin_profile:
        current_user.admin_profile.profile_picture_url = url

    db.commit()
    return success_response({"profile_picture_url": url}, "Profile picture uploaded")


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success, error = AuthService.change_password(
        db, current_user, request.current_password, request.new_password
    )
    if not success:
        return error_response(error, "PASSWORD_CHANGE_FAILED")
    return success_response({}, "Password changed successfully")


@router.post("/refresh-token")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    from app.core.security import decode_token
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        return error_response("Invalid refresh token", "INVALID_TOKEN", status_code=401)

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        return error_response("User not found", "USER_NOT_FOUND", status_code=401)

    token_data = {"sub": str(user.id), "role": user.role}
    new_access_token = create_access_token(token_data)

    return success_response({"access_token": new_access_token}, "Token refreshed")