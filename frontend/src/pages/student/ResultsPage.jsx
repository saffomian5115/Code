// ═══════════════════════════════════════════════════════════════
//  ResultsPage.jsx (Student) — Premium Version
//  Features: Graphs, Animations, Modern UI, Smooth Loading
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Loader2, Award, TrendingUp, BookOpen, Star,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock,
  Download, PieChart, LineChart as LineChartIcon , BarChart3, Zap, Target,
  Calendar, Sparkles, GraduationCap, Trophy, Medal,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart,
  Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar,
} from 'recharts'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { adminAPI } from '../../api/admin.api'

/* ─── Animations Config ───────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

/* ─── Grade Config ────────────────────────────────────────────── */
const GRADE_CONFIG = {
  'A+': { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', label: 'Outstanding', points: 4.0 },
  'A':  { color: '#3ecf8e', bg: 'rgba(62,207,142,0.10)', label: 'Excellent', points: 4.0 },
  'A-': { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'Very Good', points: 3.7 },
  'B+': { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)', label: 'Good', points: 3.3 },
  'B':  { color: '#5b8af0', bg: 'rgba(91,138,240,0.10)', label: 'Good', points: 3.0 },
  'B-': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Above Avg', points: 2.7 },
  'C+': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Average', points: 2.3 },
  'C':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: 'Average', points: 2.0 },
  'D':  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'Below Avg', points: 1.0 },
  'F':  { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Fail', points: 0.0 },
}
const gradeConf = (g) => GRADE_CONFIG[g] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Pending', points: 0 }

const EXAM_TYPE_LABEL = {
  midterm: 'Midterm',
  final: 'Final',
  quiz: 'Quiz',
  assignment: 'Assignment',
  lab: 'Lab',
}

const CHART_COLORS = ['#5b8af0', '#a78bfa', '#3ecf8e', '#f59e0b', '#f87171', '#38bdf8', '#fb923c', '#e879f9']

/* ─── Skeleton Loader ────────────────────────────────────────── */
function PremiumSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'var(--neu-surface)',
            borderRadius: '1.25rem',
            padding: '1.2rem',
            boxShadow: 'var(--neu-raised)',
            border: '1px solid var(--neu-border)',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '0.875rem',
              background: 'linear-gradient(90deg, var(--neu-surface-deep) 25%, var(--neu-border) 50%, var(--neu-surface-deep) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: 14, width: '60%', borderRadius: '0.5rem',
                background: 'linear-gradient(90deg, var(--neu-surface-deep) 25%, var(--neu-border) 50%, var(--neu-surface-deep) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                marginBottom: '0.5rem',
              }} />
              <div style={{
                height: 10, width: '40%', borderRadius: '0.5rem',
                background: 'linear-gradient(90deg, var(--neu-surface-deep) 25%, var(--neu-border) 50%, var(--neu-surface-deep) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite 0.2s',
              }} />
            </div>
          </div>
        </motion.div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

