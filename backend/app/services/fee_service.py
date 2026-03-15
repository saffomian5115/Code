from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timezone
import secrets
import string
from app.models.fee import FeeStructure, FeeVoucher, FeePayment
from app.models.user import User
from app.models.academic import Semester, Program
from app.models.enrollment import StudentProgramEnrollment


class FeeStructureService:

    @staticmethod
    def create(db: Session, data: dict):
        # Duplicate check — same program same semester
        existing = db.query(FeeStructure).filter(
            FeeStructure.program_id == data["program_id"],
            FeeStructure.semester_number == data["semester_number"],
            FeeStructure.valid_to == None       # Active structure
        ).first()
        if existing:
            return None, (
                f"Active fee structure already exists for "
                f"semester {data['semester_number']} of this program"
            )

        # other_fees ko dict list mein convert karo
        if data.get("other_fees"):
            data["other_fees"] = [
                f.model_dump() if hasattr(f, "model_dump") else f
                for f in data["other_fees"]
            ]

        structure = FeeStructure(**data)
        db.add(structure)
        db.commit()
        db.refresh(structure)
        return structure, None

    @staticmethod
    def get_all(db: Session, program_id: int = None):
        query = db.query(FeeStructure)
        if program_id:
            query = query.filter(FeeStructure.program_id == program_id)
        return query.order_by(
            FeeStructure.program_id,
            FeeStructure.semester_number
        ).all()

    @staticmethod
    def get_by_id(db: Session, structure_id: int):
        return db.query(FeeStructure).filter(
            FeeStructure.id == structure_id
        ).first()

    @staticmethod
    def get_for_student(db: Session, student_id: int, semester_number: int):
        # Student ka program dhundo
        program_enrollment = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.student_id == student_id,
            StudentProgramEnrollment.status == "active"
        ).first()

        if not program_enrollment:
            return None, "Student program enrollment not found"

        structure = db.query(FeeStructure).filter(
            FeeStructure.program_id == program_enrollment.program_id,
            FeeStructure.semester_number == semester_number,
            FeeStructure.valid_to == None
        ).first()

        if not structure:
            return None, "Fee structure not found for this program and semester"

        return structure, None

    @staticmethod
    def update(db: Session, structure_id: int, data: dict):
        structure = db.query(FeeStructure).filter(
            FeeStructure.id == structure_id
        ).first()
        if not structure:
            return None, "Fee structure not found"

        if data.get("other_fees"):
            data["other_fees"] = [
                f.model_dump() if hasattr(f, "model_dump") else f
                for f in data["other_fees"]
            ]

        for key, value in data.items():
            setattr(structure, key, value)

        db.commit()
        db.refresh(structure)
        return structure, None

    @staticmethod
    def calculate_total(structure: FeeStructure) -> float:
        total = (
            float(structure.tuition_fee) +
            float(structure.admission_fee or 0) +
            float(structure.library_fee or 0) +
            float(structure.sports_fee or 0)
        )
        # other_fees add karo
        if structure.other_fees:
            for fee in structure.other_fees:
                total += float(fee.get("amount", 0))

        return round(total, 2)


