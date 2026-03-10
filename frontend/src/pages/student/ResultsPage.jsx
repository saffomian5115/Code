// ═══════════════════════════════════════════════════════════════
//  ResultsPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/ResultsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  BarChart2, Loader2, Award, TrendingUp,
  BookOpen, Hash, Star, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

/* ─── helpers ────────────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})

const PALETTE = ['#5b8af0', '#a78bfa', '#3ecf8e', '#f59e0b', '#f87171', '#38bdf8', '#fb923c', '#e879f9']
const cc = (idx) => PALETTE[idx % PALETTE.length]

/* ─── Grade config ───────────────────────────────────────────── */
const GRADE_CONFIG = {
  'A+': { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', label: 'Outstanding' },
  'A':  { color: '#3ecf8e', bg: 'rgba(62,207,142,0.10)', label: 'Excellent' },
  'A-': { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'Very Good' },
  'B+': { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)', label: 'Good' },
  'B':  { color: '#5b8af0', bg: 'rgba(91,138,240,0.10)', label: 'Good' },
  'B-': { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Above Avg' },
  'C+': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Average' },
  'C':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: 'Average' },
  'D':  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'Below Avg' },
  'F':  { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Fail' },
}
const gradeConf = (g) => GRADE_CONFIG[g] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Pending' }

const EXAM_TYPE_LABEL = {
  midterm: 'Midterm',
  final: 'Final',
  quiz: 'Quiz',
  assignment: 'Assignment',
  lab: 'Lab',
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ ...neu({ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }) }}>
      {[100, 70, 85].map((w, i) => (
        <div key={i} style={{ height: 13, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', width: `${w}%`, animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
    </div>
  )
}

/* ─── CGPA Ring ──────────────────────────────────────────────── */
function CGPARing({ cgpa }) {
  const max = 4.0
  const pct = cgpa ? Math.min((cgpa / max) * 100, 100) : 0
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  const conf = cgpa >= 3.5
    ? { color: '#3ecf8e', label: 'Excellent', icon: '🏆' }
    : cgpa >= 3.0
    ? { color: '#5b8af0', label: 'Very Good', icon: '⭐' }
    : cgpa >= 2.5
    ? { color: '#a78bfa', label: 'Good', icon: '👍' }
    : cgpa >= 2.0
    ? { color: '#f59e0b', label: 'Satisfactory', icon: '📚' }
    : { color: '#94a3b8', label: 'No Data', icon: '—' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      {/* SVG ring */}
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--neu-border)" strokeWidth="8" />
          <circle
            cx="55" cy="55" r={r} fill="none"
            stroke={conf.color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: conf.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
            {cgpa ? cgpa.toFixed(2) : '—'}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CGPA</span>
        </div>
      </div>

      {/* Standing */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{conf.icon}</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: conf.color, fontFamily: 'Outfit, sans-serif' }}>{conf.label}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>Academic Standing</p>
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{ height: 6, width: 80, borderRadius: '9999px', background: 'var(--neu-surface-deep)', overflow: 'hidden', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: conf.color, borderRadius: '9999px', transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>{pct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Course Grade Card ──────────────────────────────────────── */
function CourseGradeCard({ enr, idx, examResults }) {
  const [expanded, setExpanded] = useState(false)
  const color = cc(idx)
  const gc = gradeConf(enr.grade_letter)
  const myExams = examResults.filter(r => r.course_name === enr.course_name)
  const init = (enr.course_code || enr.course_name || '?').slice(0, 2).toUpperCase()

  return (
    <div style={{
      ...neu({ padding: '1.1rem 1.2rem' }),
      animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        {/* Avatar */}
        <div style={{
          ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0 }),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontWeight: 800, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif',
        }}>
          {init}
        </div>

        {/* Name + code */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--neu-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {enr.course_name}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
            {enr.course_code} · {enr.credit_hours} cr hrs
          </p>
        </div>

        {/* Grade badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {enr.grade_letter ? (
            <>
              <div style={{
                padding: '0.35rem 0.75rem', borderRadius: '0.65rem',
                background: gc.bg, color: gc.color,
                fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif',
                boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
              }}>
                {enr.grade_letter}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: gc.color, fontWeight: 700 }}>{gc.label}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>{enr.grade_points?.toFixed(2)} pts</p>
              </div>
            </>
          ) : (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.7rem',
              borderRadius: '0.5rem', background: 'rgba(148,163,184,0.1)',
              color: 'var(--neu-text-ghost)',
              boxShadow: '2px 2px 6px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
            }}>In Progress</span>
          )}

          {/* Expand toggle if exam results exist */}
          {myExams.length > 0 && (
            <button onClick={() => setExpanded(p => !p)}
              style={{
                width: 28, height: 28, borderRadius: '0.5rem', border: 'none',
                background: 'var(--neu-surface-deep)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '2px 2px 6px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
                color: 'var(--neu-text-muted)', flexShrink: 0,
              }}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded exam rows */}
      {expanded && myExams.length > 0 && (
        <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ height: 1, background: 'var(--neu-border)', marginBottom: '0.35rem' }} />
          {myExams.map((r, i) => {
            const pct = r.total_marks ? ((r.obtained_marks / r.total_marks) * 100).toFixed(1) : null
            const isPass = pct ? parseFloat(pct) >= 50 : null
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.55rem 0.75rem', borderRadius: '0.75rem',
                background: 'var(--neu-surface-deep)',
                boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
              }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.55rem',
                  borderRadius: '0.4rem', background: `${color}18`, color,
                  textTransform: 'capitalize', flexShrink: 0,
                }}>
                  {EXAM_TYPE_LABEL[r.exam_type] || r.exam_type}
                </span>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <div style={{ flex: 1, height: 5, borderRadius: '9999px', background: 'var(--neu-border)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct || 0}%`,
                        background: pct >= 70 ? '#3ecf8e' : pct >= 50 ? '#5b8af0' : '#f87171',
                        borderRadius: '9999px', transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', flexShrink: 0 }}>{pct ? `${pct}%` : '—'}</span>
                  </div>
                </div>

                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-secondary)', flexShrink: 0 }}>
                  {r.obtained_marks}/{r.total_marks}
                </span>

                {r.grade && (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem',
                    borderRadius: '0.4rem', background: gradeConf(r.grade).bg,
                    color: gradeConf(r.grade).color, flexShrink: 0,
                  }}>
                    {r.grade}
                  </span>
                )}

                {isPass !== null && (
                  isPass
                    ? <CheckCircle2 size={13} style={{ color: '#3ecf8e', flexShrink: 0 }} />
                    : <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Stat Pill ──────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      ...neu({ padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }),
    }}>
      <div style={{
        ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0 }),
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <Icon size={16} />
      </div>
      <div>
        <p style={{ fontSize: '1.3rem', fontWeight: 900, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600, marginTop: '0.15rem' }}>{label}</p>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ResultsPage() {
  const user = authStore.getUser()
  const studentId = user?.user_id

  const [enrollments, setEnrollments] = useState([])
  const [results, setResults]         = useState([])
  const [cgpa, setCgpa]               = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const enrRes = await studentAPI.getEnrollments()
        const enrData = enrRes.data.data
        setEnrollments(enrData?.enrollments || [])
        setCgpa(enrData?.cgpa)

        const activeSemesterId = enrData?.enrollments?.[0]?.semester_id
        if (studentId && activeSemesterId) {
          const res = await studentAPI.getMyResults(studentId, activeSemesterId)
          setResults(res.data.data?.results || [])
        }
      } catch {
        toast.error('Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const gradedCount   = enrollments.filter(e => e.grade_letter).length
  const passCount     = enrollments.filter(e => e.grade_letter && e.grade_letter !== 'F').length
  const failCount     = enrollments.filter(e => e.grade_letter === 'F').length
  const inProgress    = enrollments.filter(e => !e.grade_letter).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
          <BarChart2 size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            My Results
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Academic performance overview</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* ── CGPA + Stats Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1.25rem', alignItems: 'stretch', flexWrap: 'wrap' }}>

            {/* CGPA card */}
            <div style={{ ...neu({ padding: '1.4rem 1.6rem' }) }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Cumulative GPA
              </p>
              <CGPARing cgpa={cgpa} />
              <div style={{ marginTop: '1rem', height: 1, background: 'var(--neu-border)' }} />
              <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.75rem' }}>
                {enrollments.length} courses enrolled · {gradedCount} graded
              </p>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <StatPill icon={Award}      label="Graded"      value={gradedCount} color="#5b8af0" />
              <StatPill icon={CheckCircle2} label="Passed"    value={passCount}   color="#3ecf8e" />
              <StatPill icon={AlertTriangle} label="Failed"   value={failCount}   color="#f87171" />
              <StatPill icon={Clock}      label="In Progress" value={inProgress}  color="#f59e0b" />
            </div>
          </div>

          {/* ── Course Grades ── */}
          <div style={{ ...neu({ padding: '0' }), overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.9rem 1.2rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BookOpen size={16} style={{ color: '#5b8af0' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neu-text-primary)' }}>Course Grades</p>
              <span style={{
                marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                padding: '0.2rem 0.55rem', borderRadius: '0.5rem',
                background: 'rgba(91,138,240,0.1)', color: '#5b8af0',
              }}>
                {results.length > 0 ? 'Click ▾ for exam details' : 'Grades from enrollments'}
              </span>
            </div>
            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {enrollments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--neu-text-ghost)', fontSize: '0.85rem' }}>
                  No enrollment data found
                </div>
              ) : enrollments.map((e, idx) => (
                <CourseGradeCard
                  key={e.enrollment_id}
                  enr={e}
                  idx={idx}
                  examResults={results}
                />
              ))}
            </div>
          </div>

          {/* ── Exam Results Table (if any) ── */}
          {results.length > 0 && (
            <div style={{ ...neu({ padding: '0' }), overflow: 'hidden' }}>
              <div style={{ padding: '0.9rem 1.2rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <TrendingUp size={16} style={{ color: '#a78bfa' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neu-text-primary)' }}>Exam Results</p>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                  padding: '0.2rem 0.55rem', borderRadius: '0.5rem',
                  background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                }}>
                  {results.length} records
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {['Course', 'Exam Type', 'Marks', 'Percentage', 'Grade', 'Weightage'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '0.65rem 1rem',
                          fontSize: '0.65rem', fontWeight: 700,
                          color: 'var(--neu-text-ghost)', textTransform: 'uppercase',
                          letterSpacing: '0.06em', borderBottom: '1px solid var(--neu-border)',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const pct = r.total_marks ? ((r.obtained_marks / r.total_marks) * 100).toFixed(1) : '—'
                      const gc  = gradeConf(r.grade)
                      return (
                        <tr key={i} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--neu-text-primary)', borderBottom: '1px solid var(--neu-border-inner)' }}>
                            {r.course_name}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border-inner)', textTransform: 'capitalize' }}>
                            {EXAM_TYPE_LABEL[r.exam_type] || r.exam_type}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border-inner)' }}>
                            {r.obtained_marks}/{r.total_marks}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 50, height: 5, borderRadius: '9999px', background: 'var(--neu-border)', overflow: 'hidden', flexShrink: 0 }}>
                                <div style={{
                                  height: '100%',
                                  width: `${pct || 0}%`,
                                  background: pct >= 70 ? '#3ecf8e' : pct >= 50 ? '#5b8af0' : '#f87171',
                                  borderRadius: '9999px',
                                }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>{pct !== '—' ? `${pct}%` : '—'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                            {r.grade ? (
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem',
                                borderRadius: '0.5rem', background: gc.bg, color: gc.color,
                              }}>{r.grade}</span>
                            ) : <span style={{ color: 'var(--neu-text-ghost)', fontSize: '0.75rem' }}>—</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--neu-text-muted)', borderBottom: '1px solid var(--neu-border-inner)' }}>
                            {r.weightage ? `${r.weightage}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}