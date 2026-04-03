import { useState, useEffect, useRef, useCallback } from 'react'
import { adminAPI } from '../../api/admin.api'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, BookOpen, Shield, AlertTriangle,
  ArrowUpRight, Loader2, Calendar, TrendingUp, TrendingDown,
  Minus, RefreshCw, Trophy, Users, CheckCircle2, Clock,
} from 'lucide-react'

const COLORS = {
  blue:   '#378ADD',
  green:  '#1D9E75',
  red:    '#E24B4A',
  orange: '#BA7517',
  purple: '#7F77DD',
  teal:   '#5DCAA5',
  amber:  '#EF9F27',
  coral:  '#D85A30',
}

/* ── Animated counter hook ───────────────── */
function useCounter(target, duration = 2000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = null
    const tick = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

/* ── Sparkline canvas ────────────────────── */
function Sparkline({ data, color, height = 48 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !data?.length) return
    const W = c.offsetWidth || 240
    c.width = W; c.height = height
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, W, height)
    const mx = Math.max(...data, 1), mn = Math.min(...data)
    const span = mx - mn || 1
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: height - ((v - mn) / span) * (height - 10) - 5 }))
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y)
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke()
    ctx.lineTo(pts[pts.length - 1].x, height); ctx.lineTo(pts[0].x, height); ctx.closePath()
    ctx.fillStyle = color + '28'; ctx.fill()
  }, [data, color, height])
  return <canvas ref={ref} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height, pointerEvents: 'none' }} />
}