class VoucherService:

    @staticmethod
    def _generate_voucher_number() -> str:
        # Format: VCH-2024-XXXXX
        year = datetime.now().year
        random_part = "".join(
            secrets.choice(string.digits) for _ in range(5)
        )
        return f"VCH-{year}-{random_part}"

    @staticmethod
    def generate_for_student(db: Session, data: dict):
        student_id = data["student_id"]
        semester_id = data["semester_id"]

        # Student exist check
        student = db.query(User).filter(
            User.id == student_id,
            User.role == "student"
        ).first()
        if not student:
            return None, "Student not found"

        # Already has voucher for this semester?
        existing = db.query(FeeVoucher).filter(
            FeeVoucher.student_id == student_id,
            FeeVoucher.semester_id == semester_id,
            FeeVoucher.status.in_(["unpaid", "partial", "overdue"])
        ).first()
        if existing:
            return None, "Active fee voucher already exists for this semester"

        # Fee structure se amount calculate karo
        program_enrollment = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.student_id == student_id,
            StudentProgramEnrollment.status == "active"
        ).first()
        if not program_enrollment:
            return None, "Student program enrollment not found"

        structure = db.query(FeeStructure).filter(
            FeeStructure.program_id == program_enrollment.program_id,
            FeeStructure.semester_number == program_enrollment.current_semester,
            FeeStructure.valid_to == None
        ).first()
        if not structure:
            return None, "Fee structure not found for student's program"

        total_amount = FeeStructureService.calculate_total(structure)

        # Unique voucher number
        voucher_number = VoucherService._generate_voucher_number()
        while db.query(FeeVoucher).filter(
            FeeVoucher.voucher_number == voucher_number
        ).first():
            voucher_number = VoucherService._generate_voucher_number()

        voucher = FeeVoucher(
            student_id=student_id,
            voucher_number=voucher_number,
            semester_id=semester_id,
            amount=total_amount,
            due_date=data["due_date"],
            issue_date=date.today(),
            status="unpaid",
            remarks=data.get("remarks")
        )
        db.add(voucher)
        db.commit()
        db.refresh(voucher)
        return voucher, None

    @staticmethod
    def generate_bulk(db: Session, data: dict):
        semester_id = data["semester_id"]
        program_id = data["program_id"]
        due_date = data["due_date"]

        # Is program ke active students dhundo
        students = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.program_id == program_id,
            StudentProgramEnrollment.status == "active"
        ).all()

        if not students:
            return None, "No active students found in this program"

        generated = []
        skipped = []

        for enrollment in students:
            result, error = VoucherService.generate_for_student(db, {
                "student_id": enrollment.student_id,
                "semester_id": semester_id,
                "due_date": due_date,
                "remarks": data.get("remarks")
            })
            if error:
                skipped.append({
                    "student_id": enrollment.student_id,
                    "reason": error
                })
            else:
                generated.append(result)

        return {
            "generated": generated,
            "generated_count": len(generated),
            "skipped_count": len(skipped),
            "skipped": skipped
        }, None

    @staticmethod
    def get_student_vouchers(db: Session, student_id: int):
        return db.query(FeeVoucher).filter(
            FeeVoucher.student_id == student_id
        ).order_by(FeeVoucher.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, voucher_id: int):
        return db.query(FeeVoucher).filter(
            FeeVoucher.id == voucher_id
        ).first()

    @staticmethod
    def get_by_voucher_number(db: Session, voucher_number: str):
        return db.query(FeeVoucher).filter(
            FeeVoucher.voucher_number == voucher_number
        ).first()

    @staticmethod
    def get_all(
        db: Session,
        status: str = None,
        semester_id: int = None,
        page: int = 1,
        per_page: int = 20
    ):
        query = db.query(FeeVoucher)
        if status:
            query = query.filter(FeeVoucher.status == status)
        if semester_id:
            query = query.filter(FeeVoucher.semester_id == semester_id)

        total = query.count()
        offset = (page - 1) * per_page
        vouchers = query.order_by(
            FeeVoucher.due_date.asc()
        ).offset(offset).limit(per_page).all()

        return vouchers, total

    @staticmethod
    def calculate_fine(db: Session, voucher_id: int, fine_per_day: float = 50.0):
        voucher = db.query(FeeVoucher).filter(
            FeeVoucher.id == voucher_id
        ).first()
        if not voucher:
            return None, "Voucher not found"

        if voucher.status == "paid":
            return None, "Voucher already paid — no fine applicable"

        today = date.today()
        if today <= voucher.due_date:
            return voucher, None    # Due date nahi gayi abhi

        # Days overdue
        days_overdue = (today - voucher.due_date).days
        fine = round(days_overdue * fine_per_day, 2)

        voucher.fine_amount = fine
        voucher.fine_calculated_at = today
        if voucher.status == "unpaid":
            voucher.status = "overdue"

        db.commit()
        db.refresh(voucher)
        return voucher, None

    @staticmethod
    def update_overdue_status(db: Session):
        # Sab unpaid vouchers check karo — cron job ki tarah
        today = date.today()
        overdue_vouchers = db.query(FeeVoucher).filter(
            FeeVoucher.status == "unpaid",
            FeeVoucher.due_date < today
        ).all()

        count = 0
        for v in overdue_vouchers:
            v.status = "overdue"
            count += 1

        db.commit()
        return count


