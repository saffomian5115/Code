from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.core.database import get_db
from app.core.dependencies import (
    get_current_user, require_admin, require_teacher
)
from app.services.attendance_service import (
    LectureSessionService, AttendanceService,
    GateService, CampusAttendanceService
)
from app.schemas.attendance import (
    LectureSessionCreateRequest,
    BulkAttendanceRequest,
    AttendanceUpdateRequest,
    GateCreateRequest, GateUpdateRequest,
    CameraCreateRequest, GateScheduleRequest,
    CampusAttendanceCreateRequest, ManualOverrideRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Attendance"])


# ════════════════════════════════════════════════════════
# LEVEL 1 — LECTURE SESSIONS
# ════════════════════════════════════════════════════════

@router.post("/sessions")
def create_session(
    request: LectureSessionCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    session, error = LectureSessionService.create(
        db, request.model_dump(), teacher_id=current_user.id
    )
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": session.id,
        "offering_id": session.offering_id,
        "session_date": str(session.session_date),
        "start_time": str(session.start_time),
        "end_time": str(session.end_time),
        "topic": session.topic,
        "session_type": session.session_type
    }, "Session created successfully", status_code=201)


@router.get("/offerings/{offering_id}/sessions")
def get_sessions(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    sessions = LectureSessionService.get_offering_sessions(db, offering_id)
    data = [{
        "id": s.id,
        "session_date": str(s.session_date),
        "start_time": str(s.start_time),
        "end_time": str(s.end_time),
        "topic": s.topic,
        "session_type": s.session_type,
        "is_makeup": s.is_makeup,
        "attendance_marked": s.attendance_marked,
        "marked_at": str(s.marked_at) if s.marked_at else None
    } for s in sessions]

    return success_response({
        "offering_id": offering_id,
        "total_sessions": len(data),
        "sessions": data
    }, "Sessions retrieved")


# ════════════════════════════════════════════════════════
# LEVEL 1 — LECTURE ATTENDANCE
# ════════════════════════════════════════════════════════

@router.post("/sessions/{session_id}/attendance")
def mark_attendance(
    session_id: int,
    request: BulkAttendanceRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    records = [r.model_dump() for r in request.records]
    result, error = AttendanceService.mark_bulk(
        db, session_id, records, marked_by=current_user.id
    )
    if error:
        return error_response(error, "ATTENDANCE_FAILED")

    return success_response({
        "session_id": session_id,
        "total_marked": len(result),
        "present": sum(1 for r in records if r["status"] == "present"),
        "absent": sum(1 for r in records if r["status"] == "absent"),
        "late": sum(1 for r in records if r["status"] == "late"),
        "excused": sum(1 for r in records if r["status"] == "excused")
    }, "Attendance marked successfully")


@router.get("/sessions/{session_id}/attendance")
def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    records = AttendanceService.get_session_attendance(db, session_id)
    data = [{
        "student_id": r.student_id,
        "roll_number": r.student.roll_number if r.student else None,
        "full_name": r.student.student_profile.full_name
            if r.student and r.student.student_profile else None,
        "status": r.status,
        "remarks": r.remarks,
        "marked_at": str(r.marked_at)
    } for r in records]

    return success_response({
        "session_id": session_id,
        "total": len(data),
        "records": data
    }, "Session attendance retrieved")


@router.patch("/sessions/{session_id}/attendance/{student_id}")
def update_attendance(
    session_id: int,
    student_id: int,
    request: AttendanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    record, error = AttendanceService.update_single(
        db, session_id, student_id,
        status=request.status,
        remarks=request.remarks,
        marked_by=current_user.id
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response({
        "student_id": student_id,
        "status": record.status,
        "remarks": record.remarks
    }, "Attendance updated successfully")


@router.get("/students/{student_id}/attendance")
def get_student_attendance(
    student_id: int,
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    records = AttendanceService.get_student_attendance(db, student_id, offering_id)
    summary = AttendanceService.get_summary(db, student_id, offering_id)

    data = [{
        "session_date": str(r.session.session_date),
        "topic": r.session.topic,
        "session_type": r.session.session_type,
        "status": r.status,
        "remarks": r.remarks
    } for r in records]

    return success_response({
        "student_id": student_id,
        "offering_id": offering_id,
        "summary": {
            "total_classes": summary.total_classes if summary else 0,
            "attended_classes": summary.attended_classes if summary else 0,
            "percentage": float(summary.percentage) if summary else 0.0,
            "min_required": float(summary.min_percentage_required) if summary else 75.0,
            "alert_triggered": summary.alert_triggered if summary else False
        },
        "records": data
    }, "Student attendance retrieved")


@router.get("/offerings/{offering_id}/short-attendance")
def get_short_attendance(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    summaries = AttendanceService.get_short_attendance_students(db, offering_id)
    data = [{
        "student_id": s.student_id,
        "roll_number": s.student.roll_number if s.student else None,
        "full_name": s.student.student_profile.full_name
            if s.student and s.student.student_profile else None,
        "total_classes": s.total_classes,
        "attended_classes": s.attended_classes,
        "percentage": float(s.percentage),
        "shortage": float(s.min_percentage_required - s.percentage)
    } for s in summaries]

    return success_response({
        "offering_id": offering_id,
        "short_attendance_count": len(data),
        "students": data
    }, "Short attendance students retrieved")


# ════════════════════════════════════════════════════════
# LEVEL 2 — CAMPUS GATES
# ════════════════════════════════════════════════════════

@router.post("/gates")
def create_gate(
    request: GateCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    gate, error = GateService.create_gate(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": gate.id,
        "gate_name": gate.gate_name,
        "gate_code": gate.gate_code,
        "gate_type": gate.gate_type,
        "is_active": gate.is_active
    }, "Gate created successfully", status_code=201)


@router.get("/gates")
def get_gates(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    gates = GateService.get_all_gates(db)
    data = [{
        "id": g.id,
        "gate_name": g.gate_name,
        "gate_code": g.gate_code,
        "gate_type": g.gate_type,
        "location_description": g.location_description,
        "is_active": g.is_active,
        "last_ping": str(g.last_ping) if g.last_ping else None,
        "total_cameras": len(g.cameras)
    } for g in gates]

    return success_response({"gates": data}, "Gates retrieved")


@router.get("/gates/{gate_id}")
def get_gate(
    gate_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    gate = GateService.get_gate_by_id(db, gate_id)
    if not gate:
        return error_response("Gate not found", "NOT_FOUND", status_code=404)

    return success_response({
        "id": gate.id,
        "gate_name": gate.gate_name,
        "gate_code": gate.gate_code,
        "gate_type": gate.gate_type,
        "location_description": gate.location_description,
        "ip_address": gate.ip_address,
        "device_model": gate.device_model,
        "is_active": gate.is_active,
        "last_ping": str(gate.last_ping) if gate.last_ping else None,
        "cameras": [{
            "id": c.id,
            "camera_name": c.camera_name,
            "camera_type": c.camera_type,
            "is_primary": c.is_primary,
            "status": c.status
        } for c in gate.cameras],
        "schedules": [{
            "day_of_week": s.day_of_week,
            "open_time": str(s.open_time),
            "close_time": str(s.close_time),
            "is_holiday": s.is_holiday
        } for s in gate.schedules]
    })


@router.put("/gates/{gate_id}")
def update_gate(
    gate_id: int,
    request: GateUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    gate, error = GateService.update_gate(
        db, gate_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="Gate updated successfully")


@router.delete("/gates/{gate_id}")
def delete_gate(
    gate_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    """
    Gate permanently delete karo.
    DB schema mein gate_cameras aur gate_schedules pe ON DELETE CASCADE hai,
    is liye linked cameras/schedules automatically delete ho jati hain.
    campus_attendance mein gate_id FK hai — pehle wo delete karo.
    """
    gate = GateService.get_gate_by_id(db, gate_id)
    if not gate:
        return error_response("Gate not found", "NOT_FOUND", status_code=404)

    gate_name = gate.gate_name
    try:
        from sqlalchemy import text
        # campus_attendance aur face_recognition_logs mein FK hai — pehle delete karo
        db.execute(text("DELETE FROM face_recognition_logs WHERE gate_id = :id"), {"id": gate_id})
        db.execute(text("DELETE FROM gate_access_logs WHERE gate_id = :id"), {"id": gate_id})
        # camera_health_logs cascade se handle honge (ON DELETE CASCADE via gate_cameras)
        # campus_attendance delete
        db.execute(text("DELETE FROM campus_attendance WHERE gate_id = :id"), {"id": gate_id})
        # Ab gate delete karo (gate_cameras + gate_schedules CASCADE se delete honge)
        db.execute(text("DELETE FROM campus_gates WHERE id = :id"), {"id": gate_id})
        db.commit()
        return success_response(
            {"gate_id": gate_id, "gate_name": gate_name},
            f"Gate '{gate_name}' deleted successfully"
        )
    except Exception as e:
        db.rollback()
        return error_response(str(e), "DELETE_FAILED", status_code=400)


@router.patch("/gates/{gate_id}/ping")
def ping_gate(
    gate_id: int,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    gate, error = GateService.ping_gate(db, gate_id)
    if error:
        return error_response(error, "NOT_FOUND", status_code=404)

    return success_response({
        "gate_id": gate_id,
        "last_ping": str(gate.last_ping)
    }, "Gate ping updated")


@router.post("/gates/{gate_id}/cameras")
def add_camera(
    gate_id: int,
    request: CameraCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    camera, error = GateService.add_camera(db, gate_id, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": camera.id,
        "camera_name": camera.camera_name,
        "gate_id": camera.gate_id,
        "is_primary": camera.is_primary,
        "status": camera.status
    }, "Camera added successfully", status_code=201)


@router.post("/gates/{gate_id}/schedules")
def add_schedule(
    gate_id: int,
    request: GateScheduleRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    """
    Ek din ka schedule set/update karo.
    Existing schedule for same day_of_week update ho jata hai (upsert).
    Frontend se 7 baar call hota hai (ek per day).
    """
    schedule, error = GateService.add_schedule(db, gate_id, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": schedule.id,
        "gate_id": gate_id,
        "day_of_week": schedule.day_of_week,
        "open_time": str(schedule.open_time),
        "close_time": str(schedule.close_time),
        "is_holiday": schedule.is_holiday
    }, "Schedule saved successfully", status_code=201)


# ════════════════════════════════════════════════════════
# LEVEL 2 — CAMPUS ATTENDANCE
# ════════════════════════════════════════════════════════

@router.post("/campus-attendance")
def log_campus_attendance(
    request: CampusAttendanceCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    record, error = CampusAttendanceService.log_entry(
        db, request.model_dump()
    )
    if error:
        return error_response(error, "LOG_FAILED")

    return success_response({
        "id": record.id,
        "student_id": record.student_id,
        "gate_id": record.gate_id,
        "entry_time": str(record.entry_time),
        "entry_direction": record.entry_direction,
        "face_match_confidence": float(record.face_match_confidence),
        "is_duplicate_filtered": record.is_duplicate_filtered
    }, "Campus attendance logged", status_code=201)


@router.post("/campus-attendance/override")
def manual_override(
    request: ManualOverrideRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    record, error = CampusAttendanceService.manual_override(
        db, request.model_dump(), officer_id=admin.id
    )
    if error:
        return error_response(error, "OVERRIDE_FAILED")

    return success_response({
        "id": record.id,
        "student_id": record.student_id,
        "manual_override": record.manual_override,
        "entry_time": str(record.entry_time)
    }, "Manual override logged successfully", status_code=201)


@router.get("/students/{student_id}/campus-attendance")
def get_student_campus_attendance(
    student_id: int,
    date_from: date = None,
    date_to: date = None,
    semester_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    records = CampusAttendanceService.get_student_campus_attendance(
        db, student_id, date_from, date_to
    )

    presence_pct = 0.0
    if semester_id:
        presence_pct = CampusAttendanceService.get_campus_presence_percentage(
            db, student_id, semester_id
        )

    data = [{
        "id": r.id,
        "gate_name": r.gate.gate_name if r.gate else None,
        "entry_time": str(r.entry_time),
        "exit_time": str(r.exit_time) if r.exit_time else None,
        "direction": r.entry_direction,
        "confidence": float(r.face_match_confidence),
        "manual_override": r.manual_override
    } for r in records]

    return success_response({
        "student_id": student_id,
        "campus_presence_percentage": presence_pct,
        "total_records": len(data),
        "records": data
    }, "Campus attendance retrieved")


@router.get("/offerings/{offering_id}/attendance-report")
def get_attendance_report(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    from app.models.attendance import LectureSession, LectureAttendance, AttendanceSummary
    from app.models.enrollment import Enrollment
    from app.models.user import StudentProfile

    sessions = db.query(LectureSession).filter(
        LectureSession.offering_id == offering_id
    ).all()
    total_sessions = len(sessions)
    session_ids = [s.id for s in sessions]

    enrollments = db.query(Enrollment).filter(
        Enrollment.offering_id == offering_id,
        Enrollment.status == "enrolled"
    ).all()

    report = []
    for enrollment in enrollments:
        student = enrollment.student
        profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == enrollment.student_id
        ).first()

        attended = db.query(LectureAttendance).filter(
            LectureAttendance.student_id == enrollment.student_id,
            LectureAttendance.session_id.in_(session_ids),
            LectureAttendance.status.in_(["present", "late"])
        ).count()

        percentage = round((attended / total_sessions * 100), 2) if total_sessions > 0 else 0.0

        report.append({
            "student_id": enrollment.student_id,
            "roll_number": student.roll_number if student else None,
            "full_name": profile.full_name if profile else None,
            "total_sessions": total_sessions,
            "attended": attended,
            "absent": total_sessions - attended,
            "percentage": percentage,
            "status": "short" if percentage < 75 else "ok"
        })

    report.sort(key=lambda x: x["percentage"])

    return success_response({
        "offering_id": offering_id,
        "total_sessions": total_sessions,
        "total_students": len(report),
        "report": report
    }, "Attendance report retrieved")