/* ── Animated donut (CSS stroke-dashoffset) ── */
function AnimatedDonut({ segments = [], size = 120, label, sublabel }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t) }, [])
  const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r
  const total = segments.reduce((s, g) => s + g.value, 0) || 1
  let offset = 0
  const arcs = segments.map((seg, i) => {
    const dash = (seg.value / total) * circ
    const el = { ...seg, dash, offset, circ }
    offset += dash
    return el
  })
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--neu-surface-deep)" strokeWidth="14" />
      {arcs.map((arc, i) => (
        <circle
          key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={arc.color} strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={animated ? `${Math.max(arc.dash - 2, 0)} ${arc.circ}` : `0 ${arc.circ}`}
          strokeDashoffset={-(arc.offset)}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${cx}px ${cy}px`,
            transition: `stroke-dasharray 1s cubic-bezier(.4,0,.2,1) ${i * 0.12}s`,
          }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: '18px', fontWeight: 800, fill: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{label}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" style={{ fontSize: '9px', fill: 'var(--neu-text-ghost)', fontFamily: "'DM Sans',sans-serif" }}>{sublabel}</text>
    </svg>
  )
}

/* ── Animated progress bar ───────────────── */
function AnimBar({ value, max, color, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(max ? Math.min((value / max) * 100, 100) : 0), delay + 100)
    return () => clearTimeout(t)
  }, [value, max, delay])
  return (
    <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--neu-surface-deep)', overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 99, transition: `width 0.9s cubic-bezier(.4,0,.2,1) ${delay}ms` }} />
    </div>
  )
}

/* ── Score bar for leaderboard ───────────── */
function ScoreBar({ score, color, delay }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(Math.min(score, 100)), delay + 150); return () => clearTimeout(t) }, [score, delay])
  return (
    <div style={{ height: 4, width: '100%', background: 'var(--neu-surface-deep)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 99, transition: `width 0.8s cubic-bezier(.4,0,.2,1) ${delay}ms` }} />
    </div>
  )
}

/* ── Card shell ──────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--neu-surface)',
      boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
      border: '1px solid var(--neu-border)',
      borderRadius: '1.25rem',
      padding: '1.4rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── KPI Card ────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent, spark, onClick }) {
  const [hov, setHov] = useState(false)
  const displayed = useCounter(typeof value === 'number' ? value : 0)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--neu-surface)',
        boxShadow: hov
          ? `10px 10px 26px var(--neu-shadow-dark), -5px -5px 14px var(--neu-shadow-light), 0 0 0 1.5px ${accent}50`
          : `6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)`,
        border: `1px solid ${hov ? accent + '40' : 'var(--neu-border)'}`,
        borderRadius: '1.25rem',
        padding: '1.3rem 1.35rem 3.2rem',
        cursor: onClick ? 'pointer' : 'default',
        transform: hov && onClick ? 'translateY(-4px)' : 'none',
        transition: 'box-shadow 0.22s, border-color 0.22s, transform 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
        <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '0.75rem', background: accent + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        {onClick && <ArrowUpRight size={14} style={{ color: hov ? accent : 'var(--neu-text-ghost)', transition: 'color 0.2s' }} />}
      </div>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</p>
      <p style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--neu-text-primary)', lineHeight: 1, fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em' }}>
        {typeof value === 'number' ? displayed.toLocaleString() : value}
      </p>
      {sub && <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '3px' }}>{sub}</p>}
      {spark && <Sparkline data={spark} color={accent} height={52} />}
    </div>
  )
}

/* ── Trend Icon ──────────────────────────── */
function TrendIcon({ dir }) {
  if (dir === 'improving') return <TrendingUp size={11} style={{ color: COLORS.green }} />
  if (dir === 'declining') return <TrendingDown size={11} style={{ color: COLORS.red }} />
  return <Minus size={11} style={{ color: COLORS.teal }} />
}

/* ── Build synthetic sparkline ───────────── */
function buildSpark(total, growthFactor = 0.35) {
  if (!total) return [0, 0, 0, 0, 0, 0, 0]
  return Array.from({ length: 8 }, (_, i) => {
    const p = i / 7
    const eased = p * p * (3 - 2 * p)
    return Math.round(total * (1 - growthFactor + growthFactor * eased + (Math.random() - 0.5) * 0.03))
  })
}

/* ════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════ */
export default function AdminDashboard() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [d, setD] = useState(null)
  const [refreshed, setRefreshed] = useState(null)

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    try {
      const [s, t, dept, prog, c, off, sem, ann, v, g] = await Promise.all([
        adminAPI.getStudents(1, 1),
        adminAPI.getTeachers(1, 1),
        adminAPI.getDepartments(),
        adminAPI.getPrograms(),
        adminAPI.getCourses(),
        adminAPI.getOfferings(),
        adminAPI.getActiveSemester(),
        adminAPI.getAnnouncements(1, 4),
        adminAPI.getVouchers({ per_page: 200 }),
        adminAPI.getGates(),
      ])

      const semId = sem?.data?.data?.id
      let atRisk = [], lb = []
      if (semId) {
        try {
          const [ar, l] = await Promise.all([
            adminAPI.getAtRiskStudents(semId),
            adminAPI.getLeaderboard(semId, 8),
          ])
          atRisk = ar?.data?.data?.students || []
          lb = l?.data?.data?.leaderboard || []
        } catch {}
      }

      const stu = s?.data?.data?.pagination?.total || 0
      const tea = t?.data?.data?.pagination?.total || 0
      const depts = dept?.data?.data?.departments || []
      const vouchers = v?.data?.data?.vouchers || []
      const gates = g?.data?.data?.gates || []
      const offerings = off?.data?.data?.offerings || []

      const feePaid    = vouchers.filter(x => x.status === 'paid').length
      const feeUnpaid  = vouchers.filter(x => x.status === 'unpaid').length
      const feePartial = vouchers.filter(x => x.status === 'partial').length
      const feeOverdue = vouchers.filter(x => x.status === 'overdue').length
      const feeAmt = vouchers.filter(x => x.status === 'paid').reduce((s, v) => s + parseFloat(v.amount || 0), 0)

      setD({
        stu, tea,
        programs: prog?.data?.data?.programs?.length || 0,
        courses: c?.data?.data?.courses?.length || 0,
        offerings: offerings.length,
        activeSem: sem?.data?.data,
        announcements: ann?.data?.data?.announcements || [],
        feePaid, feeUnpaid, feePartial, feeOverdue, feeAmt,
        vouchers,
        gates, activeGates: gates.filter(g => g.is_active).length,
        depts,
        atRisk,
        highRisk: atRisk.filter(s => s.risk_level === 'high').length,
        medRisk:  atRisk.filter(s => s.risk_level === 'medium').length,
        lb,
        avgScore: lb.length ? lb.reduce((s, x) => s + (x.academic_score || 0), 0) / lb.length : 0,
        sparkStu: buildSpark(stu),
        sparkOff: buildSpark(offerings, 0.28),
        sparkGate: buildSpark(gates.filter(g => g.is_active).length, 0.1),
        sparkRisk: buildSpark(atRisk.filter(s => s.risk_level === 'high').length + atRisk.filter(s => s.risk_level === 'medium').length, 0.4),
      })
      setRefreshed(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '0.75rem' }}>
      <Loader2 size={26} style={{ color: 'var(--neu-accent)', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Loading dashboard…</p>
    </div>
  )

  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })
  const deptMax = Math.max(...(d.depts.map(x => x.student_count || 0)), 1)
  const DEPT_COLORS = [COLORS.blue, COLORS.purple, COLORS.green, COLORS.orange, COLORS.teal, COLORS.coral]

  /* Risk level config */
  const RISK_CFG = {
    high:   { bg: 'rgba(226,75,74,.1)',  c: '#A32D2D', label: 'HIGH'   },
    medium: { bg: 'rgba(186,117,23,.1)', c: '#633806', label: 'MED'    },
    low:    { bg: 'rgba(29,158,117,.1)', c: '#085041', label: 'LOW'    },
  }

  /* Engagement badge */
  const ENG_CFG = {
    high:   { bg: 'rgba(29,158,117,.12)',  c: '#085041' },
    medium: { bg: 'rgba(55,138,221,.12)',  c: '#0C447C' },
    low:    { bg: 'rgba(226,75,74,.12)',   c: '#791F1F' },
  }

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', paddingBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

      {/* ─── HEADER ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={12} style={{ flexShrink: 0 }} />
            {today}
            {d.activeSem && (
              <span style={{ padding: '0.1rem 0.55rem', background: COLORS.blue + '18', color: COLORS.blue, borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700 }}>
                {d.activeSem.name}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--neu-surface)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '0.75rem', cursor: refreshing ? 'not-allowed' : 'pointer', color: 'var(--neu-text-secondary)', fontSize: '0.78rem', fontWeight: 600, opacity: refreshing ? 0.7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ─── 4 KPI CARDS ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '0.9rem' }}>
        <KpiCard
          icon={GraduationCap} label="Total Students" value={d.stu}
          sub={`${d.programs} programs enrolled`} accent={COLORS.blue}
          spark={d.sparkStu} onClick={() => nav('/admin/students')}
        />
        <KpiCard
          icon={BookOpen} label="Course Offerings" value={d.offerings}
          sub={`${d.courses} total courses`} accent={COLORS.green}
          spark={d.sparkOff} onClick={() => nav('/admin/offerings')}
        />
        <KpiCard
          icon={Shield} label="Active Gates"
          value={`${d.activeGates}/${d.gates.length}`}
          sub="Campus security" accent={COLORS.orange}
          spark={d.sparkGate} onClick={() => nav('/admin/gates')}
        />
        <KpiCard
          icon={AlertTriangle} label="At-Risk Students"
          value={d.highRisk + d.medRisk}
          sub={`${d.highRisk} high · ${d.medRisk} medium`}
          accent={COLORS.red}
          spark={d.sparkRisk} onClick={() => nav('/admin/analytics')}
        />
      </div>

      {/* ─── ROW 2: Fee Donut + Dept bars ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Fee Status */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fee collection status</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>{d.vouchers.length} vouchers</span>
          </div>
          {d.vouchers.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)', textAlign: 'center', padding: '1.5rem 0' }}>No vouchers generated yet</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <AnimatedDonut
                segments={[
                  { value: d.feePaid,    color: COLORS.green  },
                  { value: d.feeUnpaid,  color: COLORS.red    },
                  { value: d.feePartial, color: COLORS.blue   },
                  { value: d.feeOverdue, color: COLORS.orange },
                ].filter(s => s.value > 0)}
                size={130}
                label={`${Math.round(d.feePaid / (d.vouchers.length || 1) * 100)}%`}
                sublabel="collected"
              />
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Paid',    n: d.feePaid,    c: COLORS.green  },
                  { label: 'Unpaid',  n: d.feeUnpaid,  c: COLORS.red    },
                  { label: 'Partial', n: d.feePartial, c: COLORS.blue   },
                  { label: 'Overdue', n: d.feeOverdue, c: COLORS.orange },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.42rem 0', borderBottom: '1px solid var(--neu-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: row.c, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-muted)' }}>{row.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{row.n}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '0.7rem', padding: '0.55rem 0.75rem', background: COLORS.green + '12', borderRadius: '0.65rem', border: `1px solid ${COLORS.green}30` }}>
                  <p style={{ fontSize: '0.65rem', color: '#085041', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>Total collected</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#085041', fontFamily: 'Outfit,sans-serif' }}>Rs. {Math.round(d.feeAmt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Dept distribution */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students per department</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>{d.depts.length} depts</span>
          </div>
          {d.depts.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)', textAlign: 'center', padding: '1.5rem 0' }}>No departments configured</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {d.depts.slice(0, 7).map((dep, i) => {
                const count = dep.student_count || 0
                const color = DEPT_COLORS[i % DEPT_COLORS.length]
                return (
                  <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ width: '5.2rem', fontSize: '0.72rem', color: 'var(--neu-text-muted)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dep.code || dep.name?.slice(0, 9)}
                    </span>
                    <AnimBar value={count} max={deptMax} color={color} delay={i * 60} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-secondary)', minWidth: '24px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', minWidth: '28px', textAlign: 'right', flexShrink: 0 }}>
                      {d.stu ? Math.round(count / d.stu * 100) + '%' : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>

      {/* ─── ROW 3: Top Students + At-Risk ───────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Top Students */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '0.6rem', background: COLORS.amber + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 7px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' }}>
                <Trophy size={14} style={{ color: COLORS.amber }} />
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Top students</p>
            </div>
            {d.activeSem && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem', background: COLORS.blue + '15', color: '#0C447C', borderRadius: '0.4rem' }}>
                {d.activeSem.name}
              </span>
            )}
          </div>
          {d.lb.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Trophy size={28} style={{ color: 'var(--neu-text-ghost)', opacity: 0.2, margin: '0 auto 0.5rem', display: 'block' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>No data — recalculate analytics first</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {d.lb.slice(0, 7).map((s, i) => {
                const medals = ['🥇', '🥈', '🥉']
                const eng = ENG_CFG[s.engagement_level] || ENG_CFG.medium
                const scoreColor = s.academic_score >= 75 ? COLORS.green : s.academic_score >= 50 ? COLORS.blue : COLORS.red
                return (
                  <div key={s.student_id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '0.6rem', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid var(--neu-border)' }}>
                    {/* Rank */}
                    <span style={{ fontSize: i < 3 ? '1rem' : '0.75rem', textAlign: 'center', fontWeight: 800, color: 'var(--neu-text-ghost)', fontFamily: 'Outfit,sans-serif' }}>
                      {i < 3 ? medals[i] : `#${i + 1}`}
                    </span>
                    {/* Info + score bar */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.full_name || `Student #${s.student_id}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{s.roll_number}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '0.35rem', background: eng.bg, color: eng.c, flexShrink: 0 }}>
                          {s.engagement_level}
                        </span>
                      </div>
                      <ScoreBar score={s.academic_score || 0} color={scoreColor} delay={i * 70} />
                    </div>
                    {/* Score + trend */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: scoreColor, fontFamily: 'Outfit,sans-serif', display: 'block', lineHeight: 1 }}>
                        {parseFloat(s.academic_score || 0).toFixed(1)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', marginTop: '2px' }}>
                        <TrendIcon dir={s.trend_direction} />
                        <span style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', textTransform: 'capitalize' }}>{s.trend_direction?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* At-Risk Students */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '0.6rem', background: COLORS.red + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 7px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' }}>
                <AlertTriangle size={14} style={{ color: COLORS.red }} />
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>At-risk students</p>
            </div>
            <button onClick={() => nav('/admin/analytics')} style={{ fontSize: '0.68rem', fontWeight: 700, color: COLORS.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              View all →
            </button>
          </div>

          {/* Summary pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', marginBottom: '0.85rem' }}>
            {[
              { label: 'High risk', n: d.highRisk, color: COLORS.red, bg: 'rgba(226,75,74,.08)', border: 'rgba(226,75,74,.25)', textC: '#791F1F' },
              { label: 'Medium risk', n: d.medRisk, color: COLORS.orange, bg: 'rgba(186,117,23,.08)', border: 'rgba(186,117,23,.25)', textC: '#633806' },
            ].map(r => (
              <div key={r.label} style={{ padding: '0.7rem 0.9rem', borderRadius: '0.875rem', background: r.bg, border: `1px solid ${r.border}`, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                <div>
                  <p style={{ fontSize: '1.35rem', fontWeight: 800, color: r.textC, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{r.n}</p>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, color: r.textC, marginTop: '1px' }}>{r.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Risk list */}
          {d.atRisk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={26} style={{ color: COLORS.green, margin: '0 auto 0.5rem', display: 'block' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-secondary)', fontWeight: 600 }}>All students on track</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {d.atRisk.slice(0, 6).map((s, i) => {
                const rc = RISK_CFG[s.risk_level] || RISK_CFG.low
                return (
                  <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.52rem 0', borderBottom: '1px solid var(--neu-border)', gap: '0.6rem' }}>
                    {/* Avatar initial */}
                    <div style={{ width: 30, height: 30, borderRadius: '0.6rem', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.78rem', color: rc.c, fontFamily: 'Outfit,sans-serif' }}>
                      {s.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{s.roll_number}</span>
                        {s.risk_factors?.length > 0 && (
                          <span style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                            · {s.risk_factors[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.18rem 0.5rem', borderRadius: '99px', background: rc.bg, color: rc.c, display: 'block', marginBottom: '2px' }}>
                        {rc.label}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: rc.c, fontFamily: 'Outfit,sans-serif' }}>
                        {parseFloat(s.academic_score || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>

      {/* ─── ROW 4: Gate status strip ──────────── */}
      {d.gates.length > 0 && (
        <Card style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Campus gate status
            </p>
            <button onClick={() => nav('/admin/gates')} style={{ fontSize: '0.68rem', fontWeight: 700, color: COLORS.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              Manage →
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {d.gates.map(g => {
              const online = g.last_ping && Date.now() - new Date(g.last_ping).getTime() < 5 * 60000
              const tc = { main: COLORS.blue, department: COLORS.purple, lab: COLORS.green, library: COLORS.amber, hostel: COLORS.orange }
              const color = tc[g.gate_type] || COLORS.blue
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem', background: 'var(--neu-surface-deep)', borderRadius: '0.875rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', border: `1px solid ${g.is_active ? color + '28' : 'var(--neu-border)'}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: online ? COLORS.green : 'var(--neu-text-ghost)', boxShadow: online ? `0 0 6px ${COLORS.green}` : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: g.is_active ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)' }}>{g.gate_name}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.38rem', borderRadius: '0.35rem', background: color + '18', color, textTransform: 'capitalize' }}>{g.gate_type}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)' }}>{g.total_cameras || 0}cam</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ─── Refresh timestamp ─────────────────── */}
      {refreshed && (
        <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', textAlign: 'right' }}>
          Updated: {refreshed.toLocaleTimeString()}
        </p>
      )}

    </div>
  )
}