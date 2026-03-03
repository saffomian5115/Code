from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class VoucherStatusEnum(str, Enum):
    paid = "paid"
    unpaid = "unpaid"
    partial = "partial"
    overdue = "overdue"


class PaymentMethodEnum(str, Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    credit_card = "credit_card"
    online = "online"


# ─── FEE STRUCTURE SCHEMAS ──────────────────────────────

class OtherFeeItem(BaseModel):
    name: str
    amount: float

class FeeStructureCreateRequest(BaseModel):
    program_id: int
    semester_number: int
    tuition_fee: float
    admission_fee: Optional[float] = 0
    library_fee: Optional[float] = 0
    sports_fee: Optional[float] = 0
    other_fees: Optional[List[OtherFeeItem]] = None
    valid_from: date
    valid_to: Optional[date] = None

    @field_validator("tuition_fee")
    def tuition_positive(cls, v):
        if v <= 0:
            raise ValueError("Tuition fee must be greater than 0")
        return v

    @field_validator("semester_number")
    def valid_semester_number(cls, v):
        if not (1 <= v <= 8):
            raise ValueError("Semester number must be between 1 and 8")
        return v

class FeeStructureUpdateRequest(BaseModel):
    tuition_fee: Optional[float] = None
    admission_fee: Optional[float] = None
    library_fee: Optional[float] = None
    sports_fee: Optional[float] = None
    other_fees: Optional[List[OtherFeeItem]] = None
    valid_to: Optional[date] = None


# ─── FEE VOUCHER SCHEMAS ────────────────────────────────

class VoucherGenerateRequest(BaseModel):
    student_id: int
    semester_id: int
    due_date: date
    remarks: Optional[str] = None

class BulkVoucherGenerateRequest(BaseModel):
    # Poori class ke liye ek saath vouchers generate karo
    semester_id: int
    program_id: int
    due_date: date
    remarks: Optional[str] = None

class VoucherStatusUpdateRequest(BaseModel):
    status: VoucherStatusEnum
    remarks: Optional[str] = None


# ─── PAYMENT SCHEMAS ────────────────────────────────────

class PaymentCreateRequest(BaseModel):
    amount_paid: float
    payment_method: PaymentMethodEnum
    reference_number: Optional[str] = None
    bank_name: Optional[str] = None
    receipt_number: Optional[str] = None

    @field_validator("amount_paid")
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Payment amount must be greater than 0")
        return v

class FineCalculateRequest(BaseModel):
    voucher_id: int
    fine_per_day: Optional[float] = 50.0    # Default Rs. 50 per day