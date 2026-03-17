from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import date, datetime, timezone
from app.models.communication import (
    Announcement, NoticeBoard,
    ChatGroup, ChatGroupMember, Message
)
from app.models.enrollment import Enrollment, CourseOffering


class AnnouncementService:

    @staticmethod
    def create(db: Session, data: dict, created_by: int):
        announcement = Announcement(
            created_by=created_by,
            **data
        )
        db.add(announcement)
        db.commit()
        db.refresh(announcement)
        return announcement, None

    @staticmethod
    def get_all(
        db: Session,
        target_type: str = None,
        target_id: int = None,
        priority: str = None,
        page: int = 1,
        per_page: int = 20
    ):
        query = db.query(Announcement)

        if target_type:
            query = query.filter(Announcement.target_type == target_type)
        if target_id:
            query = query.filter(Announcement.target_id == target_id)
        if priority:
            query = query.filter(Announcement.priority == priority)

        total = query.count()
        offset = (page - 1) * per_page

        announcements = query.order_by(
            Announcement.created_at.desc()
        ).offset(offset).limit(per_page).all()

        return announcements, total

    @staticmethod
    def get_for_student(db: Session, student_id: int):
        """
        ✅ FIX #5: Student ke liye saare relevant target types handle kiye:
        - all        → sabko milti hai
        - course     → enrolled courses
        - section    → enrolled offerings ke sections
        - program    → student ka program
        - department → student ke program ka department
        """
        from app.models.enrollment import Enrollment, CourseOffering
        from app.models.enrollment import StudentProgramEnrollment

        # 1. Enrolled offering IDs (course + section target ke liye)
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == "enrolled"
        ).all()

        enrolled_offering_ids = [e.offering_id for e in enrollments]

        # 2. Student ka program ID aur uska department ID
        program_id = None
        department_id = None
        program_enrollment = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.student_id == student_id,
            StudentProgramEnrollment.status == "active"
        ).first()

        if program_enrollment:
            program_id = program_enrollment.program_id
            # Department dhundo program se
            from app.models.academic import Program
            program = db.query(Program).filter(
                Program.id == program_id
            ).first()
            if program:
                department_id = program.department_id

        # 3. Query — saare relevant announcements
        conditions = [
            Announcement.target_type == "all",
        ]

        if enrolled_offering_ids:
            conditions.append(
                and_(
                    Announcement.target_type == "course",
                    Announcement.target_id.in_(enrolled_offering_ids)
                )
            )
            conditions.append(
                and_(
                    Announcement.target_type == "section",
                    Announcement.target_id.in_(enrolled_offering_ids)
                )
            )

        if program_id:
            conditions.append(
                and_(
                    Announcement.target_type == "program",
                    Announcement.target_id == program_id
                )
            )

        if department_id:
            conditions.append(
                and_(
                    Announcement.target_type == "department",
                    Announcement.target_id == department_id
                )
            )

        announcements = db.query(Announcement).filter(
            or_(*conditions)
        ).order_by(Announcement.created_at.desc()).limit(50).all()

        return announcements

    @staticmethod
    def get_pinned(db: Session):
        today = date.today()
        return db.query(Announcement).filter(
            Announcement.pinned_until >= today
        ).order_by(Announcement.priority.desc()).all()

    @staticmethod
    def get_by_id(db: Session, announcement_id: int):
        return db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()

    @staticmethod
    def update(db: Session, announcement_id: int, data: dict):
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()
        if not announcement:
            return None, "Announcement not found"

        for key, value in data.items():
            setattr(announcement, key, value)

        db.commit()
        db.refresh(announcement)
        return announcement, None

    @staticmethod
    def delete(db: Session, announcement_id: int):
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()
        if not announcement:
            return False, "Announcement not found"

        db.delete(announcement)
        db.commit()
        return True, None


