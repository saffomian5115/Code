from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, StudentProfile, TeacherProfile, AdminProfile
from app.core.security import hash_password
from app.services.auth_service import AuthService


class UserService:

    # ─── STUDENT ──────────────────────────────────────
    @staticmethod
    def _generate_roll_number(db: Session) -> str:
        """Auto generate roll number like BZU-2025-0001"""
        from datetime import datetime
        year = datetime.now().year
        # Last student ki ID dhundo
        last = db.query(User).filter(
            User.role == "student",
            User.roll_number.isnot(None)
        ).order_by(User.id.desc()).first()

        if last and last.roll_number:
            try:
                seq = int(last.roll_number.split("-")[-1]) + 1
            except:
                seq = 1
        else:
            seq = 1

        return f"BZU-{year}-{seq:04d}"

    @staticmethod
    def create_student(db: Session, data: dict):
        # Check email
        if db.query(User).filter(User.email == data["email"]).first():
            return None, "Email already exists"

        # Roll number — agar diya nahi to auto generate karo
        roll_number = data.get("roll_number") or UserService._generate_roll_number(db)

        # Check roll number unique
        if db.query(User).filter(User.roll_number == roll_number).first():
            roll_number = UserService._generate_roll_number(db)

        # Temp password
        temp_password = AuthService.generate_temp_password()

        user = User(
            email=data["email"],
            roll_number=roll_number,
            password_hash=hash_password(temp_password),
            role="student"
        )
        db.add(user)
        db.flush()

        profile = StudentProfile(
            user_id=user.id,
            full_name=data["full_name"],
            father_name=data.get("father_name"),
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
            cnic=data.get("cnic") or None,
            phone=data.get("phone"),
            current_address=data.get("current_address"),
            permanent_address=data.get("permanent_address"),
            city=data.get("city"),
            guardian_phone=data.get("guardian_phone"),
            guardian_cnic=data.get("guardian_cnic") or None,
            guardian_relation=data.get("guardian_relation"),
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

        return {"user": user, "temp_password": temp_password}, None

    @staticmethod
    def get_students(db: Session, page: int = 1, per_page: int = 20, search: str = ""):
        offset = (page - 1) * per_page
        query = db.query(User).filter(User.role == "student")

        if search:
            search_term = f"%{search}%"
            query = query.join(User.student_profile).filter(
                (User.email.ilike(search_term)) |
                (User.roll_number.ilike(search_term)) |
                (StudentProfile.full_name.ilike(search_term)) |
                (StudentProfile.phone.ilike(search_term))
            )

        total = query.count()
        students = query.offset(offset).limit(per_page).all()
        return students, total

    @staticmethod
    def get_student_by_id(db: Session, student_id: int):
        return db.query(User).filter(
            User.id == student_id, User.role == "student"
        ).first()

    @staticmethod
    def update_student(db: Session, student_id: int, data: dict):
        user = db.query(User).filter(
            User.id == student_id, User.role == "student"
        ).first()
        if not user:
            return None, "Student not found"

        profile = user.student_profile
        allowed = ["full_name", "father_name", "phone", "current_address",
                   "permanent_address", "city", "guardian_phone", "gender"]
        for key in allowed:
            if key in data and data[key] is not None:
                setattr(profile, key, data[key])

        db.commit()
        return user, None


    @staticmethod
    def toggle_student_status(db: Session, student_id: int):
        user = db.query(User).filter(
            User.id == student_id, User.role == "student"
        ).first()
        if not user:
            return None, "Student not found"
        user.is_active = not user.is_active
        db.commit()
        return user, None

    # ─── TEACHER ──────────────────────────────────────
    @staticmethod
    def create_teacher(db: Session, data: dict):
        if db.query(User).filter(User.email == data["email"]).first():
            return None, "Email already exists"

        temp_password = AuthService.generate_temp_password()

        user = User(
            email=data["email"],
            password_hash=hash_password(temp_password),
            role="teacher"
        )
        db.add(user)
        db.flush()

        profile = TeacherProfile(
            user_id=user.id,
            employee_id=data["employee_id"],
            full_name=data["full_name"],
            designation=data.get("designation"),
            qualification=data.get("qualification"),
            specialization=data.get("specialization"),
            joining_date=data.get("joining_date"),
            phone=data.get("phone"),
            cnic=data.get("cnic"),
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

        return {"user": user, "temp_password": temp_password}, None

    @staticmethod
    def get_teachers(db: Session, page: int = 1, per_page: int = 20, search: str = ""):
        offset = (page - 1) * per_page
        query = db.query(User).filter(User.role == "teacher")

        if search:
            search_term = f"%{search}%"
            query = query.join(User.teacher_profile).filter(
                (User.email.ilike(search_term)) |
                (TeacherProfile.full_name.ilike(search_term)) |
                (TeacherProfile.employee_id.ilike(search_term)) |
                (TeacherProfile.designation.ilike(search_term)) |
                (TeacherProfile.phone.ilike(search_term))
            )

        total = query.count()
        teachers = query.offset(offset).limit(per_page).all()
        return teachers, total

    @staticmethod
    def get_teacher_by_id(db: Session, teacher_id: int):
        return db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()

    @staticmethod
    def update_teacher(db: Session, teacher_id: int, data: dict):
        user = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
        if not user:
            return None, "Teacher not found"

        profile = user.teacher_profile
        allowed_fields = ["designation", "qualification", "specialization", "phone", "address", "full_name"]
        for key in allowed_fields:
            if key in data and data[key] is not None:
                setattr(profile, key, data[key])

        db.commit()
        return user, None

    @staticmethod
    def toggle_teacher_status(db: Session, teacher_id: int):
        user = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
        if not user:
            return None, "Teacher not found"
        user.is_active = not user.is_active
        db.commit()
        return user, None