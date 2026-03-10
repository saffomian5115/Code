from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.ai.chatbot_engine import ChatbotEngine
from app.services.ai_service import FAQService
from app.schemas.ai_analytics import (
    ChatbotMessageRequest, ConversationFeedbackRequest,
    FAQCreateRequest, FAQUpdateRequest, FAQFeedbackRequest
)
from app.utils.response import success_response, error_response

router = APIRouter(tags=["AI Chatbot"])


# ─── CHATBOT ENDPOINTS ──────────────────────────────────

@router.post("/chatbot/chat")
def send_message(
    request: ChatbotMessageRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = ChatbotEngine.process_message(
        db=db,
        student_id=current_user.id,
        message=request.message,
        session_id=request.session_id
    )

    return success_response({
        "session_id": result["session_id"],
        "intent": result["intent"],
        "confidence": result["confidence"],
        "response": result["response"],
        "response_time_ms": result["response_time_ms"],
        "faq_suggestions": result["faq_suggestions"]
    }, "Message processed")


@router.post("/chatbot/end-session")
def end_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conversation = ChatbotEngine.end_session(
        db, session_id, current_user.id
    )
    if not conversation:
        return error_response("Session not found", "NOT_FOUND", status_code=404)

    return success_response({
        "session_id": session_id,
        "status": "ended",
        "total_messages": conversation.total_messages
    }, "Session ended")


@router.post("/chatbot/feedback")
def submit_feedback(
    request: ConversationFeedbackRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conversation, error = ChatbotEngine.save_feedback(
        db=db,
        session_id=request.session_id,
        student_id=current_user.id,
        rating=request.rating,
        feedback_text=request.feedback_text
    )
    if error:
        return error_response(error, "FEEDBACK_FAILED", status_code=404)

    return success_response({
        "session_id": request.session_id,
        "rating": conversation.feedback_rating
    }, "Feedback submitted")


# ─── FAQ ENDPOINTS ──────────────────────────────────────

@router.post("/faqs")
def create_faq(
    request: FAQCreateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    faq, error = FAQService.create(db, request.model_dump())
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": faq.id,
        "question": faq.question,
        "category": faq.category
    }, "FAQ created successfully", status_code=201)


@router.get("/faqs")
def get_faqs(
    category: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    faqs = FAQService.get_all(db, category)
    data = [{
        "id": f.id,
        "question": f.question,
        "answer": f.answer,
        "category": f.category,
        "tags": f.tags,
        "helpful_count": f.helpful_count,
        "view_count": f.view_count
    } for f in faqs]

    return success_response({
        "total": len(data),
        "faqs": data
    }, "FAQs retrieved")


@router.get("/faqs/search")
def search_faqs(
    q: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = FAQService.search(db, q)
    data = [{
        "id": f.id,
        "question": f.question,
        "answer": f.answer,
        "category": f.category
    } for f in results]

    return success_response({
        "query": q,
        "results": data,
        "total": len(data)
    }, "FAQ search results")


@router.put("/faqs/{faq_id}")
def update_faq(
    faq_id: int,
    request: FAQUpdateRequest,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    faq, error = FAQService.update(
        db, faq_id, request.model_dump(exclude_none=True)
    )
    if error:
        return error_response(error, "UPDATE_FAILED", status_code=404)

    return success_response(message="FAQ updated successfully")


@router.post("/faqs/{faq_id}/vote")
def vote_faq(
    faq_id: int,
    request: FAQFeedbackRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    faq, error = FAQService.vote(db, faq_id, request.helpful)
    if error:
        return error_response(error, "VOTE_FAILED", status_code=404)

    return success_response({
        "faq_id": faq_id,
        "helpful_count": faq.helpful_count,
        "not_helpful_count": faq.not_helpful_count
    }, "Vote recorded")