/* ─── CGPA Ring Card ─────────────────────────────────────────── */
function CGPARingCard({ cgpa, totalCourses, gradedCourses }) {
  const max = 4.0
  const pct = cgpa ? Math.min((cgpa / max) * 100, 100) : 0

  const conf = cgpa >= 3.5
    ? { color: '#3ecf8e', label: 'Outstanding', icon: '🏆', text: 'Top Performer!' }
    : cgpa >= 3.0
    ? { color: '#5b8af0', label: 'Excellent', icon: '⭐', text: 'Keep it up!' }
    : cgpa >= 2.5
    ? { color: '#a78bfa', label: 'Good', icon: '👍', text: 'Room for growth' }
    : cgpa >= 2.0
    ? { color: '#f59e0b', label: 'Satisfactory', icon: '📚', text: 'Focus needed' }
    : { color: '#94a3b8', label: 'No Data', icon: '—', text: 'Complete courses to see CGPA' }

  return (
    <motion.div variants={itemVariants} style={{
      background: 'var(--neu-surface)',
      boxShadow: 'var(--neu-raised)',
      border: '1px solid var(--neu-border)',
      borderRadius: '1.5rem',
      padding: '1.5rem',
      height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cumulative GPA
          </p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: conf.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>
            {cgpa ? cgpa.toFixed(2) : '—'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '0.25rem' }}>
            {conf.text}
          </p>
        </div>
        <div style={{
          width: 90, height: 90, position: 'relative', flexShrink: 0,
        }}>
          <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r="38" fill="none" stroke="var(--neu-border)" strokeWidth="6" />
            <circle
              cx="45" cy="45" r="38" fill="none"
              stroke={conf.color} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.8rem' }}>{conf.icon}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--neu-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>
          <span>📚 {totalCourses} Total Courses</span>
          <span>✅ {gradedCourses} Graded</span>
        </div>
        <div style={{ marginTop: '0.5rem', height: 4, borderRadius: '9999px', background: 'var(--neu-surface-deep)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(gradedCourses / totalCourses) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: conf.color, borderRadius: '9999px' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Stats Grid ─────────────────────────────────────────────── */
function StatsGrid({ gradedCount, passCount, failCount, inProgress }) {
  const stats = [
    { icon: Award, label: 'Graded', value: gradedCount, color: '#5b8af0', gradient: 'linear-gradient(135deg, #5b8af0, #a78bfa)' },
    { icon: CheckCircle2, label: 'Passed', value: passCount, color: '#3ecf8e', gradient: 'linear-gradient(135deg, #3ecf8e, #38bdf8)' },
    { icon: AlertTriangle, label: 'Failed', value: failCount, color: '#f87171', gradient: 'linear-gradient(135deg, #f87171, #fb923c)' },
    { icon: Clock, label: 'In Progress', value: inProgress, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', height: '100%' }}>
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          custom={idx}
          style={{
            background: 'var(--neu-surface)',
            boxShadow: 'var(--neu-raised)',
            border: '1px solid var(--neu-border)',
            borderRadius: '1.25rem',
            padding: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '0.875rem',
            background: `${stat.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: stat.color,
          }}>
            <stat.icon size={18} />
          </div>
          <div>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Grade Distribution Chart ───────────────────────────────── */
function GradeDistributionChart({ enrollments }) {
  const gradeDistribution = useMemo(() => {
    const dist = {}
    enrollments.forEach(e => {
      if (e.grade_letter) {
        dist[e.grade_letter] = (dist[e.grade_letter] || 0) + 1
      }
    })
    return Object.entries(dist).map(([grade, count]) => ({
      grade,
      count,
      color: GRADE_CONFIG[grade]?.color || '#94a3b8',
      label: GRADE_CONFIG[grade]?.label || grade,
    })).sort((a, b) => {
      const order = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F']
      return order.indexOf(a.grade) - order.indexOf(b.grade)
    })
  }, [enrollments])

  if (gradeDistribution.length === 0) return null

  return (
    <motion.div variants={itemVariants} style={{
      background: 'var(--neu-surface)',
      boxShadow: 'var(--neu-raised)',
      border: '1px solid var(--neu-border)',
      borderRadius: '1.5rem',
      padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <PieChart size={18} style={{ color: '#a78bfa' }} />
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>Grade Distribution</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RePieChart>
          <Pie
            data={gradeDistribution}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
            label={({ grade, percent }) => `${grade} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: 'var(--neu-text-ghost)', strokeWidth: 1 }}
          >
            {gradeDistribution.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} stroke="var(--neu-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--neu-surface)',
              border: '1px solid var(--neu-border)',
              borderRadius: '0.75rem',
              boxShadow: 'var(--neu-raised)',
            }}
            formatter={(value, name, props) => [`${value} course(s)`, props.payload.grade]}
          />
        </RePieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        {gradeDistribution.map(g => (
          <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: g.color }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>{g.grade}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Course Performance Chart ───────────────────────────────── */
function CoursePerformanceChart({ enrollments }) {
  const [expanded, setExpanded] = useState(false)
  const topCourses = useMemo(() => {
    return enrollments
      .filter(e => e.grade_points && e.grade_points > 0)
      .map(e => ({
        name: e.course_name?.length > 25 ? e.course_name.slice(0, 22) + '...' : e.course_name,
        fullName: e.course_name,
        gradePoints: e.grade_points,
        grade: e.grade_letter,
        creditHours: e.credit_hours || 3,
      }))
      .sort((a, b) => b.gradePoints - a.gradePoints)
  }, [enrollments])

  if (topCourses.length === 0) return null

  const displayCourses = expanded ? topCourses : topCourses.slice(0, 5)

  return (
    <motion.div variants={itemVariants} style={{
      background: 'var(--neu-surface)',
      boxShadow: 'var(--neu-raised)',
      border: '1px solid var(--neu-border)',
      borderRadius: '1.5rem',
      padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} style={{ color: '#5b8af0' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>Course Performance</p>
        </div>
        {topCourses.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent', border: 'none', fontSize: '0.7rem',
              color: '#5b8af0', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {expanded ? 'Show Less ↑' : `Show All (${topCourses.length}) ↓`}
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={displayCourses} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" horizontal={false} />
          <XAxis type="number" domain={[0, 4]} tickFormatter={(v) => v.toFixed(1)} stroke="var(--neu-text-ghost)" fontSize={11} />
          <YAxis type="category" dataKey="name" stroke="var(--neu-text-ghost)" fontSize={10} width={80} />
          <Tooltip
            contentStyle={{
              background: 'var(--neu-surface)',
              border: '1px solid var(--neu-border)',
              borderRadius: '0.75rem',
              boxShadow: 'var(--neu-raised)',
            }}
            formatter={(value, name, props) => {
              const course = props.payload
              return [`${value.toFixed(2)} GPA`, `${course.grade} · ${course.creditHours} credits`]
            }}
            labelFormatter={(label, props) => props[0]?.payload?.fullName || label}
          />
          <Bar dataKey="gradePoints" fill="#5b8af0" radius={[0, 8, 8, 0]}>
            {displayCourses.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={GRADE_CONFIG[entry.grade]?.color || '#5b8af0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

/* ─── Semester Selector ───────────────────────────────────────── */
function SemesterSelector({ semesters, selected, onChange }) {
  if (!semesters || semesters.length <= 1) return null

  return (
    <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {semesters.map(sem => {
        const isActive = selected === sem.id
        return (
          <motion.button
            key={sem.id}
            onClick={() => onChange(sem.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '0.8rem',
              background: isActive ? 'var(--neu-surface)' : 'transparent',
              color: isActive ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)',
              boxShadow: isActive ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Calendar size={12} />
            {sem.name}
            {sem.is_active && (
              <span style={{
                fontSize: '0.6rem',
                background: 'rgba(62,207,142,0.15)',
                color: '#3ecf8e',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.4rem',
              }}>
                Active
              </span>
            )}
          </motion.button>
        )
      })}
    </motion.div>
  )
}

/* ─── Course Grade Card ───────────────────────────────────────── */
function CourseGradeCard({ enr, idx, examResults }) {
  const [expanded, setExpanded] = useState(false)
  const gc = gradeConf(enr.grade_letter)
  const myExams = examResults.filter(r =>
    r.course_name === enr.course_name || r.offering_id === enr.offering_id
  )
  const initial = (enr.course_code || enr.course_name || '?').slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -2 }}
      style={{
        background: 'var(--neu-surface)',
        boxShadow: 'var(--neu-raised)',
        border: '1px solid var(--neu-border)',
        borderRadius: '1.25rem',
        padding: '1rem 1.2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
          background: 'var(--neu-surface-deep)',
          boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.85rem', color: CHART_COLORS[idx % CHART_COLORS.length],
        }}>
          {initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--neu-text-primary)' }}>
            {enr.course_name}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
            {enr.course_code} • {enr.credit_hours || 3} Credits
            {enr.semester_name && ` • ${enr.semester_name}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {enr.grade_letter ? (
            <>
              <div style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '0.65rem',
                background: gc.bg,
                color: gc.color,
                fontWeight: 800,
                fontSize: '0.95rem',
                fontFamily: 'Outfit, sans-serif',
              }}>
                {enr.grade_letter}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: gc.color, fontWeight: 700 }}>{gc.label}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>{enr.grade_points?.toFixed(2)} GPA</p>
              </div>
            </>
          ) : (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.8rem',
              borderRadius: '0.5rem', background: 'rgba(148,163,184,0.1)',
              color: 'var(--neu-text-ghost)',
            }}>In Progress</span>
          )}

          {myExams.length > 0 && (
            <motion.button
              onClick={() => setExpanded(p => !p)}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 28, height: 28, borderRadius: '0.5rem', border: 'none',
                background: 'var(--neu-surface-deep)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '2px 2px 6px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
                color: 'var(--neu-text-muted)',
              }}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && myExams.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ height: 1, background: 'var(--neu-border)', marginBottom: '0.35rem' }} />
              {myExams.map((r, i) => {
                const pct = r.total_marks ? ((r.obtained_marks / r.total_marks) * 100).toFixed(1) : null
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.55rem 0.75rem', borderRadius: '0.75rem',
                      background: 'var(--neu-surface-deep)',
                      boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                    }}
                  >
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.55rem',
                      borderRadius: '0.4rem', background: `${CHART_COLORS[idx % CHART_COLORS.length]}18`,
                      color: CHART_COLORS[idx % CHART_COLORS.length],
                      textTransform: 'capitalize',
                    }}>
                      {EXAM_TYPE_LABEL[r.exam_type] || r.exam_type}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ flex: 1, height: 5, borderRadius: '9999px', background: 'var(--neu-border)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct || 0}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            style={{
                              height: '100%',
                              background: pct >= 70 ? '#3ecf8e' : pct >= 50 ? '#5b8af0' : '#f87171',
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>{pct ? `${pct}%` : '—'}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-secondary)' }}>
                      {r.obtained_marks}/{r.total_marks}
                    </span>
                    {r.grade && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem',
                        borderRadius: '0.4rem', background: gradeConf(r.grade).bg,
                        color: gradeConf(r.grade).color,
                      }}>
                        {r.grade}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function ResultsPage() {
  const user = authStore.getUser()
  const studentId = user?.user_id ?? user?.id

  const [enrollments, setEnrollments] = useState([])
  const [results, setResults] = useState([])
  const [cgpa, setCgpa] = useState(null)
  const [semesters, setSemesters] = useState([])
  const [selectedSemId, setSelectedSemId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)

  // Load enrollments + semesters
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const enrRes = await studentAPI.getEnrollments()
        const enrData = enrRes.data.data
        const allEnrollments = enrData?.enrollments || []
        setEnrollments(allEnrollments)
        setCgpa(enrData?.cgpa)

        // Collect unique semesters
        const semMap = {}
        allEnrollments.forEach(e => {
          if (e.semester_id && e.semester_name) {
            semMap[e.semester_id] = { id: e.semester_id, name: e.semester_name, is_active: false }
          }
        })

        let semList = Object.values(semMap)

        if (semList.length === 0) {
          try {
            const semRes = await adminAPI.getSemesters()
            semList = (semRes.data.data?.semesters || []).map(s => ({
              id: s.id, name: s.name, is_active: s.is_active,
            }))
          } catch (_) {}
        }

        setSemesters(semList)

        if (semList.length > 0) {
          const activeFromEnr = allEnrollments.find(e => e.semester_id)
          if (activeFromEnr) {
            setSelectedSemId(activeFromEnr.semester_id)
          } else {
            try {
              const actRes = await adminAPI.getActiveSemester()
              const actId = actRes.data.data?.id
              if (actId) setSelectedSemId(actId)
              else setSelectedSemId(semList[0].id)
            } catch (_) {
              setSelectedSemId(semList[0].id)
            }
          }
        }
      } catch (err) {
        console.error('Results page error:', err)
        toast.error('Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    fetchBase()
  }, [])

  // Load exam results
  useEffect(() => {
    if (!selectedSemId || !studentId) return
    setResultsLoading(true)
    studentAPI.getMyResults(studentId, selectedSemId)
      .then(r => setResults(r.data.data?.results || []))
      .catch(err => {
        if (err.response?.status !== 404) console.error('Results fetch error:', err)
        setResults([])
      })
      .finally(() => setResultsLoading(false))
  }, [selectedSemId, studentId])

  const semesterEnrollments = selectedSemId
    ? enrollments.filter(e => e.semester_id === selectedSemId)
    : enrollments

  const gradedCount = semesterEnrollments.filter(e => e.grade_letter).length
  const passCount = semesterEnrollments.filter(e => e.grade_letter && e.grade_letter !== 'F').length
  const failCount = semesterEnrollments.filter(e => e.grade_letter === 'F').length
  const inProgress = semesterEnrollments.filter(e => !e.grade_letter).length

  if (loading) return <PremiumSkeleton />

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ maxWidth: 1300, margin: '0 auto', paddingBottom: '3rem', paddingInline: '1rem' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{
          width: 50, height: 50, borderRadius: '1rem',
          background: 'linear-gradient(135deg, #5b8af0, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 25px -5px rgba(91,138,240,0.3)',
        }}>
          <GraduationCap size={24} style={{ color: 'white' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            Academic Results
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Track your performance across all semesters</p>
        </div>
      </motion.div>

      {/* Semester Selector */}
      <SemesterSelector semesters={semesters} selected={selectedSemId} onChange={setSelectedSemId} />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <CGPARingCard cgpa={cgpa} totalCourses={enrollments.length} gradedCourses={enrollments.filter(e => e.grade_letter).length} />
        <StatsGrid gradedCount={gradedCount} passCount={passCount} failCount={failCount} inProgress={inProgress} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <GradeDistributionChart enrollments={semesterEnrollments} />
        <CoursePerformanceChart enrollments={semesterEnrollments} />
      </div>

      {/* Course Grades Section */}
      <motion.div variants={itemVariants} style={{
        background: 'var(--neu-surface)',
        boxShadow: 'var(--neu-raised)',
        border: '1px solid var(--neu-border)',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          padding: '1rem 1.2rem',
          borderBottom: '1px solid var(--neu-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <BookOpen size={16} style={{ color: '#5b8af0' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neu-text-primary)' }}>
            Course Grades
            {semesters.find(s => s.id === selectedSemId)?.name
              ? ` — ${semesters.find(s => s.id === selectedSemId).name}`
              : ''}
          </p>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '0.3rem 0.8rem', borderRadius: '0.6rem', border: 'none',
                background: 'var(--neu-surface-deep)', fontSize: '0.65rem',
                fontWeight: 600, color: 'var(--neu-text-ghost)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
              onClick={() => toast.success('Report export coming soon!')}
            >
              <Download size={12} /> Export
            </motion.button>
          </div>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {semesterEnrollments.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              textAlign: 'center', padding: '3rem 1rem', color: 'var(--neu-text-ghost)',
            }}>
              <BookOpen size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
              <p>No courses found for this semester</p>
            </motion.div>
          ) : (
            semesterEnrollments.map((e, idx) => (
              <CourseGradeCard key={e.enrollment_id || e.offering_id} enr={e} idx={idx} examResults={results} />
            ))
          )}
        </div>
      </motion.div>

      {/* Exam Results Table */}
      {resultsLoading ? (
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 size={28} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </motion.div>
      ) : results.length > 0 && (
        <motion.div variants={itemVariants} style={{
          background: 'var(--neu-surface)',
          boxShadow: 'var(--neu-raised)',
          border: '1px solid var(--neu-border)',
          borderRadius: '1.5rem',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={16} style={{ color: '#a78bfa' }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neu-text-primary)' }}>Exam Results Breakdown</p>
            <span style={{
              marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
              padding: '0.2rem 0.55rem', borderRadius: '0.5rem',
              background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
            }}>
              {results.length} Records
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Course', 'Exam Type', 'Marks', 'Performance', 'Grade', 'Weightage'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '0.75rem 1rem',
                      fontSize: '0.65rem', fontWeight: 700,
                      color: 'var(--neu-text-ghost)', textTransform: 'uppercase',
                      letterSpacing: '0.06em', borderBottom: '1px solid var(--neu-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const pct = r.total_marks ? ((r.obtained_marks / r.total_marks) * 100).toFixed(1) : '—'
                  const gc = gradeConf(r.grade)
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--neu-text-primary)', borderBottom: '1px solid var(--neu-border)' }}>
                        {r.course_name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border)', textTransform: 'capitalize' }}>
                        {EXAM_TYPE_LABEL[r.exam_type] || r.exam_type}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border)' }}>
                        {r.obtained_marks}/{r.total_marks}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 100 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: '9999px', background: 'var(--neu-border)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct || 0}%`, height: '100%',
                              background: pct >= 70 ? '#3ecf8e' : pct >= 50 ? '#5b8af0' : '#f87171',
                              borderRadius: '9999px',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>{pct !== '—' ? `${pct}%` : '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
                        {r.grade ? (
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem',
                            borderRadius: '0.5rem', background: gc.bg, color: gc.color,
                          }}>{r.grade}</span>
                        ) : <span style={{ color: 'var(--neu-text-ghost)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--neu-text-muted)', borderBottom: '1px solid var(--neu-border)' }}>
                        {r.weightage ? `${r.weightage}%` : '—'}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!resultsLoading && results.length === 0 && semesterEnrollments.length === 0 && (
        <motion.div variants={itemVariants} style={{
          background: 'var(--neu-surface)',
          boxShadow: 'var(--neu-raised)',
          border: '1px solid var(--neu-border)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}>
          <Sparkles size={48} style={{ color: 'var(--neu-text-ghost)', opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-secondary)' }}>No Results Yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)', marginTop: '0.5rem' }}>
            Enroll in courses and complete assessments to see your results here
          </p>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}