from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher
from app.services.assessment_service import QuizService, AIQuizService
from app.schemas.assessment import QuizCreateRequest, QuizAttemptSubmitRequest, \
    AIQuizGenerateRequest, AIQuizSubmitRequest, QuizUpdateRequest
from app.utils.response import success_response, error_response

router = APIRouter(tags=["Quizzes"])


# ─── TEACHER QUIZZES ────────────────────────────────────

@router.post("/offerings/{offering_id}/quizzes")
def create_quiz(
    offering_id: int,
    request: QuizCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    data = request.model_dump()
    data["offering_id"] = offering_id

    quiz, error = QuizService.create(db, data, current_user.id)
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": quiz.id,
        "title": quiz.title,
        "total_questions": quiz.total_questions,
        "total_marks": quiz.total_marks,
        "time_limit_minutes": quiz.time_limit_minutes,
        "start_time": str(quiz.start_time) if quiz.start_time else None,
        "end_time": str(quiz.end_time) if quiz.end_time else None
    }, "Quiz created successfully", status_code=201)


@router.get("/offerings/{offering_id}/quizzes")
def get_quizzes(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    quizzes = QuizService.get_offering_quizzes(db, offering_id)
    data = [{
        "id": q.id,
        "title": q.title,
        "total_questions": q.total_questions,
        "total_marks": q.total_marks,
        "time_limit_minutes": q.time_limit_minutes,
        "start_time": str(q.start_time) if q.start_time else None,
        "end_time": str(q.end_time) if q.end_time else None,
        "is_mandatory": q.is_mandatory,
        "total_attempts": len(q.attempts)
    } for q in quizzes]

    return success_response({
        "offering_id": offering_id,
        "quizzes": data
    }, "Quizzes retrieved")


@router.get("/quizzes/{quiz_id}")
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    quiz = QuizService.get_by_id(db, quiz_id)
    if not quiz:
        return error_response("Quiz not found", "NOT_FOUND", status_code=404)

    # Student ko answers nahi dikhayenge
    is_teacher = current_user.role in ["admin", "teacher"]
    questions = QuizService.get_questions(
        db, quiz_id, shuffle=quiz.shuffle_questions
    )

    questions_data = []
    for q in questions:
        q_data = {
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": q.options,
            "marks": q.marks,
            "difficulty": q.difficulty
        }
        if is_teacher:
            q_data["correct_answer"] = q.correct_answer
            q_data["explanation"] = q.explanation

        questions_data.append(q_data)

    return success_response({
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "total_questions": quiz.total_questions,
        "total_marks": quiz.total_marks,
        "time_limit_minutes": quiz.time_limit_minutes,
        "start_time": str(quiz.start_time) if quiz.start_time else None,
        "end_time": str(quiz.end_time) if quiz.end_time else None,
        "shuffle_questions": quiz.shuffle_questions,
        "questions": questions_data
    })

@router.put("/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: int,
    request: QuizUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    quiz = QuizService.get_by_id(db, quiz_id)
    if not quiz:
        return error_response("Quiz not found", "NOT_FOUND", status_code=404)

    # Only creator or admin can update
    if current_user.role != "admin" and quiz.created_by != current_user.id:
        return error_response("Not authorized to update this quiz", "FORBIDDEN", status_code=403)

    # Cannot update if attempts already exist
    if quiz.attempts:
        return error_response(
            "Cannot edit quiz — students have already attempted it",
            "EDIT_NOT_ALLOWED",
            status_code=400
        )

    update_data = request.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(quiz, key, value)

    db.commit()
    db.refresh(quiz)

    return success_response({
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "total_marks": quiz.total_marks,
        "time_limit_minutes": quiz.time_limit_minutes,
        "start_time": str(quiz.start_time) if quiz.start_time else None,
        "end_time": str(quiz.end_time) if quiz.end_time else None,
        "is_mandatory": quiz.is_mandatory
    }, "Quiz updated successfully")


@router.post("/quizzes/{quiz_id}/attempt")
def start_quiz_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    attempt, error = QuizService.start_attempt(db, quiz_id, current_user.id)
    if error:
        return error_response(error, "ATTEMPT_FAILED")

    return success_response({
        "attempt_id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "student_id": attempt.student_id,
        "start_time": str(attempt.start_time),
        "status": attempt.status,
        "total_marks": attempt.total_marks
    }, "Quiz started successfully")


@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    request: QuizAttemptSubmitRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    attempt, error = QuizService.submit_attempt(
        db, quiz_id, current_user.id, request.answers
    )
    if error:
        return error_response(error, "SUBMIT_FAILED")

    return success_response({
        "attempt_id": attempt.id,
        "score": float(attempt.score),
        "total_marks": attempt.total_marks,
        "percentage": float(attempt.percentage),
        "status": attempt.status,
        "end_time": str(attempt.end_time)
    }, "Quiz submitted successfully")


@router.get("/quizzes/{quiz_id}/attempts")
def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    attempts = QuizService.get_quiz_attempts(db, quiz_id)
    data = [{
        "id": a.id,
        "student_id": a.student_id,
        "student_name": a.student.student_profile.full_name if a.student and a.student.student_profile else a.student.email,
        "roll_number": a.student.student_profile.roll_number if a.student and a.student.student_profile else None,
        "score": float(a.score) if a.score else 0,
        "total_marks": a.total_marks,
        "percentage": float(a.percentage) if a.percentage else 0,
        "status": a.status,
        "start_time": str(a.start_time),
        "end_time": str(a.end_time) if a.end_time else None
    } for a in attempts]

    return success_response({
        "quiz_id": quiz_id,
        "total": len(data),
        "attempts": data
    }, "Quiz attempts retrieved")


@router.get("/quizzes/{quiz_id}/result")
def get_quiz_result(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    attempt = QuizService.get_attempt(db, quiz_id, current_user.id)
    if not attempt:
        return error_response("No attempt found", "NOT_FOUND", status_code=404)

    return success_response({
        "quiz_id": quiz_id,
        "score": float(attempt.score),
        "total_marks": attempt.total_marks,
        "percentage": float(attempt.percentage),
        "status": attempt.status,
        "answers": attempt.answers
    }, "Quiz result retrieved")


# ─── AI QUIZZES ─────────────────────────────────────────

@router.post("/ai-quiz/generate")
def generate_ai_quiz(
    request: AIQuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ai_quiz, error = AIQuizService.generate(
        db, current_user.id, request.model_dump()
    )
    if error:
        return error_response(error, "GENERATE_FAILED")

    return success_response({
        "ai_quiz_id": ai_quiz.id,
        "topic": ai_quiz.topic,
        "difficulty": ai_quiz.difficulty,
        "questions": ai_quiz.questions_generated
    }, "AI Quiz generated successfully", status_code=201)


@router.post("/ai-quiz/submit")
def submit_ai_quiz(
    request: AIQuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ai_quiz, error = AIQuizService.submit(
        db, request.ai_quiz_id, current_user.id, request.answers
    )
    if error:
        return error_response(error, "SUBMIT_FAILED")

    return success_response({
        "ai_quiz_id": ai_quiz.id,
        "score": float(ai_quiz.score),
        "feedback": ai_quiz.feedback,
        "weak_areas": ai_quiz.weak_areas_identified
    }, "AI Quiz submitted successfully")


@router.get("/ai-quiz/history")
def get_ai_quiz_history(
    course_id: int = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    quizzes = AIQuizService.get_student_ai_quizzes(
        db, current_user.id, course_id
    )
    data = [{
        "id": q.id,
        "topic": q.topic,
        "difficulty": q.difficulty,
        "score": float(q.score) if q.score else None,
        "feedback": q.feedback,
        "weak_areas": q.weak_areas_identified,
        "created_at": str(q.created_at)
    } for q in quizzes]

    return success_response({
        "total": len(data),
        "history": data
    }, "AI Quiz history retrieved")