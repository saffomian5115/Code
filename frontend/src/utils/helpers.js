/**
 * helpers.js — Utility functions for BZU LMS Frontend
 * Phase 0 (base) + Phase 2 additions
 */

// ── Date / Time ────────────────────────────────────

/** "2025-03-01" → "Mar 1, 2025" */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** "2025-03-01T09:00" → "Mar 1, 2025 9:00 AM" */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** "09:00:00" → "9:00 AM" */
export const formatTime = (timeStr) => {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/** "2025-03-01" → "5 minutes ago" | "2 days ago" etc */
export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return formatDate(dateStr)
}


// ── Currency ───────────────────────────────────────

/** 46000 → "Rs. 46,000" */
export const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return `Rs. ${Number(amount).toLocaleString('en-PK')}`
}


// ── Strings ────────────────────────────────────────

/** "Ali Hassan" → "AH" */
export const getInitials = (name = '') => {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

/** Deterministic avatar bg color from name */
export const avatarColor = (name = '') => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500',
  ]
  const i = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return colors[i % colors.length]
}


// ── Attendance helpers (Phase 2) ───────────────────

/** 75.5 → "text-emerald-600" | 60 → "text-orange-500" | 37 → "text-red-600" */
export const getAttendanceColor = (percentage) => {
  if (percentage >= 75) return 'text-emerald-600'
  if (percentage >= 60) return 'text-orange-500'
  return 'text-red-600'
}

/** 75.5 → "bg-emerald-100" etc (background class for badges) */
export const getAttendanceBg = (percentage) => {
  if (percentage >= 75) return 'bg-emerald-100'
  if (percentage >= 60) return 'bg-orange-100'
  return 'bg-red-100'
}

/** Calculate percentage safely */
export const calcPercentage = (part, total) => {
  if (!total || total === 0) return 0
  return parseFloat(((part / total) * 100).toFixed(1))
}


// ── Grade helpers (Phase 2) ────────────────────────
const GRADE_SCALE = [
  { min: 90, grade: 'A+', points: 4.0, color: 'text-emerald-600' },
  { min: 85, grade: 'A',  points: 4.0, color: 'text-emerald-600' },
  { min: 80, grade: 'A-', points: 3.7, color: 'text-emerald-500' },
  { min: 75, grade: 'B+', points: 3.3, color: 'text-blue-600' },
  { min: 70, grade: 'B',  points: 3.0, color: 'text-blue-500' },
  { min: 65, grade: 'B-', points: 2.7, color: 'text-blue-400' },
  { min: 60, grade: 'C+', points: 2.3, color: 'text-yellow-600' },
  { min: 55, grade: 'C',  points: 2.0, color: 'text-yellow-500' },
  { min: 50, grade: 'C-', points: 1.7, color: 'text-orange-500' },
  { min: 45, grade: 'D+', points: 1.3, color: 'text-orange-600' },
  { min: 40, grade: 'D',  points: 1.0, color: 'text-orange-700' },
  { min: 0,  grade: 'F',  points: 0.0, color: 'text-red-600' },
]

export const getGrade = (obtained, total) => {
  if (!obtained || !total) return null
  const pct = (obtained / total) * 100
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1]
}

export const getGradeColor = (grade) => {
  const found = GRADE_SCALE.find(g => g.grade === grade)
  return found?.color || 'text-slate-600'
}
