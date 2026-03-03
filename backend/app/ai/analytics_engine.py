from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Optional
from app.models.attendance import AttendanceSummary, CampusAttendance
from app.models.assessment import (
    AssignmentSubmission, QuizAttempt, ExamResult
)
from app.models.enrollment import Enrollment, CourseOffering
from app.models.ai_analytics import StudentPerformanceScore
from app.models.academic import Semester


class AnalyticsEngine:
    """
    Student Performance Score calculate karne ka engine.

    Score Components:
    - Lecture Attendance     → 25%
    - Campus Presence        → 10%
    - Assignment Consistency → 20%
    - Quiz Accuracy          → 20%
    - GPA Factor             → 25%
    """

    # Weights
    WEIGHTS = {
        "lecture_attendance": 0.25,
        "campus_presence": 0.10,
        "assignment_consistency": 0.20,
        "quiz_accuracy": 0.20,
        "gpa_factor": 0.25
    }

    @staticmethod
    def calculate_for_student(
        db: Session,
        student_id: int,
        semester_id: int
    ) -> dict:

        breakdown = {}

        # ── 1. Lecture Attendance Score ──────────────────
        summaries = db.query(AttendanceSummary).join(
            CourseOffering
        ).filter(
            AttendanceSummary.student_id == student_id,
            CourseOffering.semester_id == semester_id
        ).all()

        if summaries:
            avg_attendance = sum(
                float(s.percentage) for s in summaries
            ) / len(summaries)
        else:
            avg_attendance = 0.0

        lecture_score = min(avg_attendance, 100)
        breakdown["lecture_attendance"] = round(lecture_score, 2)

        # ── 2. Campus Presence Score ─────────────────────
        semester = db.query(Semester).filter(
            Semester.id == semester_id
        ).first()

        if semester:
            total_campus_days = db.query(
                func.count(func.distinct(
                    func.date(CampusAttendance.entry_time)
                ))
            ).filter(
                CampusAttendance.entry_time >= semester.start_date,
                CampusAttendance.entry_time <= semester.end_date,
                CampusAttendance.is_duplicate_filtered == False
            ).scalar() or 0

            student_campus_days = db.query(
                func.count(func.distinct(
                    func.date(CampusAttendance.entry_time)
                ))
            ).filter(
                CampusAttendance.student_id == student_id,
                CampusAttendance.entry_time >= semester.start_date,
                CampusAttendance.entry_time <= semester.end_date,
                CampusAttendance.entry_direction == "in",
                CampusAttendance.is_duplicate_filtered == False
            ).scalar() or 0

            campus_score = (
                (student_campus_days / total_campus_days * 100)
                if total_campus_days > 0 else 0
            )
        else:
            campus_score = 0.0

        breakdown["campus_presence"] = round(campus_score, 2)

        # ── 3. Assignment Consistency Score ──────────────
        # Enrolled offerings
        offering_ids = [
            e.offering_id for e in
            db.query(Enrollment).join(CourseOffering).filter(
                Enrollment.student_id == student_id,
                CourseOffering.semester_id == semester_id,
                Enrollment.status == "enrolled"
            ).all()
        ]

        from app.models.assessment import Assignment
        total_assignments = db.query(func.count(Assignment.id)).filter(
            Assignment.offering_id.in_(offering_ids)
        ).scalar() or 0

        submitted_on_time = db.query(
            func.count(AssignmentSubmission.id)
        ).join(Assignment).filter(
            AssignmentSubmission.student_id == student_id,
            Assignment.offering_id.in_(offering_ids),
            AssignmentSubmission.status.in_(["submitted", "graded"])
        ).scalar() or 0

        assignment_score = (
            (submitted_on_time / total_assignments * 100)
            if total_assignments > 0 else 0
        )
        breakdown["assignment_consistency"] = round(assignment_score, 2)

        # ── 4. Quiz Accuracy Score ───────────────────────
        from app.models.assessment import Quiz
        attempts = db.query(QuizAttempt).join(Quiz).filter(
            QuizAttempt.student_id == student_id,
            Quiz.offering_id.in_(offering_ids),
            QuizAttempt.status == "completed"
        ).all()

        if attempts:
            avg_quiz = sum(
                float(a.percentage) for a in attempts
            ) / len(attempts)
        else:
            avg_quiz = 0.0

        breakdown["quiz_accuracy"] = round(avg_quiz, 2)

        # ── 5. GPA Factor ────────────────────────────────
        enrollments = db.query(Enrollment).join(CourseOffering).filter(
            Enrollment.student_id == student_id,
            CourseOffering.semester_id == semester_id,
            Enrollment.grade_points.isnot(None)
        ).all()

        if enrollments:
            avg_gp = sum(
                float(e.grade_points) for e in enrollments
            ) / len(enrollments)
            gpa_score = (avg_gp / 4.0) * 100
        else:
            gpa_score = 0.0

        breakdown["gpa_factor"] = round(gpa_score, 2)

        # ── Final Academic Score ──────────────────────────
        weights = AnalyticsEngine.WEIGHTS
        academic_score = (
            breakdown["lecture_attendance"] * weights["lecture_attendance"] +
            breakdown["campus_presence"] * weights["campus_presence"] +
            breakdown["assignment_consistency"] * weights["assignment_consistency"] +
            breakdown["quiz_accuracy"] * weights["quiz_accuracy"] +
            breakdown["gpa_factor"] * weights["gpa_factor"]
        )
        academic_score = round(min(academic_score, 100), 2)

        # ── Engagement Level ─────────────────────────────
        if academic_score >= 75:
            engagement = "high"
        elif academic_score >= 50:
            engagement = "medium"
        else:
            engagement = "low"

        # ── Risk Prediction ──────────────────────────────
        risk = AnalyticsEngine._predict_risk(breakdown)

        # ── Weak Subjects ─────────────────────────────────
        weak_subjects = AnalyticsEngine._find_weak_subjects(
            db, student_id, offering_ids
        )

        # ── Recommendations ───────────────────────────────
        recommendations = AnalyticsEngine._generate_recommendations(
            breakdown, weak_subjects, risk
        )

        # ── Consistency Index ─────────────────────────────
        scores_list = list(breakdown.values())
        if len(scores_list) > 1:
            mean = sum(scores_list) / len(scores_list)
            variance = sum((x - mean) ** 2 for x in scores_list) / len(scores_list)
            std_dev = variance ** 0.5
            consistency = max(0, round(100 - std_dev, 2))
        else:
            consistency = 50.0

        return {
            "student_id": student_id,
            "semester_id": semester_id,
            "academic_score": academic_score,
            "consistency_index": consistency,
            "engagement_level": engagement,
            "risk_prediction": risk,
            "weak_subjects": weak_subjects,
            "recommendations": recommendations,
            "score_breakdown": breakdown
        }

    @staticmethod
    def _predict_risk(breakdown: dict) -> dict:
        risk_factors = []
        risk_level = "low"

        if breakdown["lecture_attendance"] < 75:
            risk_factors.append("Low lecture attendance")
        if breakdown["assignment_consistency"] < 50:
            risk_factors.append("Missing assignments")
        if breakdown["quiz_accuracy"] < 50:
            risk_factors.append("Poor quiz performance")
        if breakdown["gpa_factor"] < 50:
            risk_factors.append("Low GPA")
        if breakdown["campus_presence"] < 50:
            risk_factors.append("Low campus presence")

        if len(risk_factors) >= 3:
            risk_level = "high"
        elif len(risk_factors) >= 1:
            risk_level = "medium"

        return {
            "level": risk_level,
            "factors": risk_factors,
            "at_risk": risk_level in ["medium", "high"]
        }

    @staticmethod
    def _find_weak_subjects(
        db: Session,
        student_id: int,
        offering_ids: list
    ) -> list:
        weak = []
        for offering_id in offering_ids:
            summary = db.query(AttendanceSummary).filter(
                AttendanceSummary.student_id == student_id,
                AttendanceSummary.offering_id == offering_id
            ).first()

            if summary and float(summary.percentage) < 75:
                offering = db.query(CourseOffering).filter(
                    CourseOffering.id == offering_id
                ).first()
                if offering and offering.course:
                    weak.append({
                        "course": offering.course.name,
                        "code": offering.course.code,
                        "attendance": float(summary.percentage),
                        "reason": "Low attendance"
                    })

        return weak

    @staticmethod
    def _generate_recommendations(
        breakdown: dict,
        weak_subjects: list,
        risk: dict
    ) -> list:
        recs = []

        if breakdown["lecture_attendance"] < 75:
            recs.append({
                "type": "attendance",
                "priority": "high",
                "message": "Attend more lectures to avoid shortage"
            })

        if breakdown["quiz_accuracy"] < 60:
            recs.append({
                "type": "quiz",
                "priority": "medium",
                "message": "Practice AI quizzes to improve accuracy"
            })

        if breakdown["assignment_consistency"] < 70:
            recs.append({
                "type": "assignment",
                "priority": "high",
                "message": "Submit assignments on time consistently"
            })

        if weak_subjects:
            recs.append({
                "type": "subjects",
                "priority": "high",
                "message": f"Focus on: {', '.join(s['course'] for s in weak_subjects)}"
            })

        if not recs:
            recs.append({
                "type": "general",
                "priority": "low",
                "message": "Great performance! Keep it up."
            })

        return recs

    @staticmethod
    def save_score(db: Session, data: dict) -> StudentPerformanceScore:
        existing = db.query(StudentPerformanceScore).filter(
            StudentPerformanceScore.student_id == data["student_id"],
            StudentPerformanceScore.semester_id == data["semester_id"]
        ).first()

        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            existing.calculated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing

        score = StudentPerformanceScore(
            **data,
            recommendations_generated_at=datetime.now(timezone.utc)
        )
        db.add(score)
        db.commit()
        db.refresh(score)
        return score

    @staticmethod
    def calculate_ranks(db: Session, semester_id: int):
        # Sab scores lao is semester ke
        scores = db.query(StudentPerformanceScore).filter(
            StudentPerformanceScore.semester_id == semester_id
        ).order_by(
            StudentPerformanceScore.academic_score.desc()
        ).all()

        for rank, score in enumerate(scores, 1):
            score.class_rank = rank

        db.commit()
        return len(scores)