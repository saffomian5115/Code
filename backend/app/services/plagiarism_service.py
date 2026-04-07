"""
Plagiarism Service
------------------
Connects PlagiarismEngine with the database.
Reads submissions, runs checks, saves results back.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.ai.plagiarism_engine import check_assignment_plagiarism

logger = logging.getLogger(__name__)


class PlagiarismService:

    @staticmethod
    def run_for_assignment(db: Session, assignment_id: int) -> dict:
        """
        1. Load all graded/submitted submissions for assignment_id
        2. Run pairwise similarity check
        3. Save plagiarism_percentage + plagiarism_data back to DB
        4. Return summary
        """
        from app.models.assessment import AssignmentSubmission, Assignment

        assignment = db.query(Assignment).filter(
            Assignment.id == assignment_id
        ).first()
        if not assignment:
            return {"error": "Assignment not found"}

        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.file_path.isnot(None),
        ).all()

        if len(submissions) < 2:
            return {
                "assignment_id":   assignment_id,
                "message":         "Not enough submissions to compare (need ≥ 2)",
                "total_submissions": len(submissions),
            }

        # Build input list for engine
        sub_input = [
            {
                "submission_id": s.id,
                "student_id":    s.student_id,
                "file_path":     s.file_path or "",
            }
            for s in submissions
        ]

        logger.info(
            f"[Plagiarism] Running check for assignment {assignment_id} "
            f"({len(submissions)} submissions)"
        )

        result = check_assignment_plagiarism(sub_input)
        per_sub = result["per_submission"]

        # Save results back to each submission row
        for sub in submissions:
            ps = per_sub.get(sub.id)
            if not ps:
                continue

            sub.plagiarism_percentage = ps["max_similarity"]
            sub.plagiarism_status     = "completed"

            # Store full detail in plagiarism_data JSON column
            sub.plagiarism_data = {
                "max_similarity": ps["max_similarity"],
                "risk_level":     ps["risk_level"],
                "similar_to":     ps["similar_to"],
                "method": "difflib+sentence-transformers",
            }

        db.commit()

        logger.info(
            f"[Plagiarism] Done — "
            f"{result['high_risk_pairs']} high-risk pairs, "
            f"{result['medium_risk_pairs']} medium-risk pairs"
        )

        return {
            "assignment_id":       assignment_id,
            "total_submissions":   len(submissions),
            "total_pairs_checked": result["total_pairs_checked"],
            "high_risk_pairs":     result["high_risk_pairs"],
            "medium_risk_pairs":   result["medium_risk_pairs"],
            "pairs":               result["pairs"],
            "per_submission":      {
                str(k): v for k, v in per_sub.items()
            },
        }

    @staticmethod
    def get_assignment_report(db: Session, assignment_id: int) -> dict:
        """
        Return already-computed plagiarism data for an assignment
        (from DB — no re-computation).
        """
        from app.models.assessment import AssignmentSubmission
        from app.models.user import User

        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.plagiarism_status == "completed",
        ).all()

        data = []
        for s in submissions:
            user = db.query(User).filter(User.id == s.student_id).first()
            full_name = None
            roll      = None
            if user:
                roll = user.roll_number
                if user.student_profile:
                    full_name = user.student_profile.full_name

            data.append({
                "submission_id":        s.id,
                "student_id":           s.student_id,
                "full_name":            full_name,
                "roll_number":          roll,
                "plagiarism_percentage": float(s.plagiarism_percentage or 0),
                "risk_level": (
                    s.plagiarism_data.get("risk_level", "low")
                    if isinstance(s.plagiarism_data, dict) else "low"
                ),
                "similar_to": (
                    s.plagiarism_data.get("similar_to", [])
                    if isinstance(s.plagiarism_data, dict) else []
                ),
                "plagiarism_data": s.plagiarism_data,
            })

        # Summary stats
        if data:
            scores   = [d["plagiarism_percentage"] for d in data]
            high     = sum(1 for d in data if d["risk_level"] == "high")
            medium   = sum(1 for d in data if d["risk_level"] == "medium")
            avg_pct  = round(sum(scores) / len(scores), 2)
        else:
            high = medium = 0
            avg_pct = 0.0

        return {
            "assignment_id":     assignment_id,
            "checked_count":     len(data),
            "high_risk_count":   high,
            "medium_risk_count": medium,
            "avg_similarity":    avg_pct,
            "submissions":       data,
        }