from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date, timezone
from typing import List
from app.models.attendance import (
    LectureSession, LectureAttendance, AttendanceSummary,
    CampusGate, GateCamera, GateSchedule,
    CampusAttendance, FaceRecognitionLog, GateAccessLog
)
from app.models.enrollment import Enrollment, CourseOffering


class LectureSessionService:

    @staticmethod
    def create(db: Session, data: dict, teacher_id: int):
        # Offering exist check
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == data["offering_id"],
            CourseOffering.is_active == True
        ).first()
        if not offering:
            return None, "Course offering not found or inactive"

        # Same date duplicate check
        existing = db.query(LectureSession).filter(
            LectureSession.offering_id == data["offering_id"],
            LectureSession.session_date == data["session_date"],
            LectureSession.start_time == data["start_time"]
        ).first()
        if existing:
            return None, "Session already exists for this date and time"

        session = LectureSession(**data)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session, None

    @staticmethod
    def get_offering_sessions(db: Session, offering_id: int):
        return db.query(LectureSession).filter(
            LectureSession.offering_id == offering_id
        ).order_by(LectureSession.session_date.desc()).all()

    @staticmethod
    def get_by_id(db: Session, session_id: int):
        return db.query(LectureSession).filter(
            LectureSession.id == session_id
        ).first()


class AttendanceService:

    @staticmethod
    def mark_bulk(
        db: Session,
        session_id: int,
        records: list,
        marked_by: int
    ):
        session = db.query(LectureSession).filter(
            LectureSession.id == session_id
        ).first()
        if not session:
            return None, "Session not found"

        if session.attendance_marked:
            return None, "Attendance already marked for this session"

        marked = []
        for record in records:
            # Already exist check
            existing = db.query(LectureAttendance).filter(
                LectureAttendance.session_id == session_id,
                LectureAttendance.student_id == record["student_id"]
            ).first()

            if existing:
                existing.status = record["status"]
                existing.remarks = record.get("remarks")
                marked.append(existing)
            else:
                att = LectureAttendance(
                    session_id=session_id,
                    student_id=record["student_id"],
                    status=record["status"],
                    marked_by=marked_by,
                    remarks=record.get("remarks")
                )
                db.add(att)
                marked.append(att)

        # Session ko mark karo
        session.attendance_marked = True
        session.marked_by = marked_by
        session.marked_at = datetime.now(timezone.utc)

        db.commit()

        # Summary update karo
        offering_id = session.offering_id
        student_ids = [r["student_id"] for r in records]
        for student_id in student_ids:
            AttendanceService._update_summary(db, student_id, offering_id)

        return marked, None

    @staticmethod
    def update_single(
        db: Session,
        session_id: int,
        student_id: int,
        status: str,
        remarks: str,
        marked_by: int
    ):
        record = db.query(LectureAttendance).filter(
            LectureAttendance.session_id == session_id,
            LectureAttendance.student_id == student_id
        ).first()

        if not record:
            return None, "Attendance record not found"

        record.status = status
        record.remarks = remarks
        record.marked_by = marked_by
        db.commit()

        # Summary refresh
        session = record.session
        AttendanceService._update_summary(db, student_id, session.offering_id)

        return record, None

    @staticmethod
    def get_session_attendance(db: Session, session_id: int):
        return db.query(LectureAttendance).filter(
            LectureAttendance.session_id == session_id
        ).all()

    @staticmethod
    def get_student_attendance(db: Session, student_id: int, offering_id: int):
        return (
            db.query(LectureAttendance)
            .join(LectureSession)
            .filter(
                LectureAttendance.student_id == student_id,
                LectureSession.offering_id == offering_id
            )
            .all()
        )

    @staticmethod
    def get_summary(db: Session, student_id: int, offering_id: int):
        return db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id,
            AttendanceSummary.offering_id == offering_id
        ).first()

    @staticmethod
    def get_short_attendance_students(db: Session, offering_id: int):
        # 75% se kam wale students
        return db.query(AttendanceSummary).filter(
            AttendanceSummary.offering_id == offering_id,
            AttendanceSummary.percentage < AttendanceSummary.min_percentage_required
        ).all()

    @staticmethod
    def _update_summary(db: Session, student_id: int, offering_id: int):
        # Total sessions count
        total = db.query(func.count(LectureSession.id)).filter(
            LectureSession.offering_id == offering_id,
            LectureSession.attendance_marked == True
        ).scalar()

        # Present + Late count (dono attended consider honge)
        attended = (
            db.query(func.count(LectureAttendance.id))
            .join(LectureSession)
            .filter(
                LectureAttendance.student_id == student_id,
                LectureSession.offering_id == offering_id,
                LectureAttendance.status.in_(["present", "late"])
            )
            .scalar()
        )

        percentage = round((attended / total * 100), 2) if total > 0 else 0.0
        alert = percentage < 75

        summary = db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student_id,
            AttendanceSummary.offering_id == offering_id
        ).first()

        if summary:
            summary.total_classes = total
            summary.attended_classes = attended
            summary.percentage = percentage
            summary.alert_triggered = alert
            summary.last_updated = date.today()
        else:
            summary = AttendanceSummary(
                student_id=student_id,
                offering_id=offering_id,
                total_classes=total,
                attended_classes=attended,
                percentage=percentage,
                alert_triggered=alert,
                last_updated=date.today()
            )
            db.add(summary)

        db.commit()