class PaymentService:

    @staticmethod
    def record_payment(
        db: Session,
        voucher_id: int,
        data: dict,
        received_by: int
    ):
        voucher = db.query(FeeVoucher).filter(
            FeeVoucher.id == voucher_id
        ).first()
        if not voucher:
            return None, "Voucher not found"

        if voucher.status == "paid":
            return None, "Voucher already fully paid"

        # Total paid so far
        total_paid = db.query(
            func.sum(FeePayment.amount_paid)
        ).filter(
            FeePayment.voucher_id == voucher_id
        ).scalar() or 0

        total_due = float(voucher.amount) + float(voucher.fine_amount or 0)
        remaining = total_due - float(total_paid)

        if data["amount_paid"] > remaining:
            return None, f"Amount exceeds remaining balance (Rs. {remaining})"

        # Receipt number unique check
        if data.get("receipt_number"):
            existing = db.query(FeePayment).filter(
                FeePayment.receipt_number == data["receipt_number"]
            ).first()
            if existing:
                return None, "Receipt number already exists"

        payment = FeePayment(
            voucher_id=voucher_id,
            amount_paid=data["amount_paid"],
            payment_method=data["payment_method"],
            reference_number=data.get("reference_number"),
            bank_name=data.get("bank_name"),
            received_by=received_by,
            receipt_number=data.get("receipt_number"),
            payment_date=data.get("payment_date") or date.today(),
        )
        db.add(payment)

        # Voucher status update karo
        new_total_paid = float(total_paid) + data["amount_paid"]
        if new_total_paid >= total_due:
            voucher.status = "paid"
            voucher.payment_date = date.today()
            voucher.payment_method = data["payment_method"]
        else:
            voucher.status = "partial"

        db.commit()
        db.refresh(payment)
        return payment, None

    @staticmethod
    def get_voucher_payments(db: Session, voucher_id: int):
        return db.query(FeePayment).filter(
            FeePayment.voucher_id == voucher_id
        ).order_by(FeePayment.payment_date.desc()).all()

    @staticmethod
    def get_student_payment_history(db: Session, student_id: int):
        return (
            db.query(FeePayment)
            .join(FeeVoucher)
            .filter(FeeVoucher.student_id == student_id)
            .order_by(FeePayment.payment_date.desc())
            .all()
        )

    @staticmethod
    def get_fee_summary(db: Session, student_id: int):
        vouchers = db.query(FeeVoucher).filter(
            FeeVoucher.student_id == student_id
        ).all()

        total_fee = sum(float(v.amount) for v in vouchers)
        total_fine = sum(float(v.fine_amount or 0) for v in vouchers)
        total_paid = (
            db.query(func.sum(FeePayment.amount_paid))
            .join(FeeVoucher)
            .filter(FeeVoucher.student_id == student_id)
            .scalar()
        ) or 0

        return {
            "total_fee": round(total_fee, 2),
            "total_fine": round(total_fine, 2),
            "total_paid": round(float(total_paid), 2),
            "total_due": round(total_fee + total_fine - float(total_paid), 2),
            "paid_vouchers": sum(1 for v in vouchers if v.status == "paid"),
            "unpaid_vouchers": sum(1 for v in vouchers if v.status == "unpaid"),
            "overdue_vouchers": sum(1 for v in vouchers if v.status == "overdue"),
            "partial_vouchers": sum(1 for v in vouchers if v.status == "partial")
        }