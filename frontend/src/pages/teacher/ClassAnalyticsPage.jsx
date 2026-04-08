import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Users, AlertTriangle, Trophy, TrendingUp,
  TrendingDown, Minus, Loader2, RefreshCw, ChevronDown,
  ChevronUp, Award, ClipboardCheck, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import toast from 'react-hot-toast'
import teacherAPI from '../../api/teacher.api'

/* ─── Helpers ─────────────────────────────────────── */
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
const iS = {
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.75rem',
  padding: '0.55rem 0.9rem',
  fontSize: '0.82rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans',sans-serif",
  cursor: 'pointer',
}

const RISK_CFG = {
  high:   { c: '#ef4444', bg: 'rgba(239,68,68,.1)',  label: 'HIGH'   },
  medium: { c: '#f97316', bg: 'rgba(249,115,22,.1)', label: 'MEDIUM' },
  low:    { c: '#22a06b', bg: 'rgba(34,160,107,.1)', label: 'LOW'    },
}
const TREND_CFG = {
  improving: { Icon: TrendingUp,   c: '#22a06b' },
  stable:    { Icon: Minus,        c: '#5b8af0' },
  declining: { Icon: TrendingDown, c: '#ef4444' },
}
const ENG_CFG = {
  high:   { c: '#22a06b', bg: 'rgba(34,160,107,.1)'  },
  medium: { c: '#5b8af0', bg: 'rgba(91,138,240,.1)'  },
  low:    { c: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
}
const BAR_COLORS = ['#5b8af0','#3ecf8e','#f97316','#8b5cf6','#ec4899','#f59e0b']

/* ─── Score bar ───────────────────────────────────── */
function ScoreBar({ value = 0, color = '#5b8af0' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
      <div style={{ flex:1, height:5, background:'var(--neu-surface-deep)', borderRadius:99, overflow:'hidden', boxShadow:'inset 2px 2px 4px var(--neu-shadow-dark)' }}>
        <div style={{ height:'100%', width:`${Math.min(value,100)}%`, background:color, borderRadius:99, transition:'width .5s ease' }} />
      </div>
      <span style={{ fontSize:'.75rem', fontWeight:800, color, fontFamily:'Outfit,sans-serif', minWidth:30, textAlign:'right' }}>
        {value?.toFixed(1)}
      </span>
    </div>
  )
}

/* ─── Student Detail Modal ────────────────────────── */
function StudentModal({ s, semesterId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!s?.student_id || !semesterId) return
    teacherAPI.getStudentAnalytics(s.student_id, semesterId)
      .then(r => setDetail(r.data.data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [s, semesterId])

  const rc = RISK_CFG[s.risk_level] || RISK_CFG.low
  const tc = TREND_CFG[s.trend_direction] || TREND_CFG.stable

  const radarData = detail?.score_breakdown ? [
    { subject: 'Attend',  A: detail.score_breakdown.lecture_attendance    || 0 },
    { subject: 'Campus',  A: detail.score_breakdown.campus_presence       || 0 },
    { subject: 'Assign',  A: detail.score_breakdown.assignment_consistency || 0 },
    { subject: 'Quiz',    A: detail.score_breakdown.quiz_accuracy          || 0 },
    { subject: 'GPA',     A: detail.score_breakdown.gpa_factor            || 0 },
  ] : []

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(8,12,20,.72)', backdropFilter:'blur(10px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:460, ...neu({ borderRadius:'1.5rem', padding:0, overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }), animation:'slideUp .2s cubic-bezier(.34,1.56,.64,1) both' }}>

        {/* Header */}
        <div style={{ padding:'1.2rem 1.4rem', borderBottom:'1px solid var(--neu-border)', display:'flex', alignItems:'center', gap:'0.85rem' }}>
          <div style={{ width:44, height:44, borderRadius:'0.9rem', background:'rgba(91,138,240,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1rem', color:'#5b8af0', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>
            {s.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif' }}>{s.full_name}</p>
            <p style={{ fontSize:'0.7rem', color:'var(--neu-text-ghost)', fontFamily:'monospace' }}>{s.roll_number}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--neu-text-ghost)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'1.1rem 1.4rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>

          {/* Top tiles */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
            {[
              { label:'Score',      value: s.academic_score?.toFixed(1) || '—', c:'#5b8af0' },
              { label:'Class Rank', value: s.rank ? `#${s.rank}` : '—',         c:'#f59e0b' },
              { label:'Risk',       value: rc.label,                             c: rc.c     },
            ].map(t => (
              <div key={t.label} style={{ ...neuInset({ borderRadius:'0.875rem', padding:'0.7rem', textAlign:'center' }) }}>
                <p style={{ fontSize:'0.6rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'0.2rem' }}>{t.label}</p>
                <p style={{ fontSize:'1.1rem', fontWeight:800, color:t.c, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>{t.value}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'.65rem', fontWeight:700, padding:'.2rem .6rem', background:ENG_CFG[s.engagement_level]?.bg || ENG_CFG.medium.bg, color:ENG_CFG[s.engagement_level]?.c || ENG_CFG.medium.c, borderRadius:'.45rem', textTransform:'capitalize' }}>
              {s.engagement_level} engagement
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'.25rem', fontSize:'.65rem', fontWeight:700, padding:'.2rem .6rem', background:'var(--neu-surface-deep)', color:tc.c, border:'1px solid var(--neu-border)', borderRadius:'.45rem' }}>
              <tc.Icon size={11} />{s.trend_direction}
            </span>
          </div>

          {/* Score bar */}
          <div style={{ ...neuInset({ borderRadius:'0.875rem', padding:'0.85rem 1rem' }) }}>
            <p style={{ fontSize:'.62rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.5rem' }}>Academic Score</p>
            <ScoreBar value={s.academic_score} color='#5b8af0' />
          </div>

          {/* Radar — from detailed fetch */}
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'1rem' }}>
              <Loader2 size={20} style={{ color:'#5b8af0', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : radarData.length > 0 ? (
            <div style={{ ...neuInset({ borderRadius:'0.875rem', padding:'0.85rem 1rem' }) }}>
              <p style={{ fontSize:'.62rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.5rem' }}>Score Breakdown</p>
              <ResponsiveContainer width="100%" height={170}>
                <RadarChart data={radarData} margin={{ top:5, right:20, bottom:5, left:20 }}>
                  <PolarGrid stroke="var(--neu-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--neu-text-ghost)', fontSize:10 }} />
                  <Radar dataKey="A" stroke="#5b8af0" fill="#5b8af0" fillOpacity={0.18} strokeWidth={2} dot={{ fill:'#5b8af0', r:3 }} />
                  <Tooltip contentStyle={{ background:'var(--neu-surface)', border:'1px solid var(--neu-border)', borderRadius:'0.6rem', fontSize:'0.72rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {/* Risk factors */}
          {s.risk_factors?.length > 0 && (
            <div style={{ ...neuInset({ borderRadius:'0.875rem', padding:'0.85rem 1rem' }) }}>
              <p style={{ fontSize:'.62rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.5rem' }}>Risk Factors</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem' }}>
                {s.risk_factors.map((f, i) => (
                  <span key={i} style={{ fontSize:'.7rem', fontWeight:600, padding:'.25rem .6rem', background:'rgba(249,115,22,.1)', color:'#f97316', borderRadius:'.45rem' }}>⚠ {f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'0.85rem 1.4rem', borderTop:'1px solid var(--neu-border)' }}>
          <button onClick={onClose} style={{ ...neuInset({ borderRadius:'0.75rem', padding:'0.6rem', width:'100%', cursor:'pointer', border:'none', fontWeight:600, color:'var(--neu-text-secondary)', fontSize:'0.82rem', fontFamily:"'DM Sans',sans-serif" }) }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function ClassAnalyticsPage() {
  const [offerings,    setOfferings]    = useState([])
  const [semesters,    setSemesters]    = useState([])
  const [activeSemId,  setActiveSemId]  = useState(null)
  const [selOffering,  setSelOffering]  = useState(null)
  const [leaderboard,  setLeaderboard]  = useState([])
  const [atRisk,       setAtRisk]       = useState([])
  const [attnReport,   setAttnReport]   = useState([])
  const [loading,      setLoading]      = useState(false)
  const [calcLoading,  setCalcLoading]  = useState(false)
  const [viewStudent,  setViewStudent]  = useState(null)
  const [tab,          setTab]          = useState('overview')
  const [sortAsc,      setSortAsc]      = useState(false)

  /* ── Load semesters + my offerings ─────────────── */
  useEffect(() => {
    Promise.all([
      teacherAPI.getSemesters(),
      teacherAPI.getMyOfferings(),
    ]).then(([semRes, offRes]) => {
      const sems = semRes.data.data?.semesters || []
      const offs = offRes.data.data?.offerings || []
      setSemesters(sems)
      setOfferings(offs)
      const active = sems.find(s => s.is_active)
      if (active) setActiveSemId(active.id)
    }).catch(() => toast.error('Failed to load data'))
  }, [])

  /* ── Fetch analytics when semester changes ──────── */
  const fetchAnalytics = useCallback(async () => {
    if (!activeSemId) return
    setLoading(true)
    try {
      const [lbRes, arRes] = await Promise.all([
        teacherAPI.getClassLeaderboard(activeSemId, 50),
        teacherAPI.getAtRiskStudents(activeSemId),
      ])
      setLeaderboard(lbRes.data.data?.leaderboard || [])
      setAtRisk(arRes.data.data?.students || [])
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [activeSemId])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  /* ── Fetch attendance report when offering selected */
  useEffect(() => {
    if (!selOffering) return
    teacherAPI.getAttendanceReport(selOffering)
      .then(r => setAttnReport(r.data.data?.report || []))
      .catch(() => setAttnReport([]))
  }, [selOffering])

  /* ── Recalculate for all students in my courses ─── */
  const handleRecalculate = async () => {
    if (!activeSemId) return
    setCalcLoading(true)

    // Get unique student IDs from leaderboard
    const studentIds = leaderboard.map(s => s.student_id)

    // Also get from attendance report if offering selected
    const extraIds = attnReport.map(r => r.student_id)
    const allIds = [...new Set([...studentIds, ...extraIds])]

    if (allIds.length === 0) {
      toast.error('No students found to calculate')
      setCalcLoading(false)
      return
    }

    let done = 0
    for (const sid of allIds) {
      try {
        await teacherAPI.calculateStudentAnalytics(sid, activeSemId)
        done++
      } catch (_) {}
    }
    toast.success(`Recalculated ${done}/${allIds.length} students`)
    setCalcLoading(false)
    fetchAnalytics()
  }

  /* ── Derived stats ──────────────────────────────── */
  const highRisk   = atRisk.filter(s => s.risk_level === 'high').length
  const medRisk    = atRisk.filter(s => s.risk_level === 'medium').length
  const avgScore   = leaderboard.length
    ? (leaderboard.reduce((s, x) => s + (x.academic_score || 0), 0) / leaderboard.length).toFixed(1)
    : '—'
  const topScore   = leaderboard[0]?.academic_score?.toFixed(1) || '—'

  /* ── Score distribution data for bar chart ──────── */
  const distBuckets = [
    { range:'0-20',  count:0 }, { range:'21-40', count:0 },
    { range:'41-60', count:0 }, { range:'61-80', count:0 },
    { range:'81-100',count:0 },
  ]
  leaderboard.forEach(s => {
    const sc = s.academic_score || 0
    if (sc <= 20)      distBuckets[0].count++
    else if (sc <= 40) distBuckets[1].count++
    else if (sc <= 60) distBuckets[2].count++
    else if (sc <= 80) distBuckets[3].count++
    else               distBuckets[4].count++
  })

  /* ── Engagement breakdown for bar chart ─────────── */
  const engData = [
    { name:'High',   value: leaderboard.filter(s => s.engagement_level === 'high').length,   color:'#22a06b' },
    { name:'Medium', value: leaderboard.filter(s => s.engagement_level === 'medium').length, color:'#5b8af0' },
    { name:'Low',    value: leaderboard.filter(s => s.engagement_level === 'low').length,    color:'#ef4444' },
  ]

  /* ── Sorted leaderboard ─────────────────────────── */
  const sortedLb = [...leaderboard].sort((a, b) =>
    sortAsc
      ? (a.academic_score || 0) - (b.academic_score || 0)
      : (b.academic_score || 0) - (a.academic_score || 0)
  )

  /* ── My offerings for this semester ─────────────── */
  const myOfferingsThisSem = offerings.filter(o =>
    !activeSemId || o.semester_id === activeSemId
  )

  return (
    <div style={{ maxWidth:1080, margin:'0 auto', display:'flex', flexDirection:'column', gap:'1.1rem', paddingBottom:'2rem' }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .an-row { padding:.6rem .9rem; borderRadius:.85rem; border:1px solid transparent; cursor:pointer; transition:background .14s, border-color .14s, transform .15s; display:grid; align-items:center; gap:.5rem; }
        .an-row:hover { background:var(--neu-surface-deep); border-color:var(--neu-border); transform:translateX(3px); }
        .neu-tab2 { display:flex; align-items:center; gap:.4rem; padding:.45rem 1rem; border-radius:.7rem; border:none; font-size:.78rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; }
      `}</style>

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.7rem' }}>
          <div style={{ ...neuInset({ width:42, height:42, borderRadius:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center' }) }}>
            <BarChart3 size={20} style={{ color:'#5b8af0' }} />
          </div>
          <div>
            <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif', letterSpacing:'-.02em' }}>Class Analytics</h1>
            <p style={{ fontSize:'0.75rem', color:'var(--neu-text-ghost)' }}>Student performance overview</p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
          <select value={activeSemId || ''} onChange={e => setActiveSemId(parseInt(e.target.value))} style={iS}>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>
            ))}
          </select>
          <button
            onClick={handleRecalculate}
            disabled={calcLoading || !activeSemId}
            style={{ display:'flex', alignItems:'center', gap:'.45rem', padding:'.5rem 1rem', background:'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow:'0 4px 14px rgba(91,138,240,.35)', borderRadius:'.75rem', border:'none', color:'#fff', fontWeight:700, fontSize:'.78rem', cursor:calcLoading ? 'not-allowed' : 'pointer', opacity:calcLoading ? .7 : 1, fontFamily:"'DM Sans',sans-serif" }}
          >
            {calcLoading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
            Recalculate
          </button>
        </div>
      </div>

      {/* ── KPI tiles ───────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'.75rem' }}>
        {[
          { label:'Total Students', value:leaderboard.length, c:'#5b8af0', bg:'rgba(91,138,240,.1)',  Icon:Users          },
          { label:'Avg Score',      value:avgScore,           c:'#22a06b', bg:'rgba(34,160,107,.1)', Icon:BarChart3       },
          { label:'Top Score',      value:topScore,           c:'#f59e0b', bg:'rgba(245,158,11,.1)', Icon:Trophy         },
          { label:'At Risk',        value:highRisk + medRisk, c:'#ef4444', bg:'rgba(239,68,68,.1)',  Icon:AlertTriangle  },
        ].map(t => (
          <div key={t.label} style={{ ...neu({ padding:'.9rem 1.1rem', display:'flex', alignItems:'center', gap:'.75rem' }) }}>
            <div style={{ width:38, height:38, borderRadius:'.75rem', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <t.Icon size={17} style={{ color:t.c }} />
            </div>
            <div>
              <p style={{ fontSize:'.65rem', color:'var(--neu-text-ghost)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' }}>{t.label}</p>
              <p style={{ fontSize:'1.4rem', fontWeight:800, color:t.c, fontFamily:'Outfit,sans-serif', lineHeight:1.1 }}>{t.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'.45rem', padding:'.35rem', background:'var(--neu-surface-deep)', borderRadius:'0.9rem', width:'fit-content', boxShadow:'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 6px var(--neu-shadow-light)' }}>
        {[
          { key:'overview',   label:'Overview',      Icon:BarChart3      },
          { key:'students',   label:'All Students',  Icon:Users          },
          { key:'at-risk',    label:'At Risk',       Icon:AlertTriangle  },
          { key:'attendance', label:'Attendance',    Icon:ClipboardCheck },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="neu-tab2"
            style={tab === t.key ? {
              background:'linear-gradient(145deg,#5b8af0,#3a6bd4)',
              color:'#fff', boxShadow:'0 4px 14px rgba(91,138,240,.35)',
            } : {
              background:'none', color:'var(--neu-text-muted)',
            }}
          >
            <t.Icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB CONTENT ═══════════════════════════════ */}
      {loading ? (
        <div style={{ ...neu({ padding:'5rem', textAlign:'center' }) }}>
          <Loader2 size={28} style={{ color:'#5b8af0', animation:'spin 1s linear infinite', display:'block', margin:'0 auto .85rem' }} />
          <p style={{ fontSize:'.82rem', color:'var(--neu-text-muted)' }}>Loading analytics…</p>
        </div>
      ) : (

        /* ─── OVERVIEW TAB ─────────────────────────── */
        tab === 'overview' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Charts row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

              {/* Score distribution */}
              <div style={{ ...neu({ padding:'1.25rem' }) }}>
                <p style={{ fontSize:'.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'.85rem' }}>Score Distribution</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distBuckets} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill:'var(--neu-text-ghost)', fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--neu-text-ghost)', fontSize:10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:'var(--neu-surface)', border:'1px solid var(--neu-border)', borderRadius:'.6rem', fontSize:'.72rem' }} />
                    <Bar dataKey="count" name="Students" radius={[4,4,0,0]}>
                      {distBuckets.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Engagement breakdown */}
              <div style={{ ...neu({ padding:'1.25rem' }) }}>
                <p style={{ fontSize:'.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'.85rem' }}>Engagement Levels</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={engData} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill:'var(--neu-text-ghost)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--neu-text-ghost)', fontSize:10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background:'var(--neu-surface)', border:'1px solid var(--neu-border)', borderRadius:'.6rem', fontSize:'.72rem' }} />
                    <Bar dataKey="value" name="Students" radius={[4,4,0,0]}>
                      {engData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick risk summary */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.75rem' }}>
              {[
                { label:'High Risk', n:highRisk, ...RISK_CFG.high   },
                { label:'Medium Risk', n:medRisk, ...RISK_CFG.medium },
                { label:'Low / Safe', n:leaderboard.length - highRisk - medRisk, ...RISK_CFG.low },
              ].map(r => (
                <div key={r.label} style={{ ...neuInset({ borderRadius:'1rem', padding:'0.9rem 1.1rem', display:'flex', alignItems:'center', gap:'.75rem' }) }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:r.c, boxShadow:`0 0 8px ${r.c}`, flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:'.65rem', color:'var(--neu-text-ghost)', fontWeight:700 }}>{r.label}</p>
                    <p style={{ fontSize:'1.3rem', fontWeight:800, color:r.c, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>{r.n}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        /* ─── ALL STUDENTS TAB ──────────────────────── */
        ) : tab === 'students' ? (
          <div style={{ ...neu({ overflow:'hidden' }) }}>
            {/* Table header */}
            <div style={{ padding:'.55rem .9rem', borderBottom:'1px solid var(--neu-border)', background:'var(--neu-surface-deep)', display:'grid', gridTemplateColumns:'44px 2fr 160px 100px 80px', gap:'.5rem', alignItems:'center' }}>
              {['Rank', 'Student', 'Score', 'Engagement', 'Trend'].map((h, i) => (
                <span key={h} style={{ fontSize:'.6rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.06em', display:'flex', alignItems:'center', gap:'.25rem', cursor: i === 2 ? 'pointer' : 'default' }}
                  onClick={i === 2 ? () => setSortAsc(p => !p) : undefined}
                >
                  {h} {i === 2 && (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                </span>
              ))}
            </div>

            <div style={{ padding:'.45rem .5rem', display:'flex', flexDirection:'column', gap:'.1rem', maxHeight:500, overflowY:'auto' }}>
              {sortedLb.length === 0 ? (
                <div style={{ padding:'3rem', textAlign:'center', color:'var(--neu-text-ghost)' }}>
                  <p>No data — click Recalculate first</p>
                </div>
              ) : sortedLb.map((s, idx) => {
                const tc = TREND_CFG[s.trend_direction] || TREND_CFG.stable
                const ec = ENG_CFG[s.engagement_level]  || ENG_CFG.medium
                return (
                  <div key={s.student_id} className="an-row"
                    style={{ gridTemplateColumns:'44px 2fr 160px 100px 80px' }}
                    onClick={() => setViewStudent(s)}
                  >
                    <span style={{ fontSize:'.8rem', fontWeight:800, color:'var(--neu-text-ghost)', fontFamily:'Outfit,sans-serif', textAlign:'center' }}>
                      #{s.rank || idx + 1}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:'.55rem', minWidth:0 }}>
                      <div style={{ width:28, height:28, borderRadius:'.55rem', background:'rgba(91,138,240,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:800, fontSize:'.75rem', color:'#5b8af0', fontFamily:'Outfit,sans-serif' }}>
                        {s.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:'.82rem', fontWeight:600, color:'var(--neu-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.full_name}</p>
                        <p style={{ fontSize:'.63rem', color:'var(--neu-text-ghost)', fontFamily:'monospace' }}>{s.roll_number}</p>
                      </div>
                    </div>
                    <ScoreBar value={s.academic_score} color='#5b8af0' />
                    <span style={{ fontSize:'.63rem', fontWeight:800, padding:'.18rem .5rem', background:ec.bg, color:ec.c, borderRadius:'.4rem', textTransform:'capitalize', display:'inline-block' }}>
                      {s.engagement_level}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:'.3rem' }}>
                      <tc.Icon size={12} style={{ color:tc.c, flexShrink:0 }} />
                      <span style={{ fontSize:'.68rem', fontWeight:600, color:tc.c }}>{s.trend_direction}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        /* ─── AT RISK TAB ───────────────────────────── */
        ) : tab === 'at-risk' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'.7rem' }}>
            {atRisk.length === 0 ? (
              <div style={{ ...neu({ padding:'5rem', textAlign:'center' }) }}>
                <Award size={32} style={{ color:'#22a06b', margin:'0 auto .75rem', display:'block' }} />
                <p style={{ fontWeight:700, color:'var(--neu-text-primary)' }}>All students on track!</p>
              </div>
            ) : atRisk.map(s => {
              const rc = RISK_CFG[s.risk_level] || RISK_CFG.low
              const tc = TREND_CFG[s.trend_direction] || TREND_CFG.stable
              return (
                <div key={s.student_id} onClick={() => setViewStudent(s)}
                  style={{ ...neu({ padding:'1rem 1.2rem', cursor:'pointer', borderLeft:`3px solid ${rc.c}`, transition:'transform .18s' }),
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'.85rem' }}>
                    <div style={{ width:42, height:42, borderRadius:'.85rem', background:rc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:800, fontSize:'1rem', color:rc.c, fontFamily:'Outfit,sans-serif' }}>
                      {s.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.45rem', marginBottom:'.25rem', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'.88rem', fontWeight:700, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif' }}>{s.full_name}</span>
                        <span style={{ fontSize:'.62rem', color:'var(--neu-text-ghost)', fontFamily:'monospace' }}>{s.roll_number}</span>
                        <span style={{ fontSize:'.62rem', fontWeight:800, padding:'.15rem .5rem', background:rc.bg, color:rc.c, borderRadius:'.4rem' }}>● {rc.label}</span>
                      </div>
                      <ScoreBar value={s.academic_score} color={rc.c} />
                      {s.risk_factors?.length > 0 && (
                        <div style={{ marginTop:'.45rem', display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
                          {s.risk_factors.map((f, i) => (
                            <span key={i} style={{ fontSize:'.63rem', fontWeight:600, padding:'.15rem .5rem', background:rc.bg, color:rc.c, borderRadius:'.4rem' }}>⚠ {f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <p style={{ fontSize:'1.5rem', fontWeight:800, color:rc.c, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>{s.academic_score?.toFixed(0)}</p>
                      <p style={{ fontSize:'.6rem', color:'var(--neu-text-ghost)' }}>/100</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'.2rem', marginTop:'.2rem' }}>
                        <tc.Icon size={11} style={{ color:tc.c }} />
                        <span style={{ fontSize:'.62rem', color:tc.c, fontWeight:600 }}>{s.trend_direction}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        /* ─── ATTENDANCE TAB ────────────────────────── */
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
              <span style={{ fontSize:'.8rem', fontWeight:600, color:'var(--neu-text-secondary)' }}>Select Offering:</span>
              <select
                value={selOffering || ''}
                onChange={e => setSelOffering(parseInt(e.target.value))}
                style={iS}
              >
                <option value="">— Choose course —</option>
                {myOfferingsThisSem.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.course_name} — {o.section}
                  </option>
                ))}
              </select>
            </div>

            {!selOffering ? (
              <div style={{ ...neu({ padding:'4rem', textAlign:'center' }) }}>
                <ClipboardCheck size={32} style={{ color:'var(--neu-text-ghost)', opacity:.2, margin:'0 auto .75rem', display:'block' }} />
                <p style={{ color:'var(--neu-text-ghost)', fontSize:'.85rem' }}>Select a course to view attendance report</p>
              </div>
            ) : attnReport.length === 0 ? (
              <div style={{ ...neu({ padding:'4rem', textAlign:'center' }) }}>
                <p style={{ color:'var(--neu-text-ghost)', fontSize:'.85rem' }}>No attendance data for this course</p>
              </div>
            ) : (
              <div style={{ ...neu({ overflow:'hidden' }) }}>
                <div style={{ padding:'.55rem .9rem', borderBottom:'1px solid var(--neu-border)', background:'var(--neu-surface-deep)', display:'grid', gridTemplateColumns:'2fr 80px 80px 80px 100px 80px', gap:'.5rem' }}>
                  {['Student', 'Total', 'Attended', 'Absent', 'Percentage', 'Status'].map(h => (
                    <span key={h} style={{ fontSize:'.6rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</span>
                  ))}
                </div>
                <div style={{ maxHeight:460, overflowY:'auto' }}>
                  {attnReport.map((r, i) => {
                    const pctColor = r.percentage >= 75 ? '#22a06b' : r.percentage >= 60 ? '#f59e0b' : '#ef4444'
                    return (
                      <div key={r.student_id} style={{ display:'grid', gridTemplateColumns:'2fr 80px 80px 80px 100px 80px', gap:'.5rem', padding:'.65rem .9rem', borderBottom:'1px solid var(--neu-border)', alignItems:'center' }}>
                        <div>
                          <p style={{ fontSize:'.8rem', fontWeight:600, color:'var(--neu-text-primary)' }}>{r.full_name}</p>
                          <p style={{ fontSize:'.63rem', color:'var(--neu-text-ghost)', fontFamily:'monospace' }}>{r.roll_number}</p>
                        </div>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif' }}>{r.total_sessions}</span>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:'#22a06b', fontFamily:'Outfit,sans-serif' }}>{r.attended}</span>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:'#ef4444', fontFamily:'Outfit,sans-serif' }}>{r.absent}</span>
                        <div>
                          <ScoreBar value={r.percentage} color={pctColor} />
                        </div>
                        <span style={{ fontSize:'.65rem', fontWeight:800, padding:'.18rem .55rem', background: r.status === 'ok' ? 'rgba(34,160,107,.1)' : 'rgba(239,68,68,.1)', color: r.status === 'ok' ? '#22a06b' : '#ef4444', borderRadius:'.45rem' }}>
                          {r.status === 'ok' ? '✓ OK' : '⚠ Short'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Student detail modal ─────────────────────── */}
      {viewStudent && (
        <StudentModal
          s={viewStudent}
          semesterId={activeSemId}
          onClose={() => setViewStudent(null)}
        />
      )}
    </div>
  )
}