/**
 * teacher.api.js
 * Complete API layer for Teacher Panel (Phase 2)
 * Base URL: /api/v1 (set in axios instance)
 */
import api from './axios'

export const teacherAPI = {

  // ════════════════════════════════════════════════
  // MY OFFERINGS
  // ════════════════════════════════════════════════

  /** GET /teachers/me/offerings — teacher's assigned course offerings */
  getMyOfferings: () =>
    api.get('/teachers/me/offerings'),

  /** GET /offerings/:id — single offering detail */
  getOffering: (id) =>
    api.get(`/offerings/${id}`),

  /** GET /offerings/:id/students — enrolled students */
  getOfferingStudents: (offeringId) =>
    api.get(`/offerings/${offeringId}/students`),


  // ════════════════════════════════════════════════
  // LECTURE SESSIONS
  // ════════════════════════════════════════════════

  /** POST /sessions — create a new lecture session */
  createSession: (data) =>
    api.post('/sessions', data),

  /** GET /offerings/:id/sessions */
  getOfferingSessions: (offeringId) =>
    api.get(`/offerings/${offeringId}/sessions`),

  /** GET /sessions/:id */
  getSession: (sessionId) =>
    api.get(`/sessions/${sessionId}`),


  // ════════════════════════════════════════════════
  // ATTENDANCE
  // ════════════════════════════════════════════════

  /** POST /sessions/:id/attendance — bulk mark attendance
   *  body: { records: [{ student_id, status, remarks? }] }
   */
  markAttendance: (sessionId, data) =>
    api.post(`/sessions/${sessionId}/attendance`, data),

  /** GET /sessions/:id/attendance — view session attendance */
  getSessionAttendance: (sessionId) =>
    api.get(`/sessions/${sessionId}/attendance`),

  /** PATCH /sessions/:sid/attendance/:studentId — update single record */
  updateAttendance: (sessionId, studentId, data) =>
    api.patch(`/sessions/${sessionId}/attendance/${studentId}`, data),

  /** GET /offerings/:id/attendance-report — full attendance report */
  getAttendanceReport: (offeringId) =>
    api.get(`/offerings/${offeringId}/attendance-report`),

  /** GET /offerings/:id/short-attendance — students below 75% */
  getShortAttendance: (offeringId) =>
    api.get(`/offerings/${offeringId}/short-attendance`),


  // ════════════════════════════════════════════════
  // ASSIGNMENTS
  // ════════════════════════════════════════════════

  /** POST /offerings/:id/assignments */
  createAssignment: (offeringId, data) =>
    api.post(`/offerings/${offeringId}/assignments`, data),

  /** GET /offerings/:id/assignments */
  getOfferingAssignments: (offeringId) =>
    api.get(`/offerings/${offeringId}/assignments`),

  /** GET /assignments/:id */
  getAssignment: (id) =>
    api.get(`/assignments/${id}`),

  /** GET /assignments/:id/submissions */
  getAssignmentSubmissions: (assignmentId) =>
    api.get(`/assignments/${assignmentId}/submissions`),

  /** PATCH /submissions/:id/grade
   *  body: { obtained_marks, feedback?, status }
   */
  gradeSubmission: (submissionId, data) =>
    api.patch(`/submissions/${submissionId}/grade`, data),

  deleteAssignment: (id) =>
    api.delete(`/assignments/${id}`),


  // ════════════════════════════════════════════════
  // QUIZZES
  // ════════════════════════════════════════════════

  /** POST /offerings/:id/quizzes
   *  body: { title, description, time_limit_minutes, start_time, end_time,
   *          is_mandatory, shuffle_questions, questions: [...], total_marks }
   */
  createQuiz: (offeringId, data) =>
    api.post(`/offerings/${offeringId}/quizzes`, data),

  /** GET /offerings/:id/quizzes */
  getOfferingQuizzes: (offeringId) =>
    api.get(`/offerings/${offeringId}/quizzes`),

  /** GET /quizzes/:id — includes questions + attempts (teacher view) */
  getQuizDetail: (quizId) =>
    api.get(`/quizzes/${quizId}`),

  /** GET /quizzes/:id/attempts — all student attempts */
  getQuizAttempts: (quizId) =>
    api.get(`/quizzes/${quizId}/attempts`),

  deleteQuiz: (id) =>
    api.delete(`/quizzes/${id}`),


  // ════════════════════════════════════════════════
  // EXAMS & RESULTS
  // ════════════════════════════════════════════════

  /** POST /offerings/:id/exams */
  createExam: (offeringId, data) =>
    api.post(`/offerings/${offeringId}/exams`, data),

  /** GET /offerings/:id/exams */
  getOfferingExams: (offeringId) =>
    api.get(`/offerings/${offeringId}/exams`),

  /** GET /exams/:id */
  getExam: (examId) =>
    api.get(`/exams/${examId}`),

  /** POST /exams/:id/results — bulk enter results
   *  body: { results: [{ student_id, obtained_marks, grade?, remarks? }] }
   */
  enterExamResults: (examId, data) =>
    api.post(`/exams/${examId}/results`, data),

  /** GET /exams/:id/results */
  getExamResults: (examId) =>
    api.get(`/exams/${examId}/results`),

  deleteExam: (id) =>
    api.delete(`/exams/${id}`),


  // ════════════════════════════════════════════════
  // ANNOUNCEMENTS
  // ════════════════════════════════════════════════

  /** GET /announcements?page=1&priority=high */
  getAnnouncements: (page = 1, priority = undefined) => {
    const params = new URLSearchParams({ page })
    if (priority) params.set('priority', priority)
    return api.get(`/announcements?${params}`)
  },

  /** POST /announcements */
  createAnnouncement: (data) =>
    api.post('/announcements', data),

  /** PUT /announcements/:id */
  updateAnnouncement: (id, data) =>
    api.put(`/announcements/${id}`, data),

  /** DELETE /announcements/:id */
  deleteAnnouncement: (id) =>
    api.delete(`/announcements/${id}`),

  getNotices: (page = 1, category = '') => {
    const params = new URLSearchParams({ page })
    if (category) params.set('category', category)
    return api.get(`/notices?${params}`)
  },


  // ════════════════════════════════════════════════
  // CHAT
  // ════════════════════════════════════════════════

  /** GET /chat/groups — teacher's joined groups */
  getChatGroups: () =>
    api.get('/chat/groups'),

  /** GET /chat/groups/:id/messages?limit=50 */
  getChatMessages: (groupId, limit = 50) =>
    api.get(`/chat/groups/${groupId}/messages?limit=${limit}`),

  /** POST /chat/groups/:id/messages
   *  body: { message, message_type: 'text' }
   */
  sendMessage: (groupId, data) =>
    api.post(`/chat/groups/${groupId}/messages`, data),

  /** DELETE /chat/messages/:id */
  deleteMessage: (messageId) =>
    api.delete(`/chat/messages/${messageId}`),

  /** GET /chat/groups/:id — group detail with members */
  getChatGroupDetail: (groupId) =>
    api.get(`/chat/groups/${groupId}`),


  // ════════════════════════════════════════════════
  // TEACHER PROFILE
  // ════════════════════════════════════════════════

  /** GET /teachers/me — own profile */
  getProfile: () =>
    api.get('/teachers/me'),

  /** PUT /teachers/me — update profile */
  updateProfile: (data) =>
    api.put('/teachers/me', data),

}

export default teacherAPI
