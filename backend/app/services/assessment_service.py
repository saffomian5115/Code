from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Dict
from app.models.assessment import (
    Assignment, AssignmentSubmission,
    Quiz, QuizQuestion, QuizAttempt,
    AIQuiz, Exam, ExamResult
)
from app.models.enrollment import Enrollment, CourseOffering


class AssignmentService:

    @staticmethod
    def create(db: Session, data: dict, teacher_id: int):
        # Offering exist check
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == data["offering_id"]
        ).first()
        if not offering:
            return None, "Course offering not found"

        data["created_by"] = teacher_id
        assignment = Assignment(**data)
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment, None

    @staticmethod
    def get_offering_assignments(db: Session, offering_id: int):
        return db.query(Assignment).filter(
            Assignment.offering_id == offering_id
        ).order_by(Assignment.due_date.asc()).all()

    @staticmethod
    def get_by_id(db: Session, assignment_id: int):
        return db.query(Assignment).filter(
            Assignment.id == assignment_id
        ).first()

    @staticmethod
    def update(db: Session, assignment_id: int, data: dict):
        assignment = db.query(Assignment).filter(
            Assignment.id == assignment_id
        ).first()
        if not assignment:
            return None, "Assignment not found"

        for key, value in data.items():
            setattr(assignment, key, value)

        db.commit()
        db.refresh(assignment)
        return assignment, None

    @staticmethod
    def submit(db: Session, assignment_id: int, student_id: int, data: dict):
        assignment = db.query(Assignment).filter(
            Assignment.id == assignment_id
        ).first()
        if not assignment:
            return None, "Assignment not found"

        # Already submitted check
        existing = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_id
        ).first()
        if existing:
            return None, "Assignment already submitted"

        # Late check
        now = datetime.now(timezone.utc)
        status = "late" if now > assignment.due_date.replace(
            tzinfo=timezone.utc
        ) else "submitted"

        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student_id,
            file_path=data["file_path"],
            remarks=data.get("remarks"),
            status=status
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission, None

    @staticmethod
    def get_submissions(db: Session, assignment_id: int):
        return db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id
        ).all()

    @staticmethod
    def get_student_submission(db: Session, assignment_id: int, student_id: int):
        return db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_id
        ).first()

    @staticmethod
    def grade_submission(
        db: Session,
        submission_id: int,
        obtained_marks: float,
        feedback: str,
        graded_by: int,
        status: str
    ):
        submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.id == submission_id
        ).first()
        if not submission:
            return None, "Submission not found"

        # Marks exceed check
        assignment = submission.assignment
        if obtained_marks > assignment.total_marks:
            return None, f"Marks cannot exceed total marks ({assignment.total_marks})"

        submission.obtained_marks = obtained_marks
        submission.feedback = feedback
        submission.graded_by = graded_by
        submission.graded_at = datetime.now(timezone.utc)
        submission.status = status

        db.commit()
        db.refresh(submission)
        return submission, None

    @staticmethod
    def delete(db: Session, assignment_id: int):
        assignment = db.query(Assignment).filter(
            Assignment.id == assignment_id
        ).first()
        if not assignment:
            return False, "Assignment not found", 404

        try:
            # Delete submissions first (cascade ke bawajood explicit delete)
            db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment_id
            ).delete(synchronize_session=False)

            db.delete(assignment)
            db.commit()
            return True, None, 200
        except Exception as e:
            db.rollback()
            return False, str(e), 400


