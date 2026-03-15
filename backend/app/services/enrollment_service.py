from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.enrollment import Enrollment, CourseOffering, StudentProgramEnrollment
from app.models.user import User
from app.models.academic import Semester


class OfferingService:

    @staticmethod
    def create(db: Session, data: dict):
        existing = db.query(CourseOffering).filter(
            CourseOffering.course_id == data["course_id"],
            CourseOffering.semester_id == data["semester_id"],
            CourseOffering.section == data["section"]
        ).first()
        if existing:
            return None, "Offering already exists for this course/semester/section"

        if "schedule_json" in data and data["schedule_json"]:
            data["schedule_json"] = [
                s.model_dump() if hasattr(s, "model_dump") else s
                for s in data["schedule_json"]
            ]

        offering = CourseOffering(**data)
        db.add(offering)
        db.commit()
        db.refresh(offering)
        return offering, None

    @staticmethod
    def get_all(db: Session, semester_id: int = None, instructor_id: int = None):
        query = db.query(CourseOffering)
        if semester_id:
            query = query.filter(CourseOffering.semester_id == semester_id)
        if instructor_id:
            query = query.filter(CourseOffering.instructor_id == instructor_id)
        return query.all()

    @staticmethod
    def get_by_id(db: Session, offering_id: int):
        return db.query(CourseOffering).filter(
            CourseOffering.id == offering_id
        ).first()

    @staticmethod
    def update(db: Session, offering_id: int, data: dict):
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == offering_id
        ).first()
        if not offering:
            return None, "Offering not found"

        if "schedule_json" in data and data["schedule_json"]:
            data["schedule_json"] = [
                s.model_dump() if hasattr(s, "model_dump") else s
                for s in data["schedule_json"]
            ]

        for key, value in data.items():
            setattr(offering, key, value)

        db.commit()
        db.refresh(offering)
        return offering, None

    @staticmethod
    def get_enrolled_students(db: Session, offering_id: int):
        """Returns only currently 'enrolled' status — used by teacher attendance."""
        enrollments = db.query(Enrollment).filter(
            Enrollment.offering_id == offering_id,
            Enrollment.status == "enrolled"
        ).all()
        return enrollments

    @staticmethod
    def get_all_students(db: Session, offering_id: int):
        """
        Returns ALL enrollments for an offering regardless of status.
        Used by admin Enrollments page — shows enrolled, dropped, completed, failed.
        """
        enrollments = db.query(Enrollment).filter(
            Enrollment.offering_id == offering_id
        ).order_by(Enrollment.enrollment_date.desc()).all()
        return enrollments


class EnrollmentService:

    @staticmethod
    def enroll(db: Session, student_id: int, offering_id: int):
        # Student exist check
        student = db.query(User).filter(
            User.id == student_id, User.role == "student"
        ).first()
        if not student:
            return None, "Student not found"

        # Offering exist check
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == offering_id,
            CourseOffering.is_active == True
        ).first()
        if not offering:
            return None, "Course offering not found or inactive"

        # Already enrolled check
        existing = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.offering_id == offering_id
        ).first()
        if existing:
            # If previously dropped, re-enroll
            if existing.status == "dropped":
                existing.status = "enrolled"
                existing.is_approved = True
                offering.enrolled_students += 1
                db.commit()
                db.refresh(existing)
                return existing, None
            return None, "Student already enrolled in this course"

        # Capacity check
        if offering.enrolled_students >= offering.max_students:
            return None, "Course is full — maximum capacity reached"

        # Admin enrolls directly → auto-approved, no advisor flag needed
        enrollment = Enrollment(
            student_id=student_id,
            offering_id=offering_id,
            status="enrolled",
            is_approved=True,
            advisor_approval_requested=False
        )
        db.add(enrollment)

        # Count update
        offering.enrolled_students += 1
        db.commit()
        db.refresh(enrollment)
        return enrollment, None

    @staticmethod
    def get_student_enrollments(db: Session, student_id: int, semester_id: int = None):
        query = db.query(Enrollment).filter(
            Enrollment.student_id == student_id
        )
        if semester_id:
            query = query.join(CourseOffering).filter(
                CourseOffering.semester_id == semester_id
            )
        return query.all()

    @staticmethod
    def get_by_id(db: Session, enrollment_id: int):
        return db.query(Enrollment).filter(
            Enrollment.id == enrollment_id
        ).first()

    @staticmethod
    def approve(db: Session, enrollment_id: int, approved_by: int, comments: str = None):
        enrollment = db.query(Enrollment).filter(
            Enrollment.id == enrollment_id
        ).first()
        if not enrollment:
            return None, "Enrollment not found"

        if enrollment.is_approved:
            return None, "Enrollment already approved"

        enrollment.is_approved = True
        enrollment.approved_by = approved_by
        enrollment.approved_at = datetime.now(timezone.utc)
        enrollment.advisor_comments = comments
        enrollment.advisor_approval_date = datetime.now(timezone.utc)

        db.commit()
        db.refresh(enrollment)
        return enrollment, None

    @staticmethod
    def drop(db: Session, enrollment_id: int, reason: str = None):
        enrollment = db.query(Enrollment).filter(
            Enrollment.id == enrollment_id
        ).first()
        if not enrollment:
            return None, "Enrollment not found"

        if enrollment.status == "dropped":
            return None, "Already dropped"

        enrollment.status = "dropped"
        enrollment.advisor_remarks = reason

        # Count kam karo
        offering = enrollment.offering
        if offering and offering.enrolled_students > 0:
            offering.enrolled_students -= 1

        db.commit()
        db.refresh(enrollment)
        return enrollment, None

    @staticmethod
    def enter_grade(db: Session, enrollment_id: int, grade_letter: str, grade_points: float):
        enrollment = db.query(Enrollment).filter(
            Enrollment.id == enrollment_id
        ).first()
        if not enrollment:
            return None, "Enrollment not found"

        enrollment.grade_letter = grade_letter
        enrollment.grade_points = grade_points
        enrollment.status = "completed"

        db.commit()
        db.refresh(enrollment)
        return enrollment, None

    @staticmethod
    def get_pending_approvals(db: Session, advisor_id: int):
        """Advisor ke pending approvals — teacher portal use karta hai."""
        return db.query(Enrollment).join(CourseOffering).filter(
            CourseOffering.instructor_id == advisor_id,
            Enrollment.advisor_approval_requested == True,
            Enrollment.is_approved == False,
            Enrollment.status == "enrolled"
        ).all()


class StudentProgramService:

    @staticmethod
    def enroll_in_program(db: Session, data: dict):
        existing = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.student_id == data["student_id"],
            StudentProgramEnrollment.program_id == data["program_id"]
        ).first()
        if existing:
            return None, "Student already enrolled in this program"

        enrollment = StudentProgramEnrollment(**data)
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return enrollment, None

    @staticmethod
    def get_student_program(db: Session, student_id: int):
        return db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.student_id == student_id
        ).first()

    @staticmethod
    def update(db: Session, enrollment_id: int, data: dict):
        enrollment = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.id == enrollment_id
        ).first()
        if not enrollment:
            return None, "Enrollment not found"

        for key, value in data.items():
            setattr(enrollment, key, value)

        db.commit()
        db.refresh(enrollment)
        return enrollment, None

    @staticmethod
    def calculate_cgpa(db: Session, student_id: int) -> float:
        """Student ki completed enrollments se CGPA calculate karo."""
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == "completed",
            Enrollment.grade_points.isnot(None)
        ).all()

        if not enrollments:
            return None

        total_points = sum(
            float(e.grade_points) * (e.offering.course.credit_hours if e.offering and e.offering.course else 3)
            for e in enrollments
        )
        total_credits = sum(
            e.offering.course.credit_hours if e.offering and e.offering.course else 3
            for e in enrollments
        )

        return round(total_points / total_credits, 2) if total_credits > 0 else None