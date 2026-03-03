from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class TargetTypeEnum(str, Enum):
    all = "all"
    department = "department"
    program = "program"
    course = "course"
    section = "section"

class PriorityEnum(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"

class GroupTypeEnum(str, Enum):
    class_ = "class"
    department = "department"
    project = "project"
    general = "general"

class MemberRoleEnum(str, Enum):
    member = "member"
    monitor = "monitor"
    teacher = "teacher"
    admin = "admin"

class MessageTypeEnum(str, Enum):
    text = "text"
    image = "image"
    file = "file"
    system = "system"


# ─── ANNOUNCEMENT SCHEMAS ───────────────────────────────

class AnnouncementCreateRequest(BaseModel):
    title: str
    content: str
    target_type: Optional[TargetTypeEnum] = TargetTypeEnum.all
    target_id: Optional[int] = None
    priority: Optional[PriorityEnum] = PriorityEnum.normal
    attachment_url: Optional[str] = None
    pinned_until: Optional[date] = None

class AnnouncementUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    attachment_url: Optional[str] = None
    pinned_until: Optional[date] = None


# ─── NOTICE BOARD SCHEMAS ───────────────────────────────

class NoticeCreateRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    file_attachments: Optional[List[str]] = None
    is_public: Optional[bool] = True

class NoticeUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    is_public: Optional[bool] = None


# ─── CHAT GROUP SCHEMAS ─────────────────────────────────

class ChatGroupCreateRequest(BaseModel):
    name: str
    group_type: Optional[str] = "class"
    offering_id: Optional[int] = None
    moderation_required: Optional[bool] = True

class AddMemberRequest(BaseModel):
    user_id: int
    role: Optional[MemberRoleEnum] = MemberRoleEnum.member

class MuteMemberRequest(BaseModel):
    is_muted: bool


# ─── MESSAGE SCHEMAS ────────────────────────────────────

class MessageSendRequest(BaseModel):
    message: str
    message_type: Optional[MessageTypeEnum] = MessageTypeEnum.text
    attachment_url: Optional[str] = None

class WSMessageRequest(BaseModel):
    # WebSocket se aane wala message format
    type: str           # "message" | "typing" | "ping"
    message: Optional[str] = None
    message_type: Optional[str] = "text"
    attachment_url: Optional[str] = None