class QuizService:

    @staticmethod
    def create(db: Session, data: dict, teacher_id: int):
        questions_data = data.pop("questions", [])

        data["created_by"] = teacher_id
        data["total_questions"] = len(questions_data)
        data["quiz_type"] = "teacher"

        quiz = Quiz(**data)
        db.add(quiz)
        db.flush()

        # Questions add karo
        for q in questions_data:
            question = QuizQuestion(quiz_id=quiz.id, **q)
            db.add(question)

        db.commit()
        db.refresh(quiz)
        return quiz, None

    @staticmethod
    def get_offering_quizzes(db: Session, offering_id: int):
        return db.query(Quiz).filter(
            Quiz.offering_id == offering_id,
            Quiz.quiz_type == "teacher"
        ).all()

    @staticmethod
    def get_by_id(db: Session, quiz_id: int):
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()

    @staticmethod
    def get_questions(db: Session, quiz_id: int, shuffle: bool = False):
        questions = db.query(QuizQuestion).filter(
            QuizQuestion.quiz_id == quiz_id
        ).all()

        if shuffle:
            import random
            random.shuffle(questions)

        return questions

    @staticmethod
    def start_attempt(db: Session, quiz_id: int, student_id: int):
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            return None, "Quiz not found"

        # ── FIX: Check for existing attempt BEFORE any INSERT
        # This prevents the (1062) Duplicate entry DB constraint error
        existing = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == student_id
        ).first()
        if existing:
            if existing.status == "completed":
                return None, "Quiz already completed"
            # Resume in_progress attempt — return it directly
            return existing, None

        # Time check (only for new attempts)
        now = datetime.now(timezone.utc)
        if quiz.start_time and now < quiz.start_time.replace(tzinfo=timezone.utc):
            return None, "Quiz has not started yet"
        if quiz.end_time and now > quiz.end_time.replace(tzinfo=timezone.utc):
            return None, "Quiz time has ended"

        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student_id,
            total_marks=quiz.total_marks,
            status="in_progress"
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt, None

    @staticmethod
    def submit_attempt(
        db: Session,
        quiz_id: int,
        student_id: int,
        answers: Dict[int, str]
    ):
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == student_id,
            QuizAttempt.status == "in_progress"
        ).first()
        if not attempt:
            return None, "No active attempt found"

        # Auto grading
        questions = db.query(QuizQuestion).filter(
            QuizQuestion.quiz_id == quiz_id
        ).all()

        score = 0
        for q in questions:
            student_ans = answers.get(q.id, "").strip().lower()
            correct_ans = q.correct_answer.strip().lower()
            if student_ans == correct_ans:
                score += q.marks

        percentage = round((score / attempt.total_marks * 100), 2) \
            if attempt.total_marks > 0 else 0

        attempt.answers = answers
        attempt.score = score
        attempt.percentage = percentage
        attempt.end_time = datetime.now(timezone.utc)
        attempt.status = "completed"

        db.commit()
        db.refresh(attempt)
        return attempt, None

    @staticmethod
    def get_attempt(db: Session, quiz_id: int, student_id: int):
        return db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == student_id
        ).first()

    @staticmethod
    def get_quiz_attempts(db: Session, quiz_id: int):
        return db.query(QuizAttempt).filter(
            QuizAttempt.quiz_id == quiz_id
        ).order_by(QuizAttempt.score.desc()).all()


class AIQuizService:

    @staticmethod
    def generate(db: Session, student_id: int, data: dict):
        topic = data["topic"]
        difficulty = data["difficulty"]
        num_q = data.get("num_questions", 5)

        placeholder_questions = []
        for i in range(1, num_q + 1):
            placeholder_questions.append({
                "id": i,
                "question": f"Sample {difficulty} question {i} about {topic}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": f"Explanation for question {i}"
            })

        ai_quiz = AIQuiz(
            student_id=student_id,
            course_id=data["course_id"],
            topic=topic,
            difficulty=difficulty,
            questions_generated=placeholder_questions
        )
        db.add(ai_quiz)
        db.commit()
        db.refresh(ai_quiz)
        return ai_quiz, None

    @staticmethod
    def submit(db: Session, ai_quiz_id: int, student_id: int, answers: Dict[int, str]):
        ai_quiz = db.query(AIQuiz).filter(
            AIQuiz.id == ai_quiz_id,
            AIQuiz.student_id == student_id
        ).first()
        if not ai_quiz:
            return None, "AI Quiz not found"

        questions = ai_quiz.questions_generated
        score = 0
        weak_areas = []

        for q in questions:
            q_id = q["id"]
            student_ans = answers.get(q_id, "").strip().lower()
            correct_ans = q["correct_answer"].strip().lower()

            if student_ans != correct_ans:
                weak_areas.append(q["question"])
            else:
                score += 1

        percentage = round((score / len(questions) * 100), 2) if questions else 0

        ai_quiz.student_answers = answers
        ai_quiz.score = percentage
        ai_quiz.weak_areas_identified = weak_areas
        ai_quiz.feedback = (
            "Great job!" if percentage >= 80
            else "Review the weak areas identified below."
        )

        db.commit()
        db.refresh(ai_quiz)
        return ai_quiz, None

    @staticmethod
    def get_student_ai_quizzes(db: Session, student_id: int, course_id: int = None):
        query = db.query(AIQuiz).filter(AIQuiz.student_id == student_id)
        if course_id:
            query = query.filter(AIQuiz.course_id == course_id)
        return query.order_by(AIQuiz.created_at.desc()).all()


