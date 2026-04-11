from sqlalchemy import (
    Column, Integer, String, Boolean,
    Text, TIMESTAMP, ForeignKey,
    JSON, DECIMAL, Enum, Date,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class FeeStructure(Base):
    __tablename__ = "fee_structure"

    id = Column(Integer, primary_key=True, autoincrement=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    tuition_fee = Column(DECIMAL(10, 2), nullable=False)
    admission_fee = Column(DECIMAL(10, 2), default=0)
    library_fee = Column(DECIMAL(10, 2), default=0)
    sports_fee = Column(DECIMAL(10, 2), default=0)
    other_fees = Column(JSON)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    program = relationship("Program")


class FeeVoucher(Base):
    __tablename__ = "fee_vouchers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    voucher_number = Column(String(50), unique=True, nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    issue_date = Column(Date, nullable=False)
    status = Column(
        Enum("paid", "unpaid", "partial", "overdue"),
        default="unpaid"
    )
    fine_amount = Column(DECIMAL(10, 2), default=0)
    fine_calculated_at = Column(Date, nullable=True)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(100), nullable=True)
    online_payment_data = Column(JSON, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    semester = relationship("Semester", foreign_keys=[semester_id])
    payments = relationship("FeePayment", back_populates="voucher")


class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    voucher_id = Column(Integer, ForeignKey("fee_vouchers.id"), nullable=False)
    amount_paid = Column(DECIMAL(10, 2), nullable=False)
    payment_date = Column(TIMESTAMP, server_default=func.now())
    payment_method = Column(
        Enum("cash", "bank_transfer", "credit_card", "online"),
        nullable=False
    )
    reference_number = Column(String(100), nullable=True)
    bank_name = Column(String(100), nullable=True)
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    receipt_number = Column(String(50), unique=True, nullable=True)

    # Relationships
    voucher = relationship("FeeVoucher", back_populates="payments")
    receiver = relationship("User", foreign_keys=[received_by])