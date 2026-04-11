from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, students, teachers,
    departments, programs, semesters, courses,
    offerings, enrollments, attendance,
    assignments, quizzes, exams, fees,
    announcements, notices, chat,
    analytics, chatbot, face_recognition, api_keys
)

api_router = APIRouter(prefix="/api/v1")

# Auth + Users
api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(teachers.router)

# Academic
api_router.include_router(departments.router)
api_router.include_router(programs.router)
api_router.include_router(semesters.router)
api_router.include_router(courses.router)

# Enrollment
api_router.include_router(offerings.router)
api_router.include_router(enrollments.router)

# Attendance
api_router.include_router(attendance.router)

# Assessment
api_router.include_router(assignments.router)
api_router.include_router(quizzes.router)
api_router.include_router(exams.router)

# Fee
api_router.include_router(fees.router)

# Communication
api_router.include_router(announcements.router)
api_router.include_router(notices.router)
api_router.include_router(chat.router)

# AI Layer
api_router.include_router(analytics.router)
api_router.include_router(chatbot.router)
api_router.include_router(face_recognition.router)

api_router.include_router(api_keys.router)