class ExamService:

    @staticmethod
    def create(db: Session, data: dict, teacher_id: int):
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == data["offering_id"]
        ).first()
        if not offering:
            return None, "Course offering not found"

        # Same type duplicate check
        existing = db.query(Exam).filter(
            Exam.offering_id == data["offering_id"],
            Exam.exam_type == data["exam_type"]
        ).first()
        if existing and data["exam_type"] != "special":
            return None, f"{data['exam_type'].capitalize()} exam already exists for this course"

        exam = Exam(**data)
        db.add(exam)
        db.commit()
        db.refresh(exam)
        return exam, None

    @staticmethod
    def get_offering_exams(db: Session, offering_id: int):
        return db.query(Exam).filter(
            Exam.offering_id == offering_id
        ).all()

    @staticmethod
    def get_by_id(db: Session, exam_id: int):
        return db.query(Exam).filter(Exam.id == exam_id).first()

    @staticmethod
    def enter_bulk_results(
        db: Session,
        exam_id: int,
        results: list,
        entered_by: int
    ):
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            return None, "Exam not found"

        saved = []
        for r in results:
            if r["obtained_marks"] > exam.total_marks:
                return None, f"Student {r['student_id']}: marks exceed total ({exam.total_marks})"

            grade = ExamService._calculate_grade(
                r["obtained_marks"], exam.total_marks
            )

            existing = db.query(ExamResult).filter(
                ExamResult.exam_id == exam_id,
                ExamResult.student_id == r["student_id"]
            ).first()

            if existing:
                existing.obtained_marks = r["obtained_marks"]
                existing.grade = r.get("grade") or grade
                existing.remarks = r.get("remarks")
                saved.append(existing)
            else:
                result = ExamResult(
                    exam_id=exam_id,
                    student_id=r["student_id"],
                    obtained_marks=r["obtained_marks"],
                    grade=r.get("grade") or grade,
                    remarks=r.get("remarks"),
                    entered_by=entered_by
                )
                db.add(result)
                saved.append(result)

        db.commit()
        return saved, None

    @staticmethod
    def get_exam_results(db: Session, exam_id: int):
        return db.query(ExamResult).filter(
            ExamResult.exam_id == exam_id
        ).all()

    @staticmethod
    def get_student_result(db: Session, exam_id: int, student_id: int):
        return db.query(ExamResult).filter(
            ExamResult.exam_id == exam_id,
            ExamResult.student_id == student_id
        ).first()

    @staticmethod
    def get_student_semester_results(db: Session, student_id: int, semester_id: int):
        from app.models.enrollment import CourseOffering
        return (
            db.query(ExamResult)
            .join(Exam)
            .join(CourseOffering)
            .filter(
                ExamResult.student_id == student_id,
                CourseOffering.semester_id == semester_id
            )
            .all()
        )

    @staticmethod
    def _calculate_grade(obtained: float, total: int) -> str:
        percentage = (obtained / total * 100) if total > 0 else 0
        if percentage >= 90:
            return "A+"
        elif percentage >= 85:
            return "A"
        elif percentage >= 80:
            return "A-"
        elif percentage >= 75:
            return "B+"
        elif percentage >= 70:
            return "B"
        elif percentage >= 65:
            return "B-"
        elif percentage >= 60:
            return "C+"
        elif percentage >= 55:
            return "C"
        elif percentage >= 50:
            return "D"
        else:
            return "F"