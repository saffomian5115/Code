from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.services.fee_service import (
    FeeStructureService, VoucherService, PaymentService
)
from app.schemas.fee import (
    FeeStructureCreateRequest, FeeStructureUpdateRequest,
    VoucherGenerateRequest, BulkVoucherGenerateRequest,
    PaymentCreateRequest, FineCalculateRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Fee Management"])


# ════════════════════════════════════════════════════════
# FEE STRUCTURE
# ════════════════════════════════════════════════════════

@router.post("/fee-structure")
def create_fee_structure(
    request: FeeStructureCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    data = request.model_dump()
    structure, error = FeeStructureService.create(db, data)
    if error:
        return error_response(error, "CREATE_FAILED")

    total = FeeStructureService.calculate_total(structure)

    return success_response({
        "id": structure.id,
        "program_id": structure.program_id,
        "semester_number": structure.semester_number,
        "tuition_fee": float(structure.tuition_fee),
        "admission_fee": float(structure.admission_fee or 0),
        "library_fee": float(structure.library_fee or 0),
        "sports_fee": float(structure.sports_fee or 0),
        "other_fees": structure.other_fees,
        "total_fee": total,
        "valid_from": str(structure.valid_from)
    }, "Fee structure created successfully", status_code=201)


@router.get("/fee-structure")
def get_fee_structures(
    program_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    structures = FeeStructureService.get_all(db, program_id)
    data = [{
        "id": s.id,
        "program_id": s.program_id,
        "program_name": s.program.name if s.program else None,
        "semester_number": s.semester_number,
        "tuition_fee": float(s.tuition_fee),
        "admission_fee": float(s.admission_fee or 0),
        "library_fee": float(s.library_fee or 0),
        "sports_fee": float(s.sports_fee or 0),
        "other_fees": s.other_fees or [],
        "total_fee": FeeStructureService.calculate_total(s),
        "valid_from": str(s.valid_from),
        "valid_to": str(s.valid_to) if s.valid_to else None
    } for s in structures]

    return success_response({"structures": data, "total": len(data)}, "Fee structures retrieved")

@router.get("/fee-structure/{structure_id}")
def get_fee_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    structure = FeeStructureService.get_by_id(db, structure_id)
    if not structure:
        return error_response(
            "Fee structure not found", "NOT_FOUND", status_code=404
        )

    return success_response({
        "id": structure.id,
        "program_name": structure.program.name if structure.program else None,
        "semester_number": structure.semester_number,
        "tuition_fee": float(structure.tuition_fee),
        "admission_fee": float(structure.admission_fee or 0),
        "library_fee": float(structure.library_fee or 0),
        "sports_fee": float(structure.sports_fee or 0),
        "other_fees": structure.other_fees,
        "total_fee": FeeStructureService.calculate_total(structure),
        "valid_from": str(structure.valid_from),
        "valid_to": str(structure.valid_to) if structure.valid_to else None
    })


@router.put("/fee-structure/{structure_id}")
def update_fee_structure(
    structure_id: int,
    request: FeeStructureUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    structure, error = FeeStructureService.update(
        db, structure_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response({
        "id": structure.id,
        "total_fee": FeeStructureService.calculate_total(structure)
    }, "Fee structure updated successfully")


# ════════════════════════════════════════════════════════
# FEE VOUCHERS
# ════════════════════════════════════════════════════════

@router.post("/vouchers")
def generate_voucher(
    request: VoucherGenerateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    voucher, error = VoucherService.generate_for_student(
        db, request.model_dump()
    )
    if error:
        return error_response(error, "GENERATE_FAILED")

    return success_response({
        "id": voucher.id,
        "voucher_number": voucher.voucher_number,
        "student_id": voucher.student_id,
        "amount": float(voucher.amount),
        "due_date": str(voucher.due_date),
        "issue_date": str(voucher.issue_date),
        "status": voucher.status
    }, "Fee voucher generated successfully", status_code=201)


@router.post("/vouchers/bulk")
def generate_bulk_vouchers(
    request: BulkVoucherGenerateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    result, error = VoucherService.generate_bulk(db, request.model_dump())
    if error:
        return error_response(error, "BULK_GENERATE_FAILED")

    return success_response({
        "generated_count": result["generated_count"],
        "skipped_count": result["skipped_count"],
        "skipped_details": result["skipped"],
        "vouchers": [{
            "id": v.id,
            "voucher_number": v.voucher_number,
            "student_id": v.student_id,
            "amount": float(v.amount)
        } for v in result["generated"]]
    }, f"Bulk vouchers generated: {result['generated_count']} success, "
       f"{result['skipped_count']} skipped",
    status_code=201)


@router.get("/vouchers")
def get_all_vouchers(
    status: str = None,
    semester_id: int = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    vouchers, total = VoucherService.get_all(
        db, status, semester_id, page, per_page
    )
    data = [{
        "id": v.id,
        "voucher_number": v.voucher_number,
        "student_id": v.student_id,
        "roll_number": v.student.roll_number if v.student else None,
        "student_name": v.student.student_profile.full_name
            if v.student and v.student.student_profile else None,
        "amount": float(v.amount),
        "fine_amount": float(v.fine_amount or 0),
        "total_due": float(v.amount) + float(v.fine_amount or 0),
        "due_date": str(v.due_date),
        "status": v.status
    } for v in vouchers]

    return success_response({
        "vouchers": data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    }, "Vouchers retrieved")


@router.get("/vouchers/{voucher_id}")
def get_voucher(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    voucher = VoucherService.get_by_id(db, voucher_id)
    if not voucher:
        return error_response("Voucher not found", "NOT_FOUND", status_code=404)

    # Payments
    payments = PaymentService.get_voucher_payments(db, voucher_id)
    total_paid = sum(float(p.amount_paid) for p in payments)
    total_due = float(voucher.amount) + float(voucher.fine_amount or 0)

    return success_response({
        "id": voucher.id,
        "voucher_number": voucher.voucher_number,
        "student": {
            "id": voucher.student_id,
            "roll_number": voucher.student.roll_number if voucher.student else None,
            "name": voucher.student.student_profile.full_name
                if voucher.student and voucher.student.student_profile else None
        },
        "semester": {
            "id": voucher.semester_id,
            "name": voucher.semester.name if voucher.semester else None
        },
        "amount": float(voucher.amount),
        "fine_amount": float(voucher.fine_amount or 0),
        "total_due": total_due,
        "total_paid": total_paid,
        "remaining": round(total_due - total_paid, 2),
        "due_date": str(voucher.due_date),
        "issue_date": str(voucher.issue_date),
        "status": voucher.status,
        "payment_date": str(voucher.payment_date) if voucher.payment_date else None,
        "remarks": voucher.remarks,
        "payments": [{
            "id": p.id,
            "amount_paid": float(p.amount_paid),
            "payment_method": p.payment_method,
            "reference_number": p.reference_number,
            "bank_name": p.bank_name,
            "receipt_number": p.receipt_number,
            "payment_date": str(p.payment_date)
        } for p in payments]
    })


@router.get("/vouchers/number/{voucher_number}")
def get_voucher_by_number(
    voucher_number: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    voucher = VoucherService.get_by_voucher_number(db, voucher_number)
    if not voucher:
        return error_response("Voucher not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": voucher.id,
        "voucher_number": voucher.voucher_number,
        "amount": float(voucher.amount),
        "fine_amount": float(voucher.fine_amount or 0),
        "total_due": float(voucher.amount) + float(voucher.fine_amount or 0),
        "due_date": str(voucher.due_date),
        "status": voucher.status
    })


@router.get("/students/{student_id}/vouchers")
def get_student_vouchers(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vouchers = VoucherService.get_student_vouchers(db, student_id)
    summary = PaymentService.get_fee_summary(db, student_id)

    data = [{
        "id": v.id,
        "voucher_number": v.voucher_number,
        "semester_name": v.semester.name if v.semester else None,
        "amount": float(v.amount),
        "fine_amount": float(v.fine_amount or 0),
        "total_due": float(v.amount) + float(v.fine_amount or 0),
        "due_date": str(v.due_date),
        "issue_date": str(v.issue_date),
        "status": v.status,
        "payment_date": str(v.payment_date) if v.payment_date else None
    } for v in vouchers]

    return success_response({
        "student_id": student_id,
        "fee_summary": summary,
        "vouchers": data,
        "total": len(data)
    }, "Student vouchers retrieved")


@router.patch("/vouchers/{voucher_id}/fine")
def calculate_fine(
    voucher_id: int,
    request: FineCalculateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    voucher, error = VoucherService.calculate_fine(
        db, voucher_id, fine_per_day=request.fine_per_day
    )
    if error:
        return error_response(error, "FINE_CALC_FAILED")

    return success_response({
        "voucher_id": voucher.id,
        "voucher_number": voucher.voucher_number,
        "original_amount": float(voucher.amount),
        "fine_amount": float(voucher.fine_amount or 0),
        "total_due": float(voucher.amount) + float(voucher.fine_amount or 0),
        "due_date": str(voucher.due_date),
        "fine_calculated_at": str(voucher.fine_calculated_at),
        "status": voucher.status
    }, "Fine calculated successfully")


@router.patch("/vouchers/update-overdue")
def update_overdue_vouchers(
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    count = VoucherService.update_overdue_status(db)
    return success_response({
        "updated_count": count
    }, f"{count} vouchers marked as overdue")


# ════════════════════════════════════════════════════════
# PAYMENTS
# ════════════════════════════════════════════════════════

@router.post("/vouchers/{voucher_id}/pay")
def record_payment(
    voucher_id: int,
    request: PaymentCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    payment, error = PaymentService.record_payment(db, voucher_id, request.model_dump(), received_by=admin.id)
    if error:
        return error_response(error, "PAYMENT_FAILED")
    return success_response({"payment_id": payment.id}, "Payment recorded successfully")

@router.get("/students/{student_id}/payment-history")
def get_payment_history(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    payments = PaymentService.get_student_payment_history(db, student_id)
    summary = PaymentService.get_fee_summary(db, student_id)

    data = [{
        "payment_id": p.id,
        "voucher_number": p.voucher.voucher_number if p.voucher else None,
        "amount_paid": float(p.amount_paid),
        "payment_method": p.payment_method,
        "reference_number": p.reference_number,
        "bank_name": p.bank_name,
        "receipt_number": p.receipt_number,
        "payment_date": str(p.payment_date)
    } for p in payments]

    return success_response({
        "student_id": student_id,
        "summary": summary,
        "total_transactions": len(data),
        "payment_history": data
    }, "Payment history retrieved")


@router.get("/students/{student_id}/fee-summary")
def get_fee_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    summary = PaymentService.get_fee_summary(db, student_id)
    return success_response(summary, "Fee summary retrieved")

@router.delete("/fee-structure/{structure_id}")
def delete_fee_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    structure = FeeStructureService.get_by_id(db, structure_id)
    if not structure:
        return error_response("Fee structure not found", "NOT_FOUND", status_code=404)

    try:
        db.delete(structure)
        db.commit()
        return success_response(message="Fee structure deleted successfully")
    except Exception as e:
        db.rollback()
        return error_response(str(e), "DELETE_FAILED", status_code=400)