class GateService:

    @staticmethod
    def create_gate(db: Session, data: dict):
        if db.query(CampusGate).filter(
            CampusGate.gate_code == data["gate_code"]
        ).first():
            return None, "Gate code already exists"

        gate = CampusGate(**data)
        db.add(gate)
        db.commit()
        db.refresh(gate)
        return gate, None

    @staticmethod
    def get_all_gates(db: Session):
        return db.query(CampusGate).all()

    @staticmethod
    def get_gate_by_id(db: Session, gate_id: int):
        return db.query(CampusGate).filter(CampusGate.id == gate_id).first()

    @staticmethod
    def update_gate(db: Session, gate_id: int, data: dict):
        gate = db.query(CampusGate).filter(CampusGate.id == gate_id).first()
        if not gate:
            return None, "Gate not found"
        for key, value in data.items():
            setattr(gate, key, value)
        db.commit()
        db.refresh(gate)
        return gate, None

    @staticmethod
    def add_camera(db: Session, gate_id: int, data: dict):
        gate = db.query(CampusGate).filter(CampusGate.id == gate_id).first()
        if not gate:
            return None, "Gate not found"

        # Agar primary mark kiya to baaki primary hata do
        if data.get("is_primary"):
            db.query(GateCamera).filter(
                GateCamera.gate_id == gate_id
            ).update({"is_primary": False})

        camera = GateCamera(gate_id=gate_id, **data)
        db.add(camera)
        db.commit()
        db.refresh(camera)
        return camera, None

    @staticmethod
    def add_schedule(db: Session, gate_id: int, data: dict):
        gate = db.query(CampusGate).filter(CampusGate.id == gate_id).first()
        if not gate:
            return None, "Gate not found"

        # Existing day schedule update karo
        existing = db.query(GateSchedule).filter(
            GateSchedule.gate_id == gate_id,
            GateSchedule.day_of_week == data["day_of_week"]
        ).first()

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            db.commit()
            return existing, None

        schedule = GateSchedule(gate_id=gate_id, **data)
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule, None

    @staticmethod
    def ping_gate(db: Session, gate_id: int):
        gate = db.query(CampusGate).filter(CampusGate.id == gate_id).first()
        if not gate:
            return None, "Gate not found"
        gate.last_ping = datetime.now(timezone.utc)
        db.commit()
        return gate, None


class CampusAttendanceService:

    DUPLICATE_WINDOW_MINUTES = 5  # 5 min mein same student dobara nahi

    @staticmethod
    def log_entry(db: Session, data: dict):
        student_id = data["student_id"]
        gate_id = data["gate_id"]

        # Duplicate filter — same student same gate pe 5 min mein
        from datetime import timedelta
        recent_cutoff = datetime.now(timezone.utc) - timedelta(
            minutes=CampusAttendanceService.DUPLICATE_WINDOW_MINUTES
        )

        duplicate = db.query(CampusAttendance).filter(
            CampusAttendance.student_id == student_id,
            CampusAttendance.gate_id == gate_id,
            CampusAttendance.entry_time >= recent_cutoff
        ).first()

        if duplicate:
            # Duplicate mark karo log mein
            data["is_duplicate_filtered"] = True

        data["entry_time"] = datetime.now(timezone.utc)

        record = CampusAttendance(**data)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record, None

    @staticmethod
    def manual_override(db: Session, data: dict, officer_id: int):
        record = CampusAttendance(
            student_id=data["student_id"],
            gate_id=data["gate_id"],
            camera_id=data["camera_id"],
            entry_time=datetime.now(timezone.utc),
            entry_direction=data["entry_direction"],
            face_match_confidence=100.0,
            manual_override=True,
            override_by=officer_id,
            override_reason=data["reason"]
        )
        db.add(record)

        # Log bhi banao
        log = GateAccessLog(
            gate_id=data["gate_id"],
            accessed_by=officer_id,
            access_type="manual_override",
            reason=data["reason"]
        )
        db.add(log)
        db.commit()
        db.refresh(record)
        return record, None

    @staticmethod
    def get_student_campus_attendance(
        db: Session,
        student_id: int,
        date_from: date = None,
        date_to: date = None
    ):
        query = db.query(CampusAttendance).filter(
            CampusAttendance.student_id == student_id,
            CampusAttendance.is_duplicate_filtered == False
        )
        if date_from:
            query = query.filter(
                func.date(CampusAttendance.entry_time) >= date_from
            )
        if date_to:
            query = query.filter(
                func.date(CampusAttendance.entry_time) <= date_to
            )
        return query.order_by(CampusAttendance.entry_time.desc()).all()

    @staticmethod
    def get_campus_presence_percentage(db: Session, student_id: int, semester_id: int):
        # Semester dates lao
        from app.models.academic import Semester
        semester = db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            return 0.0

        # Total working days (distinct dates)
        total_days = db.query(
            func.count(func.distinct(func.date(CampusAttendance.entry_time)))
        ).filter(
            CampusAttendance.entry_time >= semester.start_date,
            CampusAttendance.entry_time <= semester.end_date,
            CampusAttendance.is_duplicate_filtered == False
        ).scalar()

        # Student present days
        present_days = db.query(
            func.count(func.distinct(func.date(CampusAttendance.entry_time)))
        ).filter(
            CampusAttendance.student_id == student_id,
            CampusAttendance.entry_time >= semester.start_date,
            CampusAttendance.entry_time <= semester.end_date,
            CampusAttendance.entry_direction == "in",
            CampusAttendance.is_duplicate_filtered == False
        ).scalar()

        if total_days == 0:
            return 0.0

        return round((present_days / total_days * 100), 2)