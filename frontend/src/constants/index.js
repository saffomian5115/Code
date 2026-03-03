// ── constants/routes.js ──────────────────────────────
export const ROUTES = {
  LOGIN: '/login',

  // Admin
  ADMIN: {
    DASHBOARD:    '/admin/dashboard',
    STUDENTS:     '/admin/students',
    TEACHERS:     '/admin/teachers',
    DEPARTMENTS:  '/admin/departments',
    PROGRAMS:     '/admin/programs',
    SEMESTERS:    '/admin/semesters',
    COURSES:      '/admin/courses',
    OFFERINGS:    '/admin/offerings',
    ENROLLMENTS:  '/admin/enrollments',
    FEE_STRUCTURE:'/admin/fee/structure',
    FEE_VOUCHERS: '/admin/fee/vouchers',
    ANNOUNCEMENTS:'/admin/announcements',
    NOTICES:      '/admin/notices',
    GATES:        '/admin/gates',
    ANALYTICS:    '/admin/analytics',
  },

  // Teacher
  TEACHER: {
    DASHBOARD:    '/teacher/dashboard',
    COURSES:      '/teacher/courses',
    ATTENDANCE:   '/teacher/attendance',
    ASSIGNMENTS:  '/teacher/assignments',
    QUIZZES:      '/teacher/quizzes',
    RESULTS:      '/teacher/results',
    ANNOUNCEMENTS:'/teacher/announcements',
    CHAT:         '/teacher/chat',
  },

  // Student
  STUDENT: {
    DASHBOARD:    '/student/dashboard',
    COURSES:      '/student/courses',
    ATTENDANCE:   '/student/attendance',
    ASSIGNMENTS:  '/student/assignments',
    QUIZZES:      '/student/quizzes',
    RESULTS:      '/student/results',
    FEE:          '/student/fee',
    ANNOUNCEMENTS:'/student/announcements',
    CHAT:         '/student/chat',
    AI:           '/student/ai',
  },
}


// ── constants/status.js ──────────────────────────────

// Attendance status → color
export const ATTENDANCE_STATUS = {
  present: { label: 'Present', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  absent:  { label: 'Absent',  bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
  late:    { label: 'Late',    bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  excused: { label: 'Excused', bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500'  },
}

// Voucher status → color
export const FEE_STATUS = {
  paid:    { label: 'Paid',    bg: 'bg-emerald-100', text: 'text-emerald-700' },
  unpaid:  { label: 'Unpaid',  bg: 'bg-red-100',     text: 'text-red-700'     },
  partial: { label: 'Partial', bg: 'bg-orange-100',  text: 'text-orange-700'  },
  overdue: { label: 'Overdue', bg: 'bg-red-100',     text: 'text-red-700'     },
}

// Grade points
export const GRADE_POINTS = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0,
  'F':  0.0,
}

// Priority colors (announcements)
export const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
  high:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  normal: { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  low:    { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200' },
}

// Risk level colors (analytics)
export const RISK_COLORS = {
  high:   { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  low:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
}
