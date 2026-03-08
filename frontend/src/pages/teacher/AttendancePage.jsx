// ═══════════════════════════════════════════════════════════════
//  AttendancePage.jsx  —  Neumorphic Theme
//  Replace: frontend/src/pages/teacher/AttendancePage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardCheck, BookOpen, BarChart2, AlertTriangle,
  Plus, Loader2, CheckCircle2, Clock, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'

// ── Shared styles ─────────────────────────────────────────────
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})

const inputStyle = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.75rem',
  padding: '0.6rem 0.9rem',
  fontSize: '0.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
}

const STATUS_CFG = {
  present: { label: 'Present', abbr: 'P', color: '#3ecf8e', bg: 'rgba(62,207,142,0.15)' },
  absent:  { label: 'Absent',  abbr: 'A', color: '#f26b6b', bg: 'rgba(242,107,107,0.15)' },
  late:    { label: 'Late',    abbr: 'L', color: '#f5a623', bg: 'rgba(245,166,35,0.15)'  },
  excused: { label: 'Excused', abbr: 'E', color: '#5b8af0', bg: 'rgba(91,138,240,0.15)'  },
}

const thStyle = {
  textAlign: 'left', padding: '0.7rem 1rem',
  fontSize: '0.68rem', fontWeight: 700,
  color: 'var(--neu-text-ghost)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid var(--neu-border)',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '0.7rem 1rem',
  fontSize: '0.82rem',
  color: 'var(--neu-text-secondary)',
  borderBottom: '1px solid var(--neu-border-inner)',
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

// ── Section header ────────────────────────────────────────────
function SectionHeader({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{title}</h2>
        {sub && <p style={{ fontSize: '0.76rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>{sub}</p>}
      </div>
      {right}
    </div>
  )
}

// ── Neu primary button ────────────────────────────────────────
function NeuBtn({ onClick, disabled, loading: isLoading, accent = '#5b8af0', children, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.6rem 1.2rem',
        borderRadius: '0.875rem', border: 'none',
        background: `linear-gradient(145deg, ${accent}ee, ${accent}bb)`,
        boxShadow: `4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)`,
        color: '#fff', fontSize: '0.8rem', fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'transform 0.14s, box-shadow 0.14s',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled && !isLoading) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
    >
      {isLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
      {children}
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.6)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: 'var(--neu-raised-lg)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Create Session Modal ──────────────────────────────────────
function CreateSessionModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({ session_date: new Date().toISOString().split('T')[0], topic: '', session_type: 'lecture', start_time: '', end_time: '', is_makeup: false })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.topic.trim()) { toast.error('Topic required'); return }
    setLoading(true)
    try {
      await teacherAPI.createSession({ offering_id: offeringId, ...form })
      toast.success('Session created!')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>New Session</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '0.25rem' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {[
          { label: 'Date', key: 'session_date', type: 'date' },
          { label: 'Topic *', key: 'topic', type: 'text' },
          { label: 'Start Time', key: 'start_time', type: 'time' },
          { label: 'End Time', key: 'end_time', type: 'time' },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
          <select value={form.session_type} onChange={e => set('session_type', e.target.value)} style={selectStyle}>
            {['lecture', 'lab', 'tutorial', 'workshop'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--neu-text-secondary)' }}>
          <input type="checkbox" checked={form.is_makeup} onChange={e => set('is_makeup', e.target.checked)} />
          Makeup session
        </label>
      </div>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleSubmit} loading={loading}>Create Session</NeuBtn>
      </div>
    </Modal>
  )
}

// ── Mark Attendance Tab ───────────────────────────────────────
function MarkAttendanceTab({ offeringId }) {
  const [sessions, setSessions]   = useState([])
  const [students, setStudents]   = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const loadSessions = useCallback(async () => {
    try { const res = await teacherAPI.getOfferingSessions(offeringId); setSessions(res.data.data?.sessions || []) }
    catch { toast.error('Failed to load sessions') }
  }, [offeringId])

  const loadStudents = useCallback(async () => {
    try {
      const res = await teacherAPI.getOfferingStudents(offeringId)
      const studs = res.data.data?.students || []
      setStudents(studs)
      const d = {}; studs.forEach(s => { d[s.student_id] = 'present' }); setAttendance(d)
    } catch { toast.error('Failed to load students') }
  }, [offeringId])

  useEffect(() => { loadSessions(); loadStudents() }, [offeringId])

  const handleSelectSession = async (session) => {
    setSelectedSession(session)
    if (session.attendance_marked) {
      setLoading(true)
      try {
        const res = await teacherAPI.getSessionAttendance(session.id)
        const records = res.data.data?.records || []
        const existing = {}; records.forEach(r => { existing[r.student_id] = r.status })
        const merged = {}; students.forEach(s => { merged[s.student_id] = existing[s.student_id] || 'absent' })
        setAttendance(merged)
      } catch { toast.error('Failed to load attendance') }
      finally { setLoading(false) }
    } else {
      const d = {}; students.forEach(s => { d[s.student_id] = 'present' }); setAttendance(d)
    }
  }

  const setAll = (status) => { const a = {}; students.forEach(s => { a[s.student_id] = status }); setAttendance(a) }

  const handleSave = async () => {
    if (!selectedSession) { toast.error('Select a session first'); return }
    setSaving(true)
    try {
      const records = students.map(s => ({ student_id: s.student_id, status: attendance[s.student_id] || 'absent' }))
      if (selectedSession.attendance_marked) {
        await Promise.all(records.map(r => teacherAPI.updateAttendance(selectedSession.id, r.student_id, { status: r.status })))
      } else {
        await teacherAPI.markAttendance(selectedSession.id, { records })
      }
      toast.success('Attendance saved!'); loadSessions()
    } catch { toast.error('Failed to save attendance') }
    finally { setSaving(false) }
  }

  const counts = Object.values(attendance).reduce((a, s) => { a[s] = (a[s] || 0) + 1; return a }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Session selector + new session */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>Session</label>
          <select style={selectStyle} value={selectedSession?.id || ''} onChange={e => { const s = sessions.find(x => x.id === parseInt(e.target.value)); if (s) handleSelectSession(s) }}>
            <option value="">-- Select Session --</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{formatDate(s.session_date)} — {s.topic} {s.attendance_marked ? '✓' : ''}</option>)}
          </select>
        </div>
        <NeuBtn onClick={() => setShowCreate(true)}><Plus size={14} /> New Session</NeuBtn>
      </div>

      {selectedSession && (
        <>
          {/* Session info bar */}
          <div style={{
            ...neu({ borderRadius: '0.875rem', padding: '0.85rem 1rem' }),
            background: 'rgba(91,138,240,0.06)',
            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--neu-text-primary)' }}>{selectedSession.topic}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>{formatDate(selectedSession.session_date)} · {selectedSession.session_type}</p>
            </div>
            {selectedSession.attendance_marked && (
              <span style={{ background: 'rgba(62,207,142,0.15)', color: '#3ecf8e', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={12} /> Already Marked
              </span>
            )}
          </div>

          {/* Bulk actions + stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Mark all:</span>
              {Object.entries(STATUS_CFG).map(([st, cfg]) => (
                <button key={st} onClick={() => setAll(st)}
                  style={{
                    padding: '0.3rem 0.8rem', borderRadius: '0.5rem',
                    border: `1px solid ${cfg.color}40`,
                    background: cfg.bg, color: cfg.color,
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'transform 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {Object.entries(counts).map(([st, c]) => (
                <span key={st} style={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_CFG[st]?.color || 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CFG[st]?.color }} />
                  {c} {st}
                </span>
              ))}
            </div>
          </div>

          {/* Student List */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} /></div>
          ) : (
            <div style={{ ...neu(), overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Student', 'Roll No', 'Status'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const st = attendance[student.student_id] || 'present'
                      return (
                        <tr key={student.student_id}
                          style={{ transition: 'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td style={{ ...tdStyle, width: 40, color: 'var(--neu-text-ghost)' }}>{idx + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{student.full_name}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{student.roll_number}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {Object.entries(STATUS_CFG).map(([s, cfg]) => (
                                <button key={s} onClick={() => setAttendance(p => ({ ...p, [student.student_id]: s }))}
                                  title={cfg.label}
                                  style={{
                                    width: 30, height: 30, borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                    background: st === s ? cfg.color : 'var(--neu-surface-deep)',
                                    color: st === s ? '#fff' : 'var(--neu-text-ghost)',
                                    fontSize: '0.68rem', fontWeight: 800,
                                    boxShadow: st === s
                                      ? `3px 3px 8px var(--neu-shadow-dark), -1px -1px 4px ${cfg.color}60`
                                      : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                                    transition: 'all 0.14s',
                                  }}>
                                  {cfg.abbr}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <NeuBtn onClick={handleSave} loading={saving}><ClipboardCheck size={14} /> Save Attendance</NeuBtn>
          </div>
        </>
      )}

      {showCreate && (
        <CreateSessionModal offeringId={offeringId} onClose={() => setShowCreate(false)} onSuccess={loadSessions} />
      )}
    </div>
  )
}

// ── Sessions History Tab ──────────────────────────────────────
function SessionsTab({ offeringId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getOfferingSessions(offeringId)
      .then(r => setSessions(r.data.data?.sessions || []))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [offeringId])

  return (
    <div style={{ ...neu(), overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Topic', 'Type', 'Time', 'Attendance', 'Marked At'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={tdStyle}><div style={{ height: 16, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.4s ease-in-out infinite' }} /></td>
                  ))}
                </tr>
              ))
            ) : sessions.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>No sessions yet — create your first session</td></tr>
            ) : (
              sessions.map(s => (
                <tr key={s.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  style={{ transition: 'background 0.12s' }}
                >
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{formatDate(s.session_date)}</td>
                  <td style={tdStyle}>{s.topic}</td>
                  <td style={tdStyle}>
                    <span style={{ background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem', textTransform: 'capitalize' }}>
                      {s.session_type}
                    </span>
                    {s.is_makeup && <span style={{ marginLeft: '0.35rem', background: 'rgba(245,166,35,0.12)', color: '#f5a623', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>Makeup</span>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>{s.start_time} – {s.end_time}</td>
                  <td style={tdStyle}>
                    {s.attendance_marked
                      ? <span style={{ color: '#3ecf8e', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={13} /> Marked</span>
                      : <span style={{ color: 'var(--neu-text-ghost)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} /> Pending</span>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>{formatDateTime(s.marked_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Report Tab ────────────────────────────────────────────────
function ReportTab({ offeringId }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getAttendanceReport(offeringId)
      .then(r => setReport(r.data.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }, [offeringId])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Loader2 size={26} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} /></div>
  if (!report) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        {[
          { label: 'Total Sessions', value: report.total_sessions, color: '#5b8af0', bg: 'rgba(91,138,240,0.08)' },
          { label: 'Total Students', value: report.total_students, color: 'var(--neu-text-secondary)', bg: 'var(--neu-surface-deep)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ ...neu({ borderRadius: '0.875rem', padding: '1.25rem 1.5rem' }), background: bg }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Outfit,sans-serif' }}>{value}</p>
          </div>
        ))}
      </div>
      <div style={{ ...neu(), overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Student', 'Roll No', 'Attended', 'Absent', 'Percentage', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {report.report?.map(r => {
                const pct = r.percentage || 0
                const color = pct >= 75 ? '#3ecf8e' : pct >= 60 ? '#f5a623' : '#f26b6b'
                return (
                  <tr key={r.student_id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ transition: 'background 0.12s' }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{r.full_name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.roll_number}</td>
                    <td style={{ ...tdStyle, color: '#3ecf8e', fontWeight: 700 }}>{r.attended}</td>
                    <td style={{ ...tdStyle, color: '#f26b6b', fontWeight: 700 }}>{r.absent}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 60, height: 5, borderRadius: '999px', background: 'var(--neu-surface-deep)', overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontWeight: 700, color, fontSize: '0.8rem' }}>{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: pct >= 75 ? 'rgba(62,207,142,0.12)' : 'rgba(242,107,107,0.12)', color: pct >= 75 ? '#3ecf8e' : '#f26b6b', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem' }}>
                        {pct >= 75 ? 'OK' : 'Short'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Short Attendance Tab ──────────────────────────────────────
function ShortAttendanceTab({ offeringId }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getShortAttendance(offeringId)
      .then(r => setStudents(r.data.data?.students || []))
      .catch(() => toast.error('Failed to load short attendance'))
      .finally(() => setLoading(false))
  }, [offeringId])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Loader2 size={26} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        ...neu({ borderRadius: '0.875rem', padding: '0.85rem 1.1rem' }),
        background: students.length > 0 ? 'rgba(242,107,107,0.06)' : 'rgba(62,207,142,0.06)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        {students.length > 0
          ? <AlertTriangle size={18} style={{ color: '#f26b6b', flexShrink: 0 }} />
          : <CheckCircle2 size={18} style={{ color: '#3ecf8e', flexShrink: 0 }} />}
        <p style={{ fontSize: '0.83rem', fontWeight: 700, color: students.length > 0 ? '#f26b6b' : '#3ecf8e' }}>
          {students.length > 0 ? `${students.length} students below 75% attendance threshold` : 'All students have satisfactory attendance'}
        </p>
      </div>
      {students.length > 0 && (
        <div style={{ ...neu(), overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Student', 'Roll No', 'Attended', 'Total', 'Percentage', 'Shortage'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.student_id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(242,107,107,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ transition: 'background 0.12s' }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{s.full_name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.roll_number}</td>
                    <td style={{ ...tdStyle, color: '#3ecf8e', fontWeight: 700 }}>{s.attended_classes}</td>
                    <td style={{ ...tdStyle, color: 'var(--neu-text-muted)' }}>{s.total_classes}</td>
                    <td style={{ ...tdStyle, color: '#f26b6b', fontWeight: 800 }}>{s.percentage?.toFixed(1)}%</td>
                    <td style={tdStyle}>
                      <span style={{ background: 'rgba(242,107,107,0.12)', color: '#f26b6b', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '0.4rem' }}>
                        -{s.shortage?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const TAB_CFG = [
  { key: 'mark',     label: 'Mark Attendance', icon: ClipboardCheck },
  { key: 'sessions', label: 'Session History',  icon: BookOpen },
  { key: 'report',   label: 'Full Report',      icon: BarChart2 },
  { key: 'short',    label: 'Short Attendance', icon: AlertTriangle },
]

export default function AttendancePage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [tab, setTab] = useState('mark')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>Attendance</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>Manage sessions and track student attendance</p>
        </div>
        {loading ? (
          <Loader2 size={20} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}
            style={{ ...selectStyle, width: 'auto', minWidth: 260 }}>
            <option value="">-- Select Course --</option>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
        )}
      </div>

      {!selectedOffering ? (
        <div style={{ ...neu({ padding: '4rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'rgba(91,138,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
            <ClipboardCheck size={24} style={{ color: '#5b8af0' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.93rem' }}>Select a course to manage attendance</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '0.35rem', flexWrap: 'wrap',
            background: 'var(--neu-surface-deep)',
            boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
            padding: '0.35rem', borderRadius: '1rem', width: 'fit-content',
          }}>
            {TAB_CFG.map(t => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none',
                    background: active ? 'var(--neu-surface)' : 'none',
                    boxShadow: active ? '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)' : 'none',
                    color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)',
                    fontSize: '0.8rem', fontWeight: active ? 700 : 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s',
                  }}
                >
                  <Icon size={14} /> {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {tab === 'mark'     && <MarkAttendanceTab  offeringId={selectedOffering} />}
          {tab === 'sessions' && <SessionsTab        offeringId={selectedOffering} />}
          {tab === 'report'   && <ReportTab          offeringId={selectedOffering} />}
          {tab === 'short'    && <ShortAttendanceTab offeringId={selectedOffering} />}
        </>
      )}
    </div>
  )
}