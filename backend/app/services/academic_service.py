from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.academic import Department, Program, Semester, Course, CourseCLO


class DepartmentService:

    @staticmethod
    def create(db: Session, data: dict):
        # Duplicate check
        if db.query(Department).filter(Department.code == data["code"]).first():
            return None, "Department code already exists"

        dept = Department(**data)
        db.add(dept)
        db.commit()
        db.refresh(dept)
        return dept, None

    @staticmethod
    def get_all(db: Session):
        return db.query(Department).all()

    @staticmethod
    def get_by_id(db: Session, dept_id: int):
        return db.query(Department).filter(Department.id == dept_id).first()

    @staticmethod
    def update(db: Session, dept_id: int, data: dict):
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            return None, "Department not found"

        for key, value in data.items():
            setattr(dept, key, value)

        db.commit()
        db.refresh(dept)
        return dept, None

    @staticmethod
    def delete(db: Session, dept_id: int):
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if not dept:
            return False, "Department not found"

        # Check karo agar programs linked hain
        if dept.programs:
            return False, "Cannot delete — programs are linked to this department"

        db.delete(dept)
        db.commit()
        return True, None


class ProgramService:

    @staticmethod
    def create(db: Session, data: dict):
        # Department exist karta hai?
        dept = db.query(Department).filter(
            Department.id == data["department_id"]
        ).first()
        if not dept:
            return None, "Department not found"

        if db.query(Program).filter(Program.code == data["code"]).first():
            return None, "Program code already exists"

        program = Program(**data)
        db.add(program)
        db.commit()
        db.refresh(program)
        return program, None

    @staticmethod
    def get_all(db: Session, department_id: int = None):
        query = db.query(Program)
        if department_id:
            query = query.filter(Program.department_id == department_id)
        return query.all()

    @staticmethod
    def get_by_id(db: Session, program_id: int):
        return db.query(Program).filter(Program.id == program_id).first()

    @staticmethod
    def update(db: Session, program_id: int, data: dict):
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            return None, "Program not found"

        for key, value in data.items():
            setattr(program, key, value)

        db.commit()
        db.refresh(program)
        return program, None


class SemesterService:

    @staticmethod
    def create(db: Session, data: dict):
        if db.query(Semester).filter(Semester.code == data["code"]).first():
            return None, "Semester code already exists"

        semester = Semester(**data)
        db.add(semester)
        db.commit()
        db.refresh(semester)
        return semester, None

    @staticmethod
    def get_all(db: Session):
        return db.query(Semester).order_by(Semester.start_date.desc()).all()

    @staticmethod
    def get_active(db: Session):
        return db.query(Semester).filter(Semester.is_active == True).first()

    @staticmethod
    def get_by_id(db: Session, semester_id: int):
        return db.query(Semester).filter(Semester.id == semester_id).first()

    @staticmethod
    def activate(db: Session, semester_id: int):
        # Pehle sab deactivate karo
        db.query(Semester).update({"is_active": False})

        # Phir ye activate karo
        semester = db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            return None, "Semester not found"

        semester.is_active = True
        db.commit()
        db.refresh(semester)
        return semester, None

    @staticmethod
    def update(db: Session, semester_id: int, data: dict):
        semester = db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            return None, "Semester not found"

        for key, value in data.items():
            setattr(semester, key, value)

        db.commit()
        db.refresh(semester)
        return semester, None


class CourseService:

    @staticmethod
    def create(db: Session, data: dict):
        if db.query(Course).filter(Course.code == data["code"]).first():
            return None, "Course code already exists"

        course = Course(**data)
        db.add(course)
        db.commit()
        db.refresh(course)
        return course, None

    @staticmethod
    def get_all(db: Session, department_id: int = None, program_id: int = None):
        query = db.query(Course)
        if department_id:
            query = query.filter(Course.department_id == department_id)
        if program_id:
            query = query.filter(Course.program_id == program_id)
        return query.all()

    @staticmethod
    def get_by_id(db: Session, course_id: int):
        return db.query(Course).filter(Course.id == course_id).first()

    @staticmethod
    def update(db: Session, course_id: int, data: dict):
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return None, "Course not found"

        for key, value in data.items():
            setattr(course, key, value)

        db.commit()
        db.refresh(course)
        return course, None

    # ─── CLO Methods ──────────────────────────────────
    @staticmethod
    def add_clo(db: Session, course_id: int, data: dict):
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return None, "Course not found"

        # Duplicate CLO number check
        existing = db.query(CourseCLO).filter(
            CourseCLO.course_id == course_id,
            CourseCLO.clo_number == data["clo_number"]
        ).first()
        if existing:
            return None, f"CLO {data['clo_number']} already exists for this course"

        clo = CourseCLO(course_id=course_id, **data)
        db.add(clo)
        db.commit()
        db.refresh(clo)
        return clo, None

    @staticmethod
    def get_clos(db: Session, course_id: int):
        return db.query(CourseCLO).filter(
            CourseCLO.course_id == course_id
        ).all()

    @staticmethod
    def delete_clo(db: Session, clo_id: int):
        clo = db.query(CourseCLO).filter(CourseCLO.id == clo_id).first()
        if not clo:
            return False, "CLO not found"
        db.delete(clo)
        db.commit()
        return True, None