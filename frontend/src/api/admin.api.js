import api from "./axios";

export const adminAPI = {
  // ─── STUDENTS ──────────────────────────────────────────
  getStudents: (page = 1, per_page = 10, search = "") =>
    api.get(
      `/students?page=${page}&per_page=${per_page}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    ),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (data) => api.post("/students", data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  toggleStudentStatus: (id) => api.patch(`/students/${id}/status`),
  deleteStudent: (id) => api.delete(`/students/${id}`),

  // ─── TEACHERS ──────────────────────────────────────────
  getTeachers: (page = 1, per_page = 20, search = "") =>
    api.get(
      `/teachers?page=${page}&per_page=${per_page}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    ),
  getTeacher: (id) => api.get(`/teachers/${id}`),
  createTeacher: (data) => api.post("/teachers", data),
  updateTeacher: (id, data) => api.put(`/teachers/${id}`, data),
  toggleTeacherStatus: (id) => api.patch(`/teachers/${id}/status`),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),

  // ─── DEPARTMENTS ───────────────────────────────────────
  getDepartments: () => api.get("/departments"),
  getDepartment: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post("/departments", data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),

  // ─── PROGRAMS ──────────────────────────────────────────
  getPrograms: () => api.get("/programs"),
  getProgram: (id) => api.get(`/programs/${id}`),
  createProgram: (data) => api.post("/programs", data),
  updateProgram: (id, data) => api.put(`/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/programs/${id}`),

  // ─── SEMESTERS ─────────────────────────────────────────
  getSemesters: () => api.get("/semesters"),
  getActiveSemester: () => api.get("/semesters/active"),
  getSemester: (id) => api.get(`/semesters/${id}`),
  createSemester: (data) => api.post("/semesters", data),
  updateSemester: (id, data) => api.put(`/semesters/${id}`, data),
  deleteSemester: (id) => api.delete(`/semesters/${id}`),
  activateSemester: (id) => api.patch(`/semesters/${id}/activate`),

  // ─── COURSES ───────────────────────────────────────────
  getCourses: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/courses${q ? `?${q}` : ""}`);
  },
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post("/courses", data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getCourseCLOs: (id) => api.get(`/courses/${id}/clos`),
  createCLO: (courseId, data) => api.post(`/courses/${courseId}/clos`, data),
  deleteCLO: (courseId, cloId) => api.delete(`/courses/${courseId}/clos/${cloId}`),
  updateCLO: (courseId, cloId, data) => api.put(`/courses/${courseId}/clos/${cloId}`, data),

  // ─── OFFERINGS ─────────────────────────────────────────
  getOfferings: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/offerings${q ? `?${q}` : ""}`);
  },
  getOffering: (id) => api.get(`/offerings/${id}`),
  createOffering: (data) => api.post("/offerings", data),
  updateOffering: (id, data) => api.put(`/offerings/${id}`, data),
  deleteOffering: (id) => api.delete(`/offerings/${id}`),
  getOfferingStudents: (id) => api.get(`/offerings/${id}/students`),

  // ─── ENROLLMENTS ───────────────────────────────────────
  getEnrollment: (id) => api.get(`/enrollments/${id}`),
  enrollStudent: (data) => api.post("/enrollments", data),
  approveEnrollment: (id, data = {}) =>
    api.patch(`/enrollments/${id}/approve`, data),
  dropEnrollment: (id, data) => api.patch(`/enrollments/${id}/drop`, data),
  gradeEnrollment: (id, data) => api.patch(`/enrollments/${id}/grade`, data),
  getStudentEnrollments: (studentId, semesterId) =>
    api.get(
      `/students/${studentId}/enrollments${semesterId ? `?semester_id=${semesterId}` : ""}`,
    ),
  enrollStudentInProgram: (studentId, data) =>
    api.post(`/students/${studentId}/program`, data),
  getStudentProgram: (studentId) => api.get(`/students/${studentId}/program`),
  updateProgramEnrollment: (id, data) =>
    api.patch(`/program-enrollments/${id}`, data),

  // ─── ATTENDANCE (LECTURE) ──────────────────────────────
  createSession: (data) => api.post("/sessions", data),
  getOfferingSessions: (offeringId) =>
    api.get(`/offerings/${offeringId}/sessions`),
  markAttendance: (sessionId, data) =>
    api.post(`/sessions/${sessionId}/attendance`, data),
  getSessionAttendance: (sessionId) =>
    api.get(`/sessions/${sessionId}/attendance`),
  updateAttendanceRecord: (sessionId, studentId, data) =>
    api.patch(`/sessions/${sessionId}/attendance/${studentId}`, data),
  getStudentAttendance: (studentId, offeringId) =>
    api.get(
      `/students/${studentId}/attendance${offeringId ? `?offering_id=${offeringId}` : ""}`,
    ),
  getShortAttendance: (offeringId) =>
    api.get(`/offerings/${offeringId}/short-attendance`),

  // ─── CAMPUS GATES ──────────────────────────────────────
  getGates: () => api.get("/gates"),
  getGate: (id) => api.get(`/gates/${id}`),
  createGate: (data) => api.post("/gates", data),
  updateGate: (id, data) => api.put(`/gates/${id}`, data),

  // ✅ DELETE GATE — permanently delete gate + all cameras/schedules/attendance
  deleteGate: (id) => api.delete(`/gates/${id}`),

  addCamera: (gateId, data) => api.post(`/gates/${gateId}/cameras`, data),

  // ✅ ADD SCHEDULE — POST /gates/{gateId}/schedules  (one day at a time, upserts)
  addSchedule: (gateId, data) => api.post(`/gates/${gateId}/schedules`, data),

  gateAttendance: (data) => api.post("/face/gate-attendance", data),
  setGateSchedule: (gateId, data) =>
    api.post(`/gates/${gateId}/schedules`, data),
  getStudentCampusAttendance: (studentId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(
      `/students/${studentId}/campus-attendance${q ? `?${q}` : ""}`,
    );
  },
  manualOverride: (data) => api.post("/campus-attendance/override", data),

  // ─── ASSIGNMENTS ───────────────────────────────────────
  getOfferingAssignments: (offeringId) =>
    api.get(`/offerings/${offeringId}/assignments`),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  createAssignment: (offeringId, data) =>
    api.post(`/offerings/${offeringId}/assignments`, data),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  getAssignmentSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  gradeSubmission: (submissionId, data) =>
    api.patch(`/submissions/${submissionId}/grade`, data),

  // ─── QUIZZES ───────────────────────────────────────────
  getOfferingQuizzes: (offeringId) =>
    api.get(`/offerings/${offeringId}/quizzes`),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (offeringId, data) =>
    api.post(`/offerings/${offeringId}/quizzes`, data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  getQuizResults: (id) => api.get(`/quizzes/${id}/results`),

  // ─── EXAMS ─────────────────────────────────────────────
  getOfferingExams: (offeringId) => api.get(`/offerings/${offeringId}/exams`),
  createExam: (offeringId, data) =>
    api.post(`/offerings/${offeringId}/exams`, data),
  updateExam: (id, data) => api.put(`/exams/${id}`, data),
  enterExamResults: (id, data) => api.post(`/exams/${id}/results`, data),
  getExamResults: (id) => api.get(`/exams/${id}/results`),
  getStudentResults: (studentId, semesterId) =>
    api.get(
      `/students/${studentId}/results${semesterId ? `?semester_id=${semesterId}` : ""}`,
    ),

  // ─── FEE STRUCTURE ─────────────────────────────────────
  getFeeStructures: (programId) =>
    api.get(`/fee-structure${programId ? `?program_id=${programId}` : ""}`),
  getFeeStructure: (id) => api.get(`/fee-structure/${id}`),
  createFeeStructure: (data) => api.post("/fee-structure", data),
  updateFeeStructure: (id, data) => api.put(`/fee-structure/${id}`, data),
  deleteFeeStructure: (id) => api.delete(`/fee-structure/${id}`),

  // ─── FEE VOUCHERS ──────────────────────────────────────
  getVouchers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/vouchers${q ? `?${q}` : ""}`);
  },
  getVoucher: (id) => api.get(`/vouchers/${id}`),
  getVoucherByNumber: (num) => api.get(`/vouchers/number/${num}`),
  getStudentVouchers: (studentId) => api.get(`/students/${studentId}/vouchers`),
  createVoucher: (data) => api.post("/vouchers", data),
  createBulkVouchers: (data) => api.post("/vouchers/bulk", data),
  payVoucher: (id, data) => api.post(`/vouchers/${id}/pay`, data),
  applyFine: (id, data) => api.patch(`/vouchers/${id}/fine`, data),
  updateOverdueVouchers: () => api.patch("/vouchers/update-overdue"),
  getStudentPayments: (studentId) => api.get(`/students/${studentId}/payments`),

  // ─── ANNOUNCEMENTS ─────────────────────────────────────
  getAnnouncements: (page = 1, per_page = 10) =>
    api.get(`/announcements?page=${page}&per_page=${per_page}`),
  getAnnouncement: (id) => api.get(`/announcements/${id}`),
  createAnnouncement: (data) => api.post("/announcements", data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),

  // ─── NOTICES ───────────────────────────────────────────
  getNotices: (page = 1, category = "") =>
    api.get(`/notices?page=${page}${category ? `&category=${category}` : ""}`),
  getNotice: (id) => api.get(`/notices/${id}`),
  createNotice: (data) => api.post("/notices", data),
  updateNotice: (id, data) => api.put(`/notices/${id}`, data),
  deleteNotice: (id) => api.delete(`/notices/${id}`),

  // ─── CHAT ──────────────────────────────────────────────
  getChatGroups: (offeringId) =>
    api.get(`/chat-groups${offeringId ? `?offering_id=${offeringId}` : ""}`),
  createChatGroup: (data) => api.post("/chat-groups", data),
  addGroupMember: (groupId, data) =>
    api.post(`/chat-groups/${groupId}/members`, data),
  getGroupMessages: (groupId, page = 1) =>
    api.get(`/chat-groups/${groupId}/messages?page=${page}&per_page=50`),

  // ─── AI ANALYTICS ──────────────────────────────────────
  calculateAnalytics: (data) => api.post("/analytics/calculate", data),
  bulkCalculateAnalytics: (data) => api.post("/analytics/bulk-calculate", data),
  getStudentAnalytics: (studentId, semesterId) =>
    api.get(`/analytics/student/${studentId}/semester/${semesterId}`),
  getLeaderboard: (semesterId, limit = 10) =>
    api.get(`/analytics/semester/${semesterId}/leaderboard?limit=${limit}`),
  getAtRiskStudents: (semesterId) =>
    api.get(`/analytics/semester/${semesterId}/at-risk`),
  calculateRanks: (semesterId) =>
    api.patch(`/analytics/semester/${semesterId}/calculate-ranks`),

  // ─── FACE RECOGNITION ──────────────────────────────────
  enrollFace: (data) => api.post("/face/enroll", data),

  // ─── AI CHATBOT (admin FAQs) ───────────────────────────
  getFAQs: (category = "") =>
    api.get(`/chatbot/faqs${category ? `?category=${category}` : ""}`),
  createFAQ: (data) => api.post("/chatbot/faqs", data),
  updateFAQ: (id, data) => api.put(`/chatbot/faqs/${id}`, data),
  deleteFAQ: (id) => api.delete(`/chatbot/faqs/${id}`),
};