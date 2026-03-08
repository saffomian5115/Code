// ═══════════════════════════════════════════════════════════════
//  AttendancePage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/AttendancePage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  ClipboardCheck, Loader2, AlertTriangle,
  Calendar, BarChart3, ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
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

const PALETTE = ['#5b8af0','#a78bfa','#3ecf8e','#f59e0b','#f87171','#38bdf8','#fb923c','#e879f9']
const cc = (idx) => PALETTE[idx % PALETTE.length]

const STATUS = {
  present: { color: '#3ecf8e', bg: 'rgba(62,207,142,0.13)',  label: 'Present' },
  absent:  { color: '#f26b6b', bg: 'rgba(242,107,107,0.13)', label: 'Absent'  },
  late:    { color: '#f5a623', bg: 'rgba(245,166,35,0.13)',  label: 'Late'    },
  excused: { color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', label: 'Excused' },
}

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

/* ─── Circular Ring ──────────────────────────────────────────── */
function Ring({ pct = 0, color = '#5b8af0', size = 110, stroke = 10 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neu-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
          {Math.round(pct)}%
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)', fontWeight: 600, marginTop: 2 }}>attendance</span>
      </div>
    </div>
  )
}

/* ─── KPI chip ───────────────────────────────────────────────── */
function Chip({ label, value, color }) {
  return (
    <div style={{ ...neuInset({ padding: '0.85rem 1rem', borderRadius: '0.875rem' }), display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <p style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      <p style={{ fontSize: '1.45rem', fontWeight: 900, color: color || 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</p>
    </div>
  )
}

/* ─── Dot Grid ───────────────────────────────────────────────── */
function DotGrid({ sessions }) {
  const DOT_COLOR = { present:'#3ecf8e', absent:'#f26b6b', late:'#f5a623', excused:'#a78bfa' }
  const last35 = sessions.slice(-35)
  if (!last35.length) return (
    <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', textAlign: 'center', padding: '1rem 0' }}>No sessions yet</p>
  )
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {last35.map((s, i) => {
          const c = DOT_COLOR[s.status]
          return (
            <div key={i} title={`${fmt(s.session_date)} — ${s.status}`}
              style={{
                aspectRatio: '1', borderRadius: 5,
                background: c || 'var(--neu-border)',
                boxShadow: c
                  ? `inset 2px 2px 4px rgba(0,0,0,0.15), 0 1px 4px ${c}55`
                  : 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                transition: 'transform 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''} />
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {[['#3ecf8e','Present'],['#f26b6b','Absent'],['#f5a623','Late'],['#a78bfa','Excused']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Area Tooltip ───────────────────────────────────────────── */
function AreaTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ ...neu({ padding: '0.4rem 0.75rem', borderRadius: '0.65rem' }), fontSize: '0.73rem', color: 'var(--neu-text-primary)' }}>
      <b>{label}</b>: {Math.round(payload[0]?.value)}%
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AttendancePage() {
  const user = authStore.getUser()
  const [enrollments,     setEnrollments]     = useState([])
  const [selectedIdx,     setSelectedIdx]     = useState(0)
  const [sessions,        setSessions]        = useState([])
  const [summary,         setSummary]         = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [sessLoading,     setSessLoading]     = useState(false)

  /* Load approved enrollments once */
  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => {
        const enrs = (r.data.data?.enrollments || []).filter(e => e.is_approved)
        setEnrollments(enrs)
      })
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setLoading(false))
  }, [])

  /* Load attendance when selected course changes */
  useEffect(() => {
    const enr = enrollments[selectedIdx]
    if (!enr || !user?.user_id) return
    setSessLoading(true)
    setSessions([])
    setSummary(null)
    studentAPI.getAttendance(user.user_id, enr.offering_id)
      .then(r => {
        const d = r.data.data || {}
        setSessions(d.records  || [])
        setSummary(d.summary   || null)
      })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setSessLoading(false))
  }, [selectedIdx, enrollments, user?.user_id])

  /* Derived */
  const pct       = summary?.percentage       || 0
  const attended  = summary?.attended_classes || 0
  const total     = summary?.total_classes    || 0
  const absent    = total - attended
  const pctColor  = pct >= 75 ? '#3ecf8e' : pct >= 60 ? '#f5a623' : '#f26b6b'
  const isShort   = pct > 0 && pct < 75
  const needMore  = Math.max(0, Math.ceil(total * 0.75 - attended))

  /* Weekly trend from session records */
  const trendData = (() => {
    if (sessions.length < 2) return []
    const map = {}
    sessions.forEach(s => {
      if (!s.session_date) return
      const d  = new Date(s.session_date)
      const wk = `W${Math.ceil(d.getDate() / 7)}`
      if (!map[wk]) map[wk] = { t: 0, p: 0 }
      map[wk].t++
      if (s.status === 'present' || s.status === 'late') map[wk].p++
    })
    return Object.entries(map).map(([wk, v]) => ({ week: wk, pct: Math.round((v.p / v.t) * 100) }))
  })()

  const selectedEnr = enrollments[selectedIdx]

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.4} 50%{opacity:.9} }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <Loader2 size={30} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ ...neu({ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
          <div style={{ ...neuInset({ width: 64, height: 64, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ecf8e' }}>
            <ClipboardCheck size={28} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '1rem' }}>No active enrollments</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Enroll in courses to track attendance</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'flex-start' }}>

          {/* ══ LEFT SIDEBAR: Course list ══ */}
          <div style={{
            ...neu({ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }),
            width: 235, flexShrink: 0, position: 'sticky', top: '1rem',
          }}>
            <p style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '0.35rem 0.5rem 0.2rem' }}>
              Courses
            </p>
            {enrollments.map((enr, idx) => {
              const active  = idx === selectedIdx
              const color   = cc(idx)
              const init    = (enr.course_code || enr.course_name || '?').slice(0, 2).toUpperCase()
              return (
                <button key={enr.offering_id} onClick={() => setSelectedIdx(idx)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    padding: '0.65rem 0.75rem', borderRadius: '0.875rem',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    background: active ? 'var(--neu-surface)' : 'transparent',
                    boxShadow: active ? '6px 6px 14px var(--neu-shadow-dark), -3px -3px 9px var(--neu-shadow-light)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Course avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '0.65rem', flexShrink: 0,
                    background: active ? color : `${color}20`,
                    color: active ? '#fff' : color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 900, fontFamily: 'Outfit,sans-serif',
                    transition: 'all 0.18s',
                    boxShadow: active
                      ? `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 3px 9px ${color}44`
                      : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                  }}>
                    {init}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.76rem', fontWeight: active ? 700 : 600,
                      color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: '0.08rem',
                    }}>
                      {enr.course_name}
                    </p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>
                      {enr.course_code}
                    </p>
                  </div>

                  {active && <ChevronRight size={13} style={{ color, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {/* ══ RIGHT: Main content ══ */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp 0.25s ease both' }}>

            {/* Course title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ecf8e' }}>
                <ClipboardCheck size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.2 }}>
                  {selectedEnr?.course_name || 'Attendance'}
                </h1>
                <p style={{ fontSize: '0.73rem', color: 'var(--neu-text-ghost)' }}>
                  {selectedEnr?.course_code}{selectedEnr?.instructor ? ` · ${selectedEnr.instructor}` : ''}
                </p>
              </div>
            </div>

            {sessLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <Loader2 size={26} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* ── KPI row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: '0.8rem', alignItems: 'stretch' }}>
                  <div style={{ ...neu({ padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }) }}>
                    <Ring pct={pct} color={pctColor} size={112} stroke={10} />
                  </div>
                  <Chip label="Classes Attended" value={attended}  color="#3ecf8e" />
                  <Chip label="Total Sessions"   value={total}     color="var(--neu-text-primary)" />
                  <Chip label="Absent"           value={absent}    color={absent > 0 ? '#f26b6b' : 'var(--neu-text-ghost)'} />
                  <Chip label="Still Need"       value={needMore > 0 ? `${needMore} more` : '✓ OK'} color={needMore > 0 ? '#f59e0b' : '#3ecf8e'} />
                </div>

                {/* ── Warning ── */}
                {isShort && (
                  <div style={{
                    ...neu({ padding: '0.9rem 1.1rem', borderRadius: '0.875rem', border: '1px solid rgba(242,107,107,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' })
                  }}>
                    <div style={{ ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f26b6b', flexShrink: 0 }}>
                      <AlertTriangle size={17} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f26b6b' }}>Short Attendance Warning</p>
                      <p style={{ fontSize: '0.73rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
                        {pct.toFixed(1)}% — attend {needMore} more class{needMore !== 1 ? 'es' : ''} to reach the 75% requirement.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Dot grid + Trend chart ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                  {/* Dot grid */}
                  <div style={{ ...neu({ padding: '1.25rem' }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                      <Calendar size={14} style={{ color: '#3ecf8e' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Session Grid</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>Last 35 sessions</span>
                    </div>
                    <DotGrid sessions={sessions} />
                  </div>

                  {/* Trend chart */}
                  <div style={{ ...neu({ padding: '1.25rem' }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                      <BarChart3 size={14} style={{ color: '#5b8af0' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Weekly Trend</span>
                    </div>
                    {trendData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={148}>
                        <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                          <defs>
                            <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={pctColor} stopOpacity={0.28} />
                              <stop offset="95%" stopColor={pctColor} stopOpacity={0}    />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" vertical={false} />
                          <XAxis dataKey="week" tick={{ fill:'var(--neu-text-ghost)', fontSize:9, fontFamily:"'DM Sans'" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0,100]} tick={{ fill:'var(--neu-text-ghost)', fontSize:9 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<AreaTip />} />
                          <Area type="monotone" dataKey="pct" stroke={pctColor} strokeWidth={2.5} fill="url(#tG)" dot={{ fill:pctColor, r:3 }} activeDot={{ r:5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Not enough data for trend</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Session Table ── */}
                <div style={{ ...neu({ overflow: 'hidden' }) }}>
                  <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardCheck size={15} style={{ color: '#5b8af0' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Session Log</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>{sessions.length} sessions</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--neu-surface-deep)' }}>
                          {['#', 'Date', 'Topic', 'Type', 'Status', 'Remarks'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--neu-border)', whiteSpace: 'nowrap' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>
                              No sessions recorded yet
                            </td>
                          </tr>
                        ) : sessions.map((s, i) => {
                          const cfg = STATUS[s.status] || { color: 'var(--neu-text-ghost)', bg: 'var(--neu-surface-deep)', label: s.status || '—' }
                          return (
                            <tr key={i}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                              onMouseLeave={e => e.currentTarget.style.background = ''}
                              style={{ transition: 'background 0.12s' }}>
                              <td style={{ padding: '0.62rem 1rem', fontSize: '0.7rem', color: 'var(--neu-text-ghost)', borderBottom: '1px solid var(--neu-border)', fontFamily: 'monospace' }}>{i + 1}</td>
                              <td style={{ padding: '0.62rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--neu-text-primary)', borderBottom: '1px solid var(--neu-border)', whiteSpace: 'nowrap' }}>{fmt(s.session_date)}</td>
                              <td style={{ padding: '0.62rem 1rem', fontSize: '0.8rem', color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.topic || '—'}</td>
                              <td style={{ padding: '0.62rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
                                <span style={{ ...neuInset({ display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: '0.45rem' }), fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'capitalize' }}>
                                  {s.session_type || 'lecture'}
                                </span>
                              </td>
                              <td style={{ padding: '0.62rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', background: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '0.45rem' }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                  {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.62rem 1rem', fontSize: '0.75rem', color: 'var(--neu-text-ghost)', borderBottom: '1px solid var(--neu-border)' }}>{s.remarks || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}