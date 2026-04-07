// ═══════════════════════════════════════════════════════════════
//  AnalyticsPage.jsx  —  frontend/src/pages/admin/AnalyticsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  BrainCircuit, Trophy, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Loader2, RefreshCw, Users, BarChart2, X, Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .lb-row {
    display: grid;
    grid-template-columns: 52px 2fr 160px 80px 80px 80px 120px;
    align-items: center;
    gap: .5rem;
    padding: .68rem 1rem;
    border-radius: .85rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background .14s ease, border-color .14s ease, transform .18s ease;
  }
  .lb-row:hover {
    background: var(--neu-surface-deep);
    border-color: var(--neu-border);
    transform: translateX(3px);
  }
  .lb-row.top3 {
    background: rgba(245,158,11,.045);
    border-color: rgba(245,158,11,.15);
  }
  .lb-row.top3:hover { background: rgba(245,158,11,.09); }

  .risk-card {
    padding: 1rem 1.15rem;
    border-radius: 1rem;
    border: 1px solid var(--neu-border);
    background: var(--neu-surface);
    cursor: pointer;
    box-shadow: 5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    transition: transform .2s ease, box-shadow .2s ease;
    position: relative;
  }
  .risk-card::before {
    content: '';
    position: absolute;
    left: 0; top: 10px; bottom: 10px;
    width: 3px; border-radius: 99px;
  }
  .risk-card.high::before   { background: #ef4444; }
  .risk-card.medium::before { background: #f97316; }
  .risk-card.low::before    { background: #22a06b; }
  .risk-card:hover {
    transform: translateY(-3px);
    box-shadow: 8px 14px 26px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }

  .neu-tab {
    display: flex; align-items: center; gap: .45rem;
    padding: .5rem 1.1rem; border-radius: .75rem;
    border: none; font-size: .8rem; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all .18s ease;
  }
  .neu-tab.active {
    background: linear-gradient(145deg,#5b8af0,#3a6bd4);
    color: #fff; box-shadow: 0 4px 14px rgba(91,138,240,.35);
  }
  .neu-tab.inactive {
    background: var(--neu-surface-deep);
    color: var(--neu-text-muted);
    box-shadow: 4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light);
  }
  .neu-tab.inactive:hover { color: var(--neu-text-primary); }
`

/* ─── Shared ─────────────────────────────────────── */
const iS = {
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.55rem .9rem', fontSize: '.82rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}

const RISK_CFG = {
  high:   { c: '#ef4444', bg: 'rgba(239,68,68,.1)',  label: 'HIGH'   },
  medium: { c: '#f97316', bg: 'rgba(249,115,22,.1)', label: 'MEDIUM' },
  low:    { c: '#22a06b', bg: 'rgba(34,160,107,.1)', label: 'LOW'    },
}
const TREND_CFG = {
  improving: { Icon: TrendingUp,   c: '#22a06b', label: 'Improving' },
  stable:    { Icon: Minus,        c: '#5b8af0', label: 'Stable'    },
  declining: { Icon: TrendingDown, c: '#ef4444', label: 'Declining' },
}
const ENG_CFG = {
  high:   { c: '#22a06b', bg: 'rgba(34,160,107,.1)'  },
  medium: { c: '#5b8af0', bg: 'rgba(91,138,240,.1)'  },
  low:    { c: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
}
const MEDALS = ['🥇', '🥈', '🥉']

/* ─── Score Bar ──────────────────────────────────── */
function ScoreBar({ value = 0 }) {
  const pct   = Math.min((value / 100) * 100, 100)
  const color = pct >= 80 ? '#22a06b' : pct >= 60 ? '#5b8af0' : pct >= 40 ? '#f97316' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--neu-surface-deep)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
      <span style={{ fontSize: '.78rem', fontWeight: 800, color, fontFamily: 'Outfit,sans-serif', minWidth: 34, textAlign: 'right' }}>{value?.toFixed(1)}</span>
    </div>
  )
}

/* ─── Mini Breakdown ─────────────────────────────── */
function MiniBreakdown({ bd }) {
  if (!bd) return <span style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)', opacity: .4 }}>—</span>
  const items = [
    { k: 'Att',   v: bd.lecture_attendance,    c: '#5b8af0' },
    { k: 'Campus', v: bd.campus_presence,      c: '#22a06b' },
    { k: 'Assign', v: bd.assignment_consistency, c: '#f97316' },
    { k: 'Quiz',   v: bd.quiz_accuracy,         c: '#8b5cf6' },
  ].filter(x => x.v != null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {items.map(x => (
        <div key={x.k} style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
          <span style={{ fontSize: '.58rem', color: 'var(--neu-text-ghost)', width: 34 }}>{x.k}</span>
          <div style={{ flex: 1, height: 4, background: 'var(--neu-surface-deep)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${Math.min(x.v, 100)}%`, background: x.c, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: '.58rem', fontWeight: 800, color: x.c, minWidth: 22, textAlign: 'right' }}>{x.v?.toFixed(0)}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Student Detail Modal ───────────────────────── */
function StudentModal({ s, onClose }) {
  const rc = RISK_CFG[s.risk_level] || null
  const tc = TREND_CFG[s.trend_direction] || TREND_CFG.stable
  const ec = ENG_CFG[s.engagement_level] || ENG_CFG.medium
  const tile = { background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>

        <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', gap: '.85rem', alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: '.95rem', background: 'rgba(91,138,240,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '1.1rem', color: '#5b8af0', fontFamily: 'Outfit,sans-serif' }}>
            {s.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{s.full_name}</h2>
            <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{s.roll_number}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1rem 1.4rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '.55rem' }}>

          {/* Top tiles - 4 tiles now */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '.5rem' }}>
            {[
              { label: 'Score',      value: s.academic_score?.toFixed(1) || '—',    c: '#5b8af0' },
              { label: 'Class Rank', value: s.rank ? `#${s.rank}` : '—',            c: '#f59e0b' },
              { label: 'Sec. Rank',  value: s.section_rank ? `#${s.section_rank}` : '—', c: '#a78bfa' },
              { label: 'Improve',    value: s.improvement_index ? `${Math.round(s.improvement_index)}` : '—', c: '#3ecf8e' },
            ].map(r => (
              <div key={r.label} style={{ ...tile, textAlign: 'center' }}>
                <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{r.label}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: r.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{r.value}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {rc && <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.2rem .6rem', background: rc.bg, color: rc.c, borderRadius: '.45rem' }}>{rc.label} RISK</span>}
            <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.2rem .6rem', background: ec.bg, color: ec.c, borderRadius: '.45rem', textTransform: 'capitalize' }}>{s.engagement_level} engagement</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .6rem', background: 'var(--neu-surface-deep)', color: tc.c, border: '1px solid var(--neu-border)', borderRadius: '.45rem' }}>
              <tc.Icon size={11} />{tc.label}
            </span>
          </div>

          {/* Score bar */}
          <div style={tile}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Academic Score</p>
            <ScoreBar value={s.academic_score} />
          </div>

          {/* Full breakdown */}
          {s.score_breakdown && (
            <div style={tile}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.6rem' }}>Score Breakdown</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {[
                  { label: 'Lecture Attendance',    v: s.score_breakdown.lecture_attendance,     c: '#5b8af0' },
                  { label: 'Campus Presence',        v: s.score_breakdown.campus_presence,        c: '#22a06b' },
                  { label: 'Assignment Consistency', v: s.score_breakdown.assignment_consistency, c: '#f97316' },
                  { label: 'Quiz Accuracy',          v: s.score_breakdown.quiz_accuracy,          c: '#8b5cf6' },
                  { label: 'GPA Factor',             v: s.score_breakdown.gpa_factor,             c: '#ec4899' },
                ].filter(x => x.v != null).map(x => (
                  <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <span style={{ fontSize: '.72rem', color: 'var(--neu-text-muted)', minWidth: 160 }}>{x.label}</span>
                    <div style={{ flex: 1, height: 5, background: 'var(--neu-border)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${Math.min(x.v, 100)}%`, background: x.c, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: '.72rem', fontWeight: 800, color: x.c, minWidth: 32, textAlign: 'right' }}>{x.v?.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {s.risk_factors?.length > 0 && (
            <div style={tile}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Risk Factors</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                {s.risk_factors.map((f, i) => (
                  <span key={i} style={{ fontSize: '.7rem', fontWeight: 600, padding: '.25rem .6rem', background: 'rgba(249,115,22,.1)', color: '#f97316', borderRadius: '.45rem' }}>⚠ {f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {s.recommendations?.length > 0 && (
            <div style={tile}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Recommendations</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {s.recommendations.slice(0, 3).map((r, i) => (
                  <p key={i} style={{ fontSize: '.75rem', color: 'var(--neu-text-secondary)', lineHeight: 1.5 }}>• {r.message || r}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem', width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Leaderboard Row ────────────────────────────── */
function LBRow({ s, idx, onView }) {
  const isTop3 = idx < 3
  const tc = TREND_CFG[s.trend_direction] || TREND_CFG.stable
  const ec = ENG_CFG[s.engagement_level] || ENG_CFG.medium
  return (
    <div className={`lb-row${isTop3 ? ' top3' : ''}`} onClick={() => onView(s)}>
      <div style={{ textAlign: 'center' }}>
        {isTop3
          ? <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{MEDALS[idx]}</span>
          : <span style={{ fontSize: '.82rem', fontWeight: 800, color: 'var(--neu-text-ghost)', fontFamily: 'Outfit,sans-serif' }}>#{s.rank || idx + 1}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '.6rem', background: 'rgba(91,138,240,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '.82rem', color: '#5b8af0', fontFamily: 'Outfit,sans-serif' }}>
          {s.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
          <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{s.roll_number}</p>
        </div>
      </div>
      <ScoreBar value={s.academic_score} />
      <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.18rem .5rem', background: ec.bg, color: ec.c, borderRadius: '.4rem', textTransform: 'capitalize', display: 'inline-block' }}>
        {s.engagement_level}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
        <tc.Icon size={12} style={{ color: tc.c, flexShrink: 0 }} />
        <span style={{ fontSize: '.7rem', fontWeight: 600, color: tc.c }}>{tc.label}</span>
      </div>
      {/* Section Rank Column */}
      <span style={{
        fontSize: '.72rem', fontWeight: 800,
        color: s.section_rank ? '#a78bfa' : 'var(--neu-text-ghost)',
        fontFamily: 'Outfit,sans-serif', textAlign: 'center'
      }}>
        {s.section_rank ? `#${s.section_rank}` : '—'}
      </span>
      <MiniBreakdown bd={s.score_breakdown} />
    </div>
  )
}

/* ─── Risk Card ──────────────────────────────────── */
function RiskCard({ s, onView }) {
  const rc = RISK_CFG[s.risk_level] || RISK_CFG.low
  const tc = TREND_CFG[s.trend_direction] || TREND_CFG.stable
  return (
    <div className={`risk-card ${s.risk_level}`} onClick={() => onView(s)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: '.85rem', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '1rem', color: rc.c, fontFamily: 'Outfit,sans-serif', marginLeft: '.35rem' }}>
          {s.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{s.full_name}</span>
            <span style={{ fontSize: '.62rem', fontFamily: 'monospace', color: 'var(--neu-text-ghost)' }}>{s.roll_number}</span>
            <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.15rem .5rem', background: rc.bg, color: rc.c, borderRadius: '.4rem' }}>● {rc.label} RISK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '.55rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--neu-text-muted)' }}>Score: <strong style={{ color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{s.academic_score?.toFixed(1)}</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.72rem', fontWeight: 600, color: tc.c }}>
              <tc.Icon size={12} />{tc.label}
            </span>
          </div>
          <ScoreBar value={s.academic_score} />
          {s.risk_factors?.length > 0 && (
            <div style={{ marginTop: '.55rem', display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
              {s.risk_factors.map((f, i) => (
                <span key={i} style={{ fontSize: '.65rem', fontWeight: 600, padding: '.15rem .5rem', background: rc.bg, color: rc.c, borderRadius: '.4rem' }}>⚠ {f}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: rc.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{s.academic_score?.toFixed(0)}</div>
          <div style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)' }}>/ 100</div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [semesters,   setSemesters]   = useState([])
  const [activeSemId, setActiveSemId] = useState(null)
  const [tab,         setTab]         = useState('leaderboard')
  const [leaderboard, setLeaderboard] = useState([])
  const [atRisk,      setAtRisk]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [viewStudent, setViewStudent] = useState(null)

  useEffect(() => {
    adminAPI.getSemesters().then(r => {
      const sems = r.data.data?.semesters || []
      setSemesters(sems)
      const active = sems.find(s => s.is_active)
      if (active) setActiveSemId(active.id)
    })
  }, [])

  const fetchData = useCallback(async () => {
    if (!activeSemId) return
    setLoading(true)
    try {
      const [lb, ar] = await Promise.all([
        adminAPI.getLeaderboard(activeSemId, 20),
        adminAPI.getAtRiskStudents(activeSemId),
      ])
      setLeaderboard(lb.data.data?.leaderboard || [])
      setAtRisk(ar.data.data)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }, [activeSemId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleBulkCalculate = async () => {
    setCalculating(true)
    try { await adminAPI.bulkCalculateAnalytics({ semester_id: activeSemId }); toast.success('Analytics recalculated!'); fetchData() }
    catch { toast.error('Failed to recalculate') }
    finally { setCalculating(false) }
  }

  const handleCalculateRanks = async () => {
    setCalculating(true)
    try {
      const res = await adminAPI.calculateRanks(activeSemId)
      toast.success(`Ranks updated for ${res.data.data?.students_ranked || 0} students`)
      fetchData()
    } catch { toast.error('Failed') }
    finally { setCalculating(false) }
  }

  const highRisk = atRisk?.students?.filter(s => s.risk_level === 'high')  || []
  const medRisk  = atRisk?.students?.filter(s => s.risk_level === 'medium') || []
  const avgScore = leaderboard.length
    ? (leaderboard.reduce((s, x) => s + (x.academic_score || 0), 0) / leaderboard.length).toFixed(1) : '—'

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'linear-gradient(145deg,rgba(91,138,240,.18),rgba(91,138,240,.08))', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit size={20} style={{ color: '#5b8af0' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>AI Analytics</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>Student performance insights & risk detection</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <select value={activeSemId || ''} onChange={e => setActiveSemId(parseInt(e.target.value))} style={iS}>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>)}
            </select>
            <button onClick={handleBulkCalculate} disabled={calculating || !activeSemId} style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.55rem 1rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35), 5px 5px 12px var(--neu-shadow-dark)', borderRadius: '.75rem', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.78rem', cursor: calculating ? 'not-allowed' : 'pointer', opacity: calculating ? .7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
              {calculating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}Recalculate
            </button>
          </div>
        </div>

        {/* KPI Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem' }}>
          {[
            { label: 'Total Ranked', value: leaderboard.length, c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  Icon: Users        },
            { label: 'Top Score',    value: leaderboard[0]?.academic_score?.toFixed(1) || '—', c: '#f59e0b', bg: 'rgba(245,158,11,.1)', Icon: Trophy },
            { label: 'Avg Score',    value: avgScore,            c: '#22a06b', bg: 'rgba(34,160,107,.1)', Icon: BarChart2     },
            { label: 'High Risk',    value: highRisk.length,     c: '#ef4444', bg: 'rgba(239,68,68,.1)',  Icon: AlertTriangle },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1rem', padding: '.9rem 1.1rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '.75rem', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <t.Icon size={17} style={{ color: t.c }} />
              </div>
              <div>
                <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{t.label}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: t.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1.1, marginTop: '.1rem' }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', padding: '.4rem', background: 'var(--neu-surface-deep)', borderRadius: '1rem', width: 'fit-content', boxShadow: 'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 6px var(--neu-shadow-light)' }}>
          {[{ key: 'leaderboard', label: 'Leaderboard', Icon: Trophy }, { key: 'at-risk', label: 'At-Risk Students', Icon: AlertTriangle }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`neu-tab ${tab === t.key ? 'active' : 'inactive'}`}>
              <t.Icon size={14} />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <Loader2 size={28} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '.85rem', color: 'var(--neu-text-muted)' }}>Loading analytics…</p>
          </div>

        ) : tab === 'leaderboard' ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
            {/* Table header - updated with S.Rank column */}
            <div style={{ padding: '.6rem 1rem', borderBottom: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'grid', gridTemplateColumns: '52px 2fr 160px 80px 80px 80px 120px', gap: '.5rem' }}>
              {['Rank', 'Student', 'Score', 'Engagement', 'Trend', 'S.Rank', 'Breakdown'].map(h => (
                <span key={h} style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
              ))}
            </div>
            <div style={{ padding: '.5rem .6rem', display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <Trophy size={32} style={{ color: 'var(--neu-text-ghost)', opacity: .15, margin: '0 auto .8rem', display: 'block' }} />
                  <p style={{ color: 'var(--neu-text-secondary)', fontWeight: 600 }}>No data yet — click Recalculate</p>
                </div>
              ) : leaderboard.map((s, idx) => <LBRow key={s.student_id} s={s} idx={idx} onView={setViewStudent} />)}
            </div>
            {leaderboard.length > 0 && (
              <div style={{ padding: '.6rem 1rem', borderTop: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>{leaderboard.length} students · click row for details</span>
                <button onClick={handleCalculateRanks} disabled={calculating} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.72rem', fontWeight: 700, color: '#5b8af0', background: 'none', border: 'none', cursor: calculating ? 'not-allowed' : 'pointer', opacity: calculating ? .6 : 1, fontFamily: "'DM Sans',sans-serif" }}>
                  {calculating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}Update Ranks
                </button>
              </div>
            )}
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(atRisk?.at_risk_count || 0) === 0 ? (
              <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
                <div style={{ width: 58, height: 58, borderRadius: '1.1rem', background: 'rgba(34,160,107,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <TrendingUp size={26} style={{ color: '#22a06b' }} />
                </div>
                <p style={{ fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', fontSize: '1rem' }}>All Students On Track!</p>
                <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', marginTop: '.4rem' }}>No at-risk students detected</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: `${highRisk.length} High Risk`,  c: '#ef4444', bg: 'rgba(239,68,68,.1)'  },
                    { label: `${medRisk.length} Medium Risk`, c: '#f97316', bg: 'rgba(249,115,22,.1)' },
                  ].map(p => (
                    <span key={p.label} style={{ fontSize: '.72rem', fontWeight: 700, padding: '.3rem .8rem', background: p.bg, color: p.c, borderRadius: '.6rem', border: `1.5px solid ${p.c}30` }}>{p.label}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                  {atRisk?.students?.map(s => <RiskCard key={s.student_id} s={s} onView={setViewStudent} />)}
                </div>
              </>
            )}
          </div>
        )}

        {viewStudent && <StudentModal s={viewStudent} onClose={() => setViewStudent(null)} />}
      </div>
    </>
  )
}