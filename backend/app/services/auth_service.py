from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.user import User
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token
)

class AuthService:

    @staticmethod
    def login(db: Session, email: str, password: str):
        user = db.query(User).filter(User.email == email).first()

        if not user:
            return None, "Invalid email or password"
        if not user.is_active:
            return None, "Account is deactivated. Contact admin"
        if not verify_password(password, user.password_hash):
            return None, "Invalid email or password"

        full_name = AuthService._get_full_name(user)
        profile_picture_url = AuthService._get_profile_picture(user)

        token_data = {"sub": str(user.id), "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        user.last_login = datetime.now(timezone.utc)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
            "full_name": full_name,
            "profile_picture_url": profile_picture_url,   # ← NAYA
        }, None

    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str):
        if not verify_password(current_password, user.password_hash):
            return False, "Current password is incorrect"
        user.password_hash = hash_password(new_password)
        db.commit()
        return True, None

    @staticmethod
    def _get_full_name(user: User) -> str:
        if user.student_profile:
            return user.student_profile.full_name
        elif user.teacher_profile:
            return user.teacher_profile.full_name
        elif user.admin_profile:
            return user.admin_profile.full_name
        return user.email

    @staticmethod
    def _get_profile_picture(user: User):
        if user.student_profile:
            return user.student_profile.profile_picture_url
        elif user.teacher_profile:
            return user.teacher_profile.profile_picture_url
        elif user.admin_profile:
            return user.admin_profile.profile_picture_url
        return None

    @staticmethod
    def generate_temp_password(role: str = "student") -> str:
        # Simple readable passwords
        if role == "teacher":
            return "teacher123"
        return "user123"