class NoticeBoardService:

    @staticmethod
    def create(db: Session, data: dict, posted_by: int):
        notice = NoticeBoard(posted_by=posted_by, **data)
        db.add(notice)
        db.commit()
        db.refresh(notice)
        return notice, None

    @staticmethod
    def get_all(
        db: Session,
        category: str = None,
        is_public: bool = None,
        page: int = 1,
        per_page: int = 20
    ):
        today = date.today()
        query = db.query(NoticeBoard).filter(
            or_(
                NoticeBoard.expiry_date == None,
                NoticeBoard.expiry_date >= today
            )
        )

        if category:
            query = query.filter(NoticeBoard.category == category)
        if is_public is not None:
            query = query.filter(NoticeBoard.is_public == is_public)

        total = query.count()
        offset = (page - 1) * per_page
        notices = query.order_by(
            NoticeBoard.posted_at.desc()
        ).offset(offset).limit(per_page).all()

        return notices, total

    @staticmethod
    def get_by_id(db: Session, notice_id: int):
        return db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()

    @staticmethod
    def increment_view(db: Session, notice_id: int):
        notice = db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()
        if notice:
            notice.views += 1
            db.commit()

    @staticmethod
    def update(db: Session, notice_id: int, data: dict):
        notice = db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()
        if not notice:
            return None, "Notice not found"

        for key, value in data.items():
            setattr(notice, key, value)

        db.commit()
        db.refresh(notice)
        return notice, None

    @staticmethod
    def delete(db: Session, notice_id: int):
        notice = db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()
        if not notice:
            return False, "Notice not found"

        db.delete(notice)
        db.commit()
        return True, None


class ChatService:

    @staticmethod
    def create_group(db: Session, data: dict, created_by: int):
        # Agar class group hai to offering check karo
        if data.get("offering_id"):
            offering = db.query(CourseOffering).filter(
                CourseOffering.id == data["offering_id"]
            ).first()
            if not offering:
                return None, "Course offering not found"

            # Already exist?
            existing = db.query(ChatGroup).filter(
                ChatGroup.offering_id == data["offering_id"],
                ChatGroup.group_type == "class"
            ).first()
            if existing:
                return None, "Chat group already exists for this course"

        group = ChatGroup(created_by=created_by, **data)
        db.add(group)
        db.flush()

        # Creator ko admin role de do
        creator_member = ChatGroupMember(
            group_id=group.id,
            user_id=created_by,
            role="admin"
        )
        db.add(creator_member)
        db.commit()
        db.refresh(group)
        return group, None

    @staticmethod
    def add_member(db: Session, group_id: int, user_id: int, role: str = "member"):
        group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
        if not group:
            return None, "Group not found"

        # Already member?
        existing = db.query(ChatGroupMember).filter(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id
        ).first()
        if existing:
            return None, "User already in group"

        member = ChatGroupMember(
            group_id=group_id,
            user_id=user_id,
            role=role
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return member, None

    @staticmethod
    def add_enrolled_students(db: Session, group_id: int):
        # Course ke saare enrolled students ko auto-add karo
        group = db.query(ChatGroup).filter(ChatGroup.id == group_id).first()
        if not group or not group.offering_id:
            return 0, "Group not found or no offering linked"

        enrollments = db.query(Enrollment).filter(
            Enrollment.offering_id == group.offering_id,
            Enrollment.status == "enrolled"
        ).all()

        added = 0
        for e in enrollments:
            existing = db.query(ChatGroupMember).filter(
                ChatGroupMember.group_id == group_id,
                ChatGroupMember.user_id == e.student_id
            ).first()
            if not existing:
                member = ChatGroupMember(
                    group_id=group_id,
                    user_id=e.student_id,
                    role="member"
                )
                db.add(member)
                added += 1

        db.commit()
        return added, None

    @staticmethod
    def remove_member(db: Session, group_id: int, user_id: int):
        member = db.query(ChatGroupMember).filter(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id
        ).first()
        if not member:
            return False, "Member not found"

        db.delete(member)
        db.commit()
        return True, None

    @staticmethod
    def toggle_mute(db: Session, group_id: int, user_id: int, is_muted: bool):
        member = db.query(ChatGroupMember).filter(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id
        ).first()
        if not member:
            return None, "Member not found"

        member.is_muted = is_muted
        db.commit()
        db.refresh(member)
        return member, None

    @staticmethod
    def get_user_groups(db: Session, user_id: int):
        return (
            db.query(ChatGroup)
            .join(ChatGroupMember)
            .filter(
                ChatGroupMember.user_id == user_id,
                ChatGroup.is_active == True
            )
            .all()
        )

    @staticmethod
    def get_group_by_id(db: Session, group_id: int):
        return db.query(ChatGroup).filter(
            ChatGroup.id == group_id
        ).first()

    @staticmethod
    def get_group_members(db: Session, group_id: int):
        return db.query(ChatGroupMember).filter(
            ChatGroupMember.group_id == group_id
        ).all()

    @staticmethod
    def is_member(db: Session, group_id: int, user_id: int) -> bool:
        member = db.query(ChatGroupMember).filter(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id
        ).first()
        return member is not None

    @staticmethod
    def get_member(db: Session, group_id: int, user_id: int):
        return db.query(ChatGroupMember).filter(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id
        ).first()


class MessageService:

    @staticmethod
    def save_message(
        db: Session,
        group_id: int,
        sender_id: int,
        message: str,
        message_type: str = "text",
        attachment_url: str = None
    ):
        msg = Message(
            group_id=group_id,
            sender_id=sender_id,
            message=message,
            message_type=message_type,
            attachment_url=attachment_url
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def get_group_messages(
        db: Session,
        group_id: int,
        page: int = 1,
        per_page: int = 50
    ):
        total = db.query(func.count(Message.id)).filter(
            Message.group_id == group_id,
            Message.is_deleted == False
        ).scalar()

        offset = (page - 1) * per_page
        messages = (
            db.query(Message)
            .filter(
                Message.group_id == group_id,
                Message.is_deleted == False
            )
            .order_by(Message.sent_at.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )
        # Purane pehle dikhao
        messages.reverse()
        return messages, total

    @staticmethod
    def delete_message(db: Session, message_id: int, deleted_by: int):
        message = db.query(Message).filter(
            Message.id == message_id
        ).first()
        if not message:
            return False, "Message not found"

        message.is_deleted = True
        message.deleted_by = deleted_by
        db.commit()
        return True, None


    @staticmethod
    def create(db: Session, data: dict, created_by: int):
        announcement = Announcement(
            created_by=created_by,
            **data
        )
        db.add(announcement)
        db.commit()
        db.refresh(announcement)
        return announcement, None

    @staticmethod
    def get_all(
        db: Session,
        target_type: str = None,
        target_id: int = None,
        priority: str = None,
        page: int = 1,
        per_page: int = 20
    ):
        query = db.query(Announcement)

        if target_type:
            query = query.filter(Announcement.target_type == target_type)
        if target_id:
            query = query.filter(Announcement.target_id == target_id)
        if priority:
            query = query.filter(Announcement.priority == priority)

        total = query.count()
        offset = (page - 1) * per_page

        announcements = query.order_by(
            Announcement.created_at.desc()
        ).offset(offset).limit(per_page).all()

        return announcements, total

    @staticmethod
    def get_for_student(db: Session, student_id: int):
        """
        ✅ FIX #5: Student ke liye saare relevant target types handle kiye:
        - all       → sabko milti hai
        - course    → enrolled courses
        - section   → enrolled offerings ke sections
        - program   → student ka program
        - department → student ke program ka department
        """
        from app.models.enrollment import Enrollment, CourseOffering
        from app.models.academic import Program
        from app.models.enrollment import StudentProgramEnrollment

        # 1. Enrolled offering IDs (course + section target ke liye)
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == "enrolled"
        ).all()

        enrolled_offering_ids = [e.offering_id for e in enrollments]

        # Section values (offering ke section field se)
        enrolled_sections = []
        if enrolled_offering_ids:
            offerings = db.query(CourseOffering).filter(
                CourseOffering.id.in_(enrolled_offering_ids)
            ).all()
            enrolled_sections = [o.section for o in offerings if o.section]

        # 2. Student ka program ID aur uska department ID
        program_id = None
        department_id = None
        program_enrollment = db.query(StudentProgramEnrollment).filter(
            StudentProgramEnrollment.student_id == student_id,
            StudentProgramEnrollment.status == "active"
        ).first()

        if program_enrollment:
            program_id = program_enrollment.program_id
            # Department dhundo program se
            program = db.query(Program).filter(
                Program.id == program_id
            ).first()
            if program:
                department_id = program.department_id

        # 3. Query — saare relevant announcements
        conditions = [
            Announcement.target_type == "all",
        ]

        if enrolled_offering_ids:
            conditions.append(
                and_(
                    Announcement.target_type == "course",
                    Announcement.target_id.in_(enrolled_offering_ids)
                )
            )

        if enrolled_sections:
            conditions.append(
                and_(
                    Announcement.target_type == "section",
                    Announcement.target_id.in_(enrolled_offering_ids)
                )
            )

        if program_id:
            conditions.append(
                and_(
                    Announcement.target_type == "program",
                    Announcement.target_id == program_id
                )
            )

        if department_id:
            conditions.append(
                and_(
                    Announcement.target_type == "department",
                    Announcement.target_id == department_id
                )
            )

        announcements = db.query(Announcement).filter(
            or_(*conditions)
        ).order_by(Announcement.created_at.desc()).limit(50).all()

        return announcements

    @staticmethod
    def get_pinned(db: Session):
        today = date.today()
        return db.query(Announcement).filter(
            Announcement.pinned_until >= today
        ).order_by(Announcement.priority.desc()).all()

    @staticmethod
    def get_by_id(db: Session, announcement_id: int):
        return db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()

    @staticmethod
    def update(db: Session, announcement_id: int, data: dict):
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()
        if not announcement:
            return None, "Announcement not found"

        for key, value in data.items():
            setattr(announcement, key, value)

        db.commit()
        db.refresh(announcement)
        return announcement, None

    @staticmethod
    def delete(db: Session, announcement_id: int):
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()
        if not announcement:
            return False, "Announcement not found"

        db.delete(announcement)
        db.commit()
        return True, None


class NoticeBoardService:

    @staticmethod
    def create(db: Session, data: dict, posted_by: int):
        notice = NoticeBoard(posted_by=posted_by, **data)
        db.add(notice)
        db.commit()
        db.refresh(notice)
        return notice, None

    @staticmethod
    def get_all(
        db: Session,
        category: str = None,
        is_public: bool = None,
        page: int = 1,
        per_page: int = 20
    ):
        today = date.today()
        query = db.query(NoticeBoard).filter(
            or_(
                NoticeBoard.expiry_date == None,
                NoticeBoard.expiry_date >= today
            )
        )

        if category:
            query = query.filter(NoticeBoard.category == category)
        if is_public is not None:
            query = query.filter(NoticeBoard.is_public == is_public)

        total = query.count()
        offset = (page - 1) * per_page
        notices = query.order_by(
            NoticeBoard.posted_at.desc()
        ).offset(offset).limit(per_page).all()

        return notices, total

    @staticmethod
    def get_by_id(db: Session, notice_id: int):
        return db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()

    @staticmethod
    def update(db: Session, notice_id: int, data: dict):
        notice = db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()
        if not notice:
            return None, "Notice not found"

        for key, value in data.items():
            setattr(notice, key, value)

        db.commit()
        db.refresh(notice)
        return notice, None

    @staticmethod
    def delete(db: Session, notice_id: int):
        notice = db.query(NoticeBoard).filter(
            NoticeBoard.id == notice_id
        ).first()
        if not notice:
            return False, "Notice not found"

        db.delete(notice)
        db.commit()
        return True, None