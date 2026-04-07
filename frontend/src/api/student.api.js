/**
 * student.api.js — Complete Student API Layer (Phase 3)
 */
import api from './axios'

export const studentAPI = {

  // ── Profile & Dashboard ──────────────────────────
  getProfile: () =>
    api.get('/students/me'),

  getAnalytics: () =>
    api.get('/students/me/analytics'),

  // ── Enrollments / My Courses ─────────────────────
  getEnrollments: (semesterId) => {
    const params = semesterId ? `?semester_id=${semesterId}` : ''
    return api.get(`/students/me/enrollments${params}`)
  },

  getOffering: (offeringId) =>
    api.get(`/offerings/${offeringId}`),

  getCourseCLOs: (courseId) =>
    api.get(`/courses/${courseId}/clos`),

  // ── Attendance ───────────────────────────────────
  /** GET /students/:id/attendance?offering_id=X */
  getAttendance: (studentId, offeringId) =>
    api.get(`/students/${studentId}/attendance?offering_id=${offeringId}`),

  // ── Assignments ──────────────────────────────────
  getOfferingAssignments: (offeringId) =>
    api.get(`/offerings/${offeringId}/assignments`),

  /** POST /assignments/:id/submit — multipart form data */
  submitAssignment: (assignmentId, formData) =>
    api.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getStudentSubmissions: (studentId) =>
    api.get(`/students/${studentId}/submissions`),
 
  // ── Quizzes ──────────────────────────────────────
  getOfferingQuizzes: (offeringId) =>
    api.get(`/offerings/${offeringId}/quizzes`),

  startQuizAttempt: (quizId) =>
    api.post(`/quizzes/${quizId}/attempt`),

  submitQuizAttempt: (quizId, answers) =>
    api.post(`/quizzes/${quizId}/submit`, { answers }),

  getMyQuizAttempt: (quizId) =>
    api.get(`/quizzes/${quizId}/my-attempt`),

  // ── AI Practice Quiz ─────────────────────────────
  // FIX: /ai-quizzes/ → /ai-quiz/ (singular, matches backend router)
  generateAIQuiz: (data) =>
    api.post('/ai-quiz/generate', data),

  submitAIQuiz: (data) =>
    api.post('/ai-quiz/submit', data),

  getMyAIQuizHistory: () =>
    api.get('/ai-quiz/history'),

  // ── Results ──────────────────────────────────────
  getMyResults: (studentId, semesterId) =>
    api.get(`/students/${studentId}/results?semester_id=${semesterId}`),

  // ── Fee ──────────────────────────────────────────
  getMyVouchers: () =>
    api.get('/students/me/vouchers'),

  getVoucher: (id) =>
    api.get(`/fee-vouchers/${id}`),

  // ── Announcements ────────────────────────────────
  getAnnouncements: (page = 1) =>
    api.get(`/announcements?page=${page}`),

  // ── Notices ──────────────────────────────────────
  getNotices: (page = 1) =>
    api.get(`/notices?page=${page}`),

  // ── Chat ─────────────────────────────────────────
  getChatGroups: () =>
    api.get('/chat/groups'),

  getChatMessages: (groupId, limit = 50) =>
    api.get(`/chat/groups/${groupId}/messages?limit=${limit}`),

  sendMessage: (groupId, data) =>
    api.post(`/chat/groups/${groupId}/messages`, data),

  // ── Chatbot ──────────────────────────────────────
  sendChatbotMessage: (data) =>
    api.post('/chatbot/chat', data),

  getChatbotFAQs: () =>
    api.get('/chatbot/faqs'),
}

export default studentAPI