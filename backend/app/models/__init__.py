from app.models.user import User, StudentProfile, TeacherProfile, AdminProfile
from app.models.academic import Department, Program, Semester, Course, CourseCLO
from app.models.enrollment import CourseOffering, Enrollment, StudentProgramEnrollment
from app.models.attendance import (
    LectureSession, LectureAttendance, AttendanceSummary,
    CampusGate, GateCamera, GateSchedule,
    CampusAttendance, FaceRecognitionLog,
    CameraHealthLog, GateAccessLog
)
from app.models.assessment import (
    Assignment, AssignmentSubmission,
    Quiz, QuizQuestion, QuizAttempt,
    AIQuiz, Exam, ExamResult
)
from app.models.fee import FeeStructure, FeeVoucher, FeePayment
from app.models.communication import (
    Announcement, NoticeBoard,
    ChatGroup, ChatGroupMember, Message
)
from app.models.ai_analytics import (
    StudentPerformanceScore,
    ChatbotIntent, ChatbotConversation,
    ChatbotMessage, ChatbotFAQ
)