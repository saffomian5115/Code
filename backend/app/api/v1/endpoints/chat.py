from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.core.dependencies import get_current_user
from app.core.websocket_manager import manager
from app.core.security import decode_token
from app.services.communication_service import ChatService, MessageService
from app.models.user import User
from app.schemas.communication import (
    ChatGroupCreateRequest, AddMemberRequest, MuteMemberRequest
)
from app.utils.response import success_response, error_response
import json

router = APIRouter(tags=["Chat"])


# ─── REST ENDPOINTS ─────────────────────────────────────

@router.post("/chat/groups")
def create_group(
    request: ChatGroupCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    group, error = ChatService.create_group(
        db, request.model_dump(), created_by=current_user.id
    )
    if error:
        return error_response(error, "CREATE_FAILED")

    return success_response({
        "id": group.id,
        "name": group.name,
        "group_type": group.group_type,
        "offering_id": group.offering_id,
        "moderation_required": group.moderation_required,
        "created_at": str(group.created_at)
    }, "Chat group created successfully", status_code=201)


@router.get("/chat/groups")
def get_my_groups(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    groups = ChatService.get_user_groups(db, current_user.id)
    data = [{
        "id": g.id,
        "name": g.name,
        "group_type": g.group_type,
        "offering_name": g.offering.course.name
            if g.offering and g.offering.course else None,
        "total_members": len(g.members),
        "online_count": manager.get_group_count(g.id),
        "moderation_required": g.moderation_required,
        "is_active": g.is_active
    } for g in groups]

    return success_response({
        "total": len(data),
        "groups": data
    }, "Your chat groups retrieved")


@router.get("/chat/groups/{group_id}")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    group = ChatService.get_group_by_id(db, group_id)
    if not group:
        return error_response("Group not found", "NOT_FOUND", status_code=404)

    # Member check
    if not ChatService.is_member(db, group_id, current_user.id):
        return error_response(
            "Access denied — you are not a member", "FORBIDDEN", status_code=403
        )

    members = ChatService.get_group_members(db, group_id)
    online_users = manager.get_online_users(group_id)
    online_ids = {u["user_id"] for u in online_users}

    return success_response({
        "id": group.id,
        "name": group.name,
        "group_type": group.group_type,
        "offering_id": group.offering_id,
        "moderation_required": group.moderation_required,
        "is_active": group.is_active,
        "total_members": len(members),
        "online_count": len(online_ids),
        "members": [{
            "user_id": m.user_id,
            "full_name": m.user.student_profile.full_name
                if m.user and m.user.student_profile
                else (m.user.teacher_profile.full_name
                if m.user and m.user.teacher_profile else None),
            "role": m.role,
            "is_muted": m.is_muted,
            "is_online": m.user_id in online_ids
        } for m in members]
    })


@router.post("/chat/groups/{group_id}/members")
def add_member(
    group_id: int,
    request: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member, error = ChatService.add_member(
        db, group_id, request.user_id, request.role
    )
    if error:
        return error_response(error, "ADD_MEMBER_FAILED")

    return success_response({
        "group_id": group_id,
        "user_id": member.user_id,
        "role": member.role
    }, "Member added successfully", status_code=201)


@router.post("/chat/groups/{group_id}/add-students")
def add_enrolled_students(
    group_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Course ke saare enrolled students auto-add
    count, error = ChatService.add_enrolled_students(db, group_id)
    if error:
        return error_response(error, "ADD_FAILED")

    return success_response({
        "group_id": group_id,
        "students_added": count
    }, f"{count} students added to group")


@router.delete("/chat/groups/{group_id}/members/{user_id}")
def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    success, error = ChatService.remove_member(db, group_id, user_id)
    if not success:
        return error_response(error, "REMOVE_FAILED", status_code=404)

    return success_response(message="Member removed successfully")


@router.patch("/chat/groups/{group_id}/members/{user_id}/mute")
def mute_member(
    group_id: int,
    user_id: int,
    request: MuteMemberRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    member, error = ChatService.toggle_mute(
        db, group_id, user_id, request.is_muted
    )
    if error:
        return error_response(error, "MUTE_FAILED", status_code=404)

    status = "muted" if request.is_muted else "unmuted"
    return success_response({
        "user_id": user_id,
        "is_muted": member.is_muted
    }, f"Member {status} successfully")


@router.get("/chat/groups/{group_id}/messages")
def get_messages(
    group_id: int,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Member check
    if not ChatService.is_member(db, group_id, current_user.id):
        return error_response(
            "Access denied", "FORBIDDEN", status_code=403
        )

    messages, total = MessageService.get_group_messages(
        db, group_id, page, per_page
    )
    data = [{
        "id": m.id,
        "sender_id": m.sender_id,
        "sender_name": m.sender.student_profile.full_name
            if m.sender and m.sender.student_profile
            else (m.sender.teacher_profile.full_name
            if m.sender and m.sender.teacher_profile else None),
        "message": m.message,
        "message_type": m.message_type,
        "attachment_url": m.attachment_url,
        "sent_at": str(m.sent_at)
    } for m in messages]

    return success_response({
        "group_id": group_id,
        "messages": data,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    }, "Messages retrieved")


@router.post("/chat/groups/{group_id}/messages")
def send_message(
    group_id: int,
    message_text: str = None, # From form field if any
    data: dict = None,        # From JSON body
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Member check
    if not ChatService.is_member(db, group_id, current_user.id):
        return error_response("Access denied", "FORBIDDEN", status_code=403)

    # Resolve message text
    msg_txt = message_text or (data.get("message") if data else None)
    if not msg_txt:
        return error_response("Message content required", "VALIDATION_ERROR")

    # Save message
    message = MessageService.save_message(
        db=db,
        group_id=group_id,
        sender_id=current_user.id,
        message=msg_txt,
        message_type=data.get("message_type", "text") if data else "text",
        attachment_url=data.get("attachment_url") if data else None
    )

    return success_response({
        "id": message.id,
        "group_id": group_id,
        "sender_id": current_user.id,
        "message": message.message,
        "sent_at": str(message.sent_at)
    }, "Message sent successfully", status_code=201)


@router.delete("/chat/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    success, error = MessageService.delete_message(
        db, message_id, deleted_by=current_user.id
    )
    if not success:
        return error_response(error, "DELETE_FAILED", status_code=404)

    return success_response(message="Message deleted successfully")


# ════════════════════════════════════════════════════════
# WEBSOCKET ENDPOINT
# ════════════════════════════════════════════════════════

@router.websocket("/ws/chat/{group_id}")
async def websocket_chat(
    websocket: WebSocket,
    group_id: int,
    token: str     # Query param se: ws://...?token=xxx
):
    # Token verify karo
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub"))

    # DB session
    db = SessionLocal()

    try:
        # User info lao
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001)
            return

        # Member check
        if not ChatService.is_member(db, group_id, user_id):
            await websocket.close(code=4003)
            return

        # Full name
        if user.student_profile:
            user_name = user.student_profile.full_name
        elif user.teacher_profile:
            user_name = user.teacher_profile.full_name
        else:
            user_name = user.email

        # Connect karo
        await manager.connect(websocket, group_id, user_id, user_name)

        # Join notification broadcast karo
        await manager.broadcast_to_group(group_id, {
            "type": "system",
            "message": f"{user_name} joined the chat",
            "user_id": user_id,
            "online_count": manager.get_group_count(group_id)
        })

        # Message loop
        while True:
            try:
                raw_data = await websocket.receive_text()
                data = json.loads(raw_data)

                msg_type = data.get("type", "message")

                if msg_type == "ping":
                    # Heartbeat — sirf sender ko respond karo
                    await websocket.send_json({"type": "pong"})

                elif msg_type == "typing":
                    # Typing indicator — baaki sab ko
                    await manager.broadcast_to_group(group_id, {
                        "type": "typing",
                        "user_id": user_id,
                        "user_name": user_name
                    })

                elif msg_type == "message":
                    # Mute check
                    member = ChatService.get_member(db, group_id, user_id)
                    if member and member.is_muted:
                        await websocket.send_json({
                            "type": "error",
                            "message": "You are muted in this group"
                        })
                        continue

                    message_text = data.get("message", "").strip()
                    if not message_text:
                        continue

                    # DB mein save karo
                    saved_msg = MessageService.save_message(
                        db=db,
                        group_id=group_id,
                        sender_id=user_id,
                        message=message_text,
                        message_type=data.get("message_type", "text"),
                        attachment_url=data.get("attachment_url")
                    )

                    # Sab ko broadcast karo
                    await manager.broadcast_to_group(group_id, {
                        "type": "message",
                        "id": saved_msg.id,
                        "group_id": group_id,
                        "sender_id": user_id,
                        "sender_name": user_name,
                        "message": message_text,
                        "message_type": saved_msg.message_type,
                        "attachment_url": saved_msg.attachment_url,
                        "sent_at": str(saved_msg.sent_at)
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)

        # Leave notification
        await manager.broadcast_to_group(group_id, {
            "type": "system",
            "message": f"{user_name} left the chat",
            "user_id": user_id,
            "online_count": manager.get_group_count(group_id)
        })

    finally:
        db.close()