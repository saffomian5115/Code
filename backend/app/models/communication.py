from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, JSON, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    title          = Column(String(200), nullable=False)
    content        = Column(Text, nullable=False)
    created_by     = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type    = Column(Enum("all", "department", "program", "course", "section"), default="all")
    target_id      = Column(Integer, nullable=True)
    priority       = Column(Enum("low", "normal", "high", "urgent"), default="normal")
    attachment_url = Column(Text, nullable=True)
    pinned_until   = Column(Date, nullable=True)
    created_at     = Column(DateTime, server_default=func.now())
    updated_at     = Column(DateTime, server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by], backref="announcements")


class NoticeBoard(Base):
    __tablename__ = "notice_board"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    title            = Column(String(200), nullable=False)
    content          = Column(Text, nullable=False)
    category         = Column(String(50), nullable=True)
    # ✅ FIX: target_audience column added — matches DB migration
    target_audience  = Column(
        Enum("all", "students", "teachers", "staff"),
        nullable=False,
        default="all",
        server_default="all"
    )
    posted_by        = Column(Integer, ForeignKey("users.id"), nullable=False)
    posted_at        = Column(DateTime, server_default=func.now())
    expiry_date      = Column(Date, nullable=True)
    file_attachments = Column(JSON, nullable=True)
    is_public        = Column(Boolean, default=True)
    views            = Column(Integer, default=0)

    poster = relationship("User", foreign_keys=[posted_by], backref="notices")


class ChatGroup(Base):
    __tablename__ = "chat_groups"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    name                 = Column(String(100), nullable=False)
    group_type           = Column(Enum("class", "department", "project", "general"), default="class")
    offering_id          = Column(Integer, ForeignKey("course_offerings.id"), nullable=True)
    created_by           = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active            = Column(Boolean, default=True)
    moderation_required  = Column(Boolean, default=True)
    created_at           = Column(DateTime, server_default=func.now())

    offering = relationship("CourseOffering", foreign_keys=[offering_id])
    creator  = relationship("User", foreign_keys=[created_by])
    members  = relationship("ChatGroupMember", back_populates="group", cascade="all, delete-orphan")


class ChatGroupMember(Base):
    __tablename__ = "chat_group_members"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    group_id  = Column(Integer, ForeignKey("chat_groups.id", ondelete="CASCADE"), nullable=False)
    user_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    role      = Column(Enum("member", "monitor", "teacher", "admin"), default="member")
    joined_at = Column(DateTime, server_default=func.now())
    is_muted  = Column(Boolean, default=False)

    group = relationship("ChatGroup", back_populates="members")
    user  = relationship("User", foreign_keys=[user_id])


class Message(Base):
    __tablename__ = "messages"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    group_id       = Column(Integer, ForeignKey("chat_groups.id", ondelete="CASCADE"), nullable=False)
    sender_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    message        = Column(Text, nullable=False)
    message_type   = Column(Enum("text", "image", "file", "system"), default="text")
    attachment_url = Column(Text, nullable=True)
    sent_at        = Column(DateTime, server_default=func.now())
    is_deleted     = Column(Boolean, default=False)
    deleted_by     = Column(Integer, ForeignKey("users.id"), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id])