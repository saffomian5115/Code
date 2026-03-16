import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin.api'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Users, BookOpen, Shield,
  ArrowUpRight, Loader2, Calendar,
} from 'lucide-react'

// ─── Accent palette ───────────────────────────────────────────
const A = {
  blue:   '#5b8af0',
  purple: '#9b59b6',
  green:  '#22a06b',
  orange: '#f97316',
  red:    '#ef4444',
  amber:  '#f59e0b',
}

// ─── Smooth area sparkline ────────────────────────────────────
function AreaChart({ values = [], color = A.blue, height = 48 }) {
  if (values.length < 2) return null
  const W = 200, H = height
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const px = (i) => (i / (values.length - 1)) * W
  const py = (v) => H - ((v - min) / span) * (H - 4) - 2

  // smooth cubic bezier path
  const pts = values.map((v, i) => ({ x: px(i), y: py(v) }))
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1].x + pts[i].x) / 2
    d += ` C ${cx},${pts[i - 1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`
  }
  const area = `${d} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`
  const uid = `ac${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* dot on last point */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y}
        r="3" fill={color} />
    </svg>
  )
}

// ─── Donut ────────────────────────────────────────────────────
function Donut({ segments = [], size = 110 }) {
  const r = 38, cx = 55, cy = 55
  const circ = 2 * Math.PI * r
  const total = segments.reduce((s, g) => s + g.value, 0) || 1
  let gap = 0
  return (
    <svg width={size} height={size} viewBox="0 0 110 110">
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--neu-surface-deep)" strokeWidth="13" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="13"
            strokeDasharray={`${dash - 2} ${circ - dash + 2}`}
            strokeDashoffset={-gap}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )
        gap += dash
        return el
      })}
      {/* center label */}
      <text x={cx} y={cy - 5} textAnchor="middle"
        style={{ fontSize: '14px', fontWeight: 800, fill: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        style={{ fontSize: '7px', fontWeight: 600, fill: 'var(--neu-text-ghost)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        TOTAL
      </text>
    </svg>
  )
}

// ─── Horizontal bar ───────────────────────────────────────────
function HBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ width: '4.5rem', fontSize: '0.7rem', color: 'var(--neu-text-muted)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '5px', borderRadius: '99px', background: 'var(--neu-surface-deep)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 6px ${color}60` }} />
      </div>
      <span style={{ width: '1.5rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--neu-text-secondary)', textAlign: 'right', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--neu-surface)',
      boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
      border: '1px solid var(--neu-border)',
      borderRadius: '1.25rem',
      padding: '1.5rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, spark, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--neu-surface)',
        boxShadow: hov
          ? `8px 8px 20px var(--neu-shadow-dark), -4px -4px 12px var(--neu-shadow-light)`
          : `6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)`,
        border: `1px solid ${hov ? accent + '35' : 'var(--neu-border)'}`,
        borderRadius: '1.25rem',
        padding: '1.25rem 1.25rem 1rem',
        cursor: onClick ? 'pointer' : 'default',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.18s',
        display: 'flex', flexDirection: 'column', gap: '0.1rem',
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div style={{
          width: '2.2rem', height: '2.2rem', borderRadius: '0.7rem',
          background: accent + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        {onClick && (
          <ArrowUpRight size={14} style={{ color: hov ? accent : 'var(--neu-text-ghost)', transition: 'color 0.2s', marginTop: '2px' }} />
        )}
      </div>

      <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neu-text-primary)', lineHeight: 1.1, fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '1px' }}>{sub}</p>
      )}

      {/* sparkline pinned to bottom */}
      {spark && (
        <div style={{ marginTop: '0.75rem', marginLeft: '-1.25rem', marginRight: '-1.25rem', marginBottom: '-1rem' }}>
          <AreaChart values={spark} color={accent} height={44} />
        </div>
      )}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────
function Label({ children }) {
  return (
    <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neu-text-ghost)', marginBottom: '1rem' }}>
      {children}
    </p>
  )
}

// ═════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const nav = useNavigate()
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [s, t, dept, prog, c, off, sem, ann, v, g] = await Promise.all([
          adminAPI.getStudents(1, 100),
          adminAPI.getTeachers(1, 100),
          adminAPI.getDepartments(),
          adminAPI.getPrograms(),
          adminAPI.getCourses(),
          adminAPI.getOfferings(),
          adminAPI.getActiveSemester(),
          adminAPI.getAnnouncements(1, 5),
          adminAPI.getVouchers({ per_page: 200 }),
          adminAPI.getGates(),
        ])
        const semId = sem.data.data?.id
        let atRisk = null, lb = null
        if (semId) {
          try {
            const [ar, l] = await Promise.all([adminAPI.getAtRiskStudents(semId), adminAPI.getLeaderboard(semId, 5)])
            atRisk = ar.data.data?.students || []
            lb     = l.data.data?.leaderboard || []
          } catch (_) {}
        }
        setD({
          students:  s.data.data,  teachers: t.data.data,
          depts:     dept.data.data?.departments || [],
          programs:  prog.data.data?.programs?.length || 0,
          courses:   c.data.data?.courses?.length || 0,
          offerings: off.data.data?.offerings?.length || 0,
          semester:  sem.data.data,
          announcements: ann.data.data?.announcements || [],
          vouchers:  v.data.data?.vouchers || [],
          gates:     g.data.data?.gates || [],
          atRisk:    atRisk || [],
          leaderboard: lb || [],
        })
      } catch (e) {
  console.error(e)
  setD({
    students: { students: [], pagination: { total: 0 } },
    teachers: { teachers: [], pagination: { total: 0 } },
    depts: [], programs: 0, courses: 0, offerings: 0,
    semester: null, announcements: [], vouchers: [],
    gates: [], atRisk: [], leaderboard: [],
  })
}
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 size={28} style={{ color: 'var(--neu-accent)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  // ── derived ───────────────────────────────────────────────
  const totalStudents  = d.students?.pagination?.total || d.students?.students?.length || 0
  const totalTeachers  = d.teachers?.pagination?.total || d.teachers?.teachers?.length || 0
  const paid    = d.vouchers.filter(v => v.status === 'paid').length
  const unpaid  = d.vouchers.filter(v => v.status === 'unpaid').length
  const overdue = d.vouchers.filter(v => v.status === 'overdue').length
  const feeCollected = d.vouchers.filter(v => v.status === 'paid').reduce((s, v) => s + parseFloat(v.amount || 0), 0)
  const activeGates = d.gates.filter(g => g.is_active).length
  const highRisk = d.atRisk.filter(s => s.risk_level === 'high').length
  const medRisk  = d.atRisk.filter(s => s.risk_level === 'medium').length

  const spark = (n) => [0.65, 0.72, 0.78, 0.83, 0.88, 0.94, 1].map(r => Math.round(n * r))
  const deptMax = Math.max(...d.depts.map(dep => dep.student_count || 0), 1)

  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={12} />
            {today}
            {d.semester && (
              <span style={{ marginLeft: '0.35rem', padding: '0.1rem 0.55rem', background: A.blue + '18', color: A.blue, borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700 }}>
                {d.semester.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── 4 KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        <StatCard icon={GraduationCap} label="Students"  value={totalStudents} sub={`${d.programs} programs`}         accent={A.blue}   spark={spark(totalStudents)} onClick={() => nav('/admin/students')} />
        <StatCard icon={Users}         label="Faculty"   value={totalTeachers} sub={`${d.depts.length} departments`}  accent={A.purple} spark={spark(totalTeachers)} onClick={() => nav('/admin/teachers')} />
        <StatCard icon={BookOpen}      label="Offerings" value={d.offerings}   sub={`${d.courses} courses total`}     accent={A.green}  spark={spark(d.offerings)}   onClick={() => nav('/admin/offerings')} />
        <StatCard icon={Shield}        label="Gates"     value={`${activeGates}/${d.gates.length}`} sub="Active / Total" accent={A.orange} onClick={() => nav('/admin/gates')} />
      </div>

      {/* ── row 2: Fee + Departments ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Fee status */}
        <Card>
          <Label>Fee Collection</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <Donut segments={[
              { value: paid,    color: A.green  },
              { value: unpaid,  color: A.amber  },
              { value: overdue, color: A.red    },
            ].filter(s => s.value > 0)} />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Paid',    n: paid,    color: A.green },
                { label: 'Unpaid',  n: unpaid,  color: A.amber },
                { label: 'Overdue', n: overdue, color: A.red   },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid var(--neu-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.color, boxShadow: `0 0 5px ${row.color}` }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--neu-text-muted)' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{row.n}</span>
                </div>
              ))}
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Collected</p>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: A.green, fontFamily: 'Outfit,sans-serif', marginTop: '2px' }}>
                  Rs. {feeCollected.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Department distribution */}
        <Card>
          <Label>Students per Department</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {d.depts.length === 0
              ? <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>No departments yet</p>
              : d.depts.slice(0, 6).map((dep, i) => (
                <HBar key={dep.id}
                  label={dep.code || dep.name?.slice(0, 6)}
                  value={dep.student_count || 0}
                  max={deptMax}
                  color={[A.blue, A.purple, A.green, A.orange, A.red, A.amber][i % 6]}
                />
              ))
            }
          </div>
        </Card>
      </div>

      {/* ── row 3: Leaderboard + At-risk + Announcements ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>

        {/* Top students */}
        <Card>
          <Label>Top Students</Label>
          {d.leaderboard.length === 0
            ? <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)', paddingTop: '0.5rem' }}>No analytics data — calculate first</p>
            : d.leaderboard.slice(0, 5).map((s, i) => (
              <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0', borderBottom: '1px solid var(--neu-border)' }}>
                <span style={{ fontSize: '0.78rem', width: '1.4rem', textAlign: 'center', flexShrink: 0 }}>
                  {['🥇','🥈','🥉','4','5'][i]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.full_name || `#${s.student_id}`}
                  </p>
                  <p style={{ fontSize: '0.67rem', color: 'var(--neu-text-ghost)' }}>{s.roll_number}</p>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: A.blue, fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>
                  {s.academic_score?.toFixed(1)}
                </span>
              </div>
            ))
          }
        </Card>

        {/* At-risk */}
        <Card>
          <Label>At-Risk Students</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
            {[
              { label: 'High', n: highRisk, color: A.red   },
              { label: 'Med',  n: medRisk,  color: A.amber },
            ].map(r => (
              <div key={r.label} style={{ borderRadius: '0.875rem', padding: '0.85rem', textAlign: 'center', background: r.color + '12' }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: r.color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{r.n}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: '4px' }}>{r.label} Risk</p>
              </div>
            ))}
          </div>
          {d.atRisk.slice(0, 4).map(s => (
            <div key={s.student_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--neu-border)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{s.full_name || `#${s.student_id}`}</p>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: '99px',
                background: s.risk_level === 'high' ? A.red + '18' : A.amber + '18',
                color: s.risk_level === 'high' ? A.red : A.amber,
              }}>{s.risk_level}</span>
            </div>
          ))}
        </Card>

        {/* Announcements */}
        <Card>
          <Label>Announcements</Label>
          {d.announcements.length === 0
            ? <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Nothing posted yet</p>
            : d.announcements.slice(0, 4).map(ann => {
              const pc = { urgent: A.red, high: A.orange, normal: A.blue, low: 'var(--neu-text-ghost)' }
              return (
                <div key={ann.id} style={{ padding: '0.55rem 0', borderBottom: '1px solid var(--neu-border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {ann.title}
                    </p>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '99px', flexShrink: 0, background: (pc[ann.priority] || A.blue) + '18', color: pc[ann.priority] || A.blue }}>
                      {ann.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ann.content}
                  </p>
                </div>
              )
            })
          }
        </Card>
      </div>

    </div>
  )
}