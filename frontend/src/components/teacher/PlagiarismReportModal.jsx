// ═══════════════════════════════════════════════════════════════
//  PlagiarismReportModal.jsx
//  Place at: frontend/src/components/teacher/PlagiarismReportModal.jsx
//
//  Shows:
//  • Per-student similarity badge
//  • Risk breakdown (high / medium / low)
//  • Pairwise comparison table
//  • "Run Check" button → calls POST /assignments/:id/check-plagiarism
//  • "Refresh Report" → calls GET  /assignments/:id/plagiarism-report
// ═══════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react'
import {
  X, ShieldAlert, ShieldCheck, ShieldOff,
  Loader2, RefreshCw, ScanSearch, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Info,
} from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

/* ─── Risk config ─────────────────────────────────────── */
const RISK = {
  high:   { color: '#f26b6b', bg: 'rgba(242,107,107,0.12)', border: 'rgba(242,107,107,0.3)',  Icon: ShieldAlert,  label: 'High Risk'   },
  medium: { color: '#f5a623', bg: 'rgba(245,166,35,0.12)',  border: 'rgba(245,166,35,0.3)',   Icon: ShieldOff,    label: 'Medium Risk' },
  low:    { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)',  border: 'rgba(62,207,142,0.3)',   Icon: ShieldCheck,  label: 'Low Risk'    },
}

/* ─── Helpers ─────────────────────────────────────────── */
const pct = (v) => `${(v ?? 0).toFixed(1)}%`

function RiskBadge({ level, score }) {
  const cfg = RISK[level] || RISK.low
  const { Icon } = cfg
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.18rem 0.6rem', borderRadius: '0.5rem',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap',
    }}>
      <Icon size={10} />
      {score !== undefined ? `${pct(score)}` : cfg.label}
    </span>
  )
}

/* ─── Mini bar ────────────────────────────────────────── */
function Bar({ value, max = 100 }) {
  const pctVal  = Math.min((value / max) * 100, 100)
  const color   = pctVal >= 70 ? '#f26b6b' : pctVal >= 40 ? '#f5a623' : '#3ecf8e'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 120 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'var(--neu-surface-deep)',
        boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pctVal}%`, height: '100%', borderRadius: 3,
          background: color,
          boxShadow: `0 1px 4px ${color}55`,
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color, minWidth: 36, textAlign: 'right' }}>
        {pct(value)}
      </span>
    </div>
  )
}

/* ─── Stat card ───────────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--neu-surface-deep)',
      boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
      border: '1px solid var(--neu-border)',
      borderRadius: '0.875rem',
      padding: '0.8rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '0.2rem',
      flex: 1,
    }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      <p style={{ fontSize: '1.45rem', fontWeight: 900, color: color || 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</p>
    </div>
  )
}

/* ─── Pair row ────────────────────────────────────────── */
function PairRow({ pair, submissionMap }) {
  const nameA = submissionMap[pair.submission_a]?.full_name   || `Student ${pair.student_a}`
  const nameB = submissionMap[pair.submission_b]?.full_name   || `Student ${pair.student_b}`
  const rollA = submissionMap[pair.submission_a]?.roll_number || '—'
  const rollB = submissionMap[pair.submission_b]?.roll_number || '—'
  const cfg   = RISK[pair.risk_level] || RISK.low
  const { Icon } = cfg

  return (
    <tr style={{ transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      {/* Student A */}
      <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{nameA}</p>
        <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{rollA}</p>
      </td>
      {/* vs */}
      <td style={{ padding: '0.65rem 0.5rem', borderBottom: '1px solid var(--neu-border-inner)', textAlign: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontWeight: 700 }}>vs</span>
      </td>
      {/* Student B */}
      <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{nameB}</p>
        <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{rollB}</p>
      </td>
      {/* Combined score */}
      <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
        <Bar value={pair.combined_score} />
      </td>
      {/* Difflib */}
      <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)', fontSize: '0.72rem', color: 'var(--neu-text-secondary)', textAlign: 'center' }}>
        {pct(pair.difflib_score)}
      </td>
      {/* Semantic */}
      <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)', fontSize: '0.72rem', color: 'var(--neu-text-secondary)', textAlign: 'center' }}>
        {pct(pair.semantic_score)}
      </td>
      {/* Risk */}
      <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem',
          borderRadius: '0.4rem', background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}>
          <Icon size={9} /> {cfg.label}
        </span>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN MODAL
═══════════════════════════════════════════════════════ */
export default function PlagiarismReportModal({ assignment, onClose }) {
  const [report,   setReport]   = useState(null)
  const [running,  setRunning]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState('students')  // 'students' | 'pairs'
  const [sortBy,   setSortBy]   = useState('score_desc')
  const [pairsExpanded, setPairsExpanded] = useState(false)

  /* ─── Fetch saved report ─────────────────────────────── */
  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/assignments/${assignment.id}/plagiarism-report`)
      setReport(res.data.data)
    } catch {
      toast.error('Could not load report')
    } finally {
      setLoading(false)
    }
  }, [assignment.id])

  /* ─── Run fresh check ────────────────────────────────── */
  const runCheck = useCallback(async () => {
    setRunning(true)
    try {
      toast.loading('Running plagiarism check…', { id: 'plag' })
      const res = await api.post(`/assignments/${assignment.id}/check-plagiarism`)
      toast.success('Check complete!', { id: 'plag' })
      // Refresh report from DB after run
      const rep = await api.get(`/assignments/${assignment.id}/plagiarism-report`)
      setReport(rep.data.data)
      // Also attach pairs from run result
      const runData = res.data.data
      setReport(prev => ({
        ...prev,
        _run_pairs: runData.pairs || [],
        _run_summary: runData,
      }))
    } catch (err) {
      const msg = err.response?.data?.message || 'Plagiarism check failed'
      toast.error(msg, { id: 'plag' })
    } finally {
      setRunning(false)
    }
  }, [assignment.id])

  /* ─── Derived data ────────────────────────────────────── */
  const submissions  = report?.submissions    || []
  const pairs        = report?._run_pairs     || []
  const runSummary   = report?._run_summary   || null

  // Build map for pair labels
  const subMap = {}
  submissions.forEach(s => { subMap[s.submission_id] = s })

  // Sort students
  const sorted = [...submissions].sort((a, b) => {
    if (sortBy === 'score_desc') return b.plagiarism_percentage - a.plagiarism_percentage
    if (sortBy === 'score_asc')  return a.plagiarism_percentage - b.plagiarism_percentage
    return 0
  })

  const highRisk   = submissions.filter(s => s.risk_level === 'high').length
  const medRisk    = submissions.filter(s => s.risk_level === 'medium').length
  const avgSim     = report?.avg_similarity ?? 0
  const checkedCnt = report?.checked_count  ?? 0

  // ─── Shared input style ───
  const neuInset = {
    background: 'var(--neu-surface-deep)',
    boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
    border: '1px solid var(--neu-border)',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,12,20,0.82)', backdropFilter: 'blur(10px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes slideUp  { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:none} }
        .plag-row:hover { background: var(--neu-surface-deep) !important; }
      `}</style>

      <div style={{
        background: 'var(--neu-surface)',
        border: '1px solid var(--neu-border)',
        borderRadius: '1.5rem',
        boxShadow: '20px 20px 50px var(--neu-shadow-dark), -8px -8px 24px var(--neu-shadow-light)',
        width: '100%', maxWidth: 920,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--neu-border)',
          display: 'flex', alignItems: 'center', gap: '0.85rem',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0,
            background: 'linear-gradient(145deg,#f26b6b,#d94f4f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 3px 12px rgba(242,107,107,0.35)',
          }}>
            <ScanSearch size={17} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
              Plagiarism Report
            </h2>
            <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {assignment.title}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            {/* Load existing report */}
            <button
              onClick={fetchReport}
              disabled={loading || running}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.42rem 0.9rem', borderRadius: '0.65rem',
                border: '1px solid var(--neu-border)',
                background: 'var(--neu-surface-deep)', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--neu-text-secondary)',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <RefreshCw size={13} />
              }
              Load Report
            </button>

            {/* Run fresh check */}
            <button
              onClick={runCheck}
              disabled={running || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.42rem 0.95rem', borderRadius: '0.65rem',
                border: 'none', cursor: running ? 'not-allowed' : 'pointer',
                background: running
                  ? 'var(--neu-surface-deep)'
                  : 'linear-gradient(145deg,#f26b6b,#d94f4f)',
                boxShadow: running ? 'none' : '4px 4px 10px var(--neu-shadow-dark), 0 4px 14px rgba(242,107,107,0.35)',
                color: running ? 'var(--neu-text-ghost)' : '#fff',
                fontSize: '0.72rem', fontWeight: 700,
                opacity: running ? 0.7 : 1,
              }}
            >
              {running
                ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Checking…</>
                : <><ScanSearch size={13} /> Run Check</>
              }
            </button>

            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
            }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Info banner (no data yet) ── */}
          {!report && !loading && !running && (
            <div style={{
              ...neuInset, borderRadius: '0.875rem',
              padding: '1.5rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.75rem', textAlign: 'center',
            }}>
              <ScanSearch size={36} style={{ color: 'var(--neu-text-ghost)', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.9rem' }}>
                No report loaded yet
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', maxWidth: 360 }}>
                Click <strong>Load Report</strong> to see previously saved results,
                or <strong>Run Check</strong> to compare all student submissions now.
              </p>
            </div>
          )}

          {/* ── Loading state ── */}
          {(loading || running) && (
            <div style={{
              ...neuInset, borderRadius: '0.875rem',
              padding: '2rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.75rem', textAlign: 'center',
            }}>
              <Loader2 size={30} style={{ color: '#f26b6b', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neu-text-secondary)' }}>
                {running ? 'Comparing all student files…' : 'Loading saved report…'}
              </p>
              {running && (
                <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>
                  This may take a moment — checking semantic similarity
                </p>
              )}
            </div>
          )}

          {/* ── Report data ── */}
          {report && !loading && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Stat label="Students Checked" value={checkedCnt} color="var(--neu-text-primary)" />
                <Stat label="Avg Similarity"   value={pct(avgSim)} color={avgSim >= 40 ? '#f5a623' : '#3ecf8e'} />
                <Stat label="High Risk"  value={highRisk} color={highRisk > 0 ? '#f26b6b' : '#3ecf8e'} />
                <Stat label="Medium Risk" value={medRisk} color={medRisk > 0 ? '#f5a623' : '#3ecf8e'} />
              </div>

              {/* Run summary if fresh check was just done */}
              {runSummary && (
                <div style={{
                  ...neuInset, borderRadius: '0.875rem',
                  padding: '0.75rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  borderLeft: '3px solid #3ecf8e',
                }}>
                  <CheckCircle size={15} style={{ color: '#3ecf8e', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-secondary)' }}>
                    Checked <strong>{runSummary.total_pairs_checked}</strong> pairs —{' '}
                    <strong style={{ color: '#f26b6b' }}>{runSummary.high_risk_pairs}</strong> high-risk,{' '}
                    <strong style={{ color: '#f5a623' }}>{runSummary.medium_risk_pairs}</strong> medium-risk
                  </p>
                </div>
              )}

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[
                  { key: 'students', label: 'Per Student' },
                  { key: 'pairs',    label: `Pair Details (${pairs.length})` },
                ].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{
                    padding: '0.38rem 0.9rem', borderRadius: '0.6rem', border: 'none',
                    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                    fontSize: '0.73rem', fontWeight: 700,
                    background: tab === t.key ? 'var(--neu-surface)' : 'transparent',
                    color: tab === t.key ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)',
                    boxShadow: tab === t.key
                      ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)'
                      : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {t.label}
                  </button>
                ))}

                {/* Sort (students tab only) */}
                {tab === 'students' && (
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      marginLeft: 'auto',
                      ...neuInset, borderRadius: '0.6rem',
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: 'var(--neu-text-secondary)',
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="score_desc">Highest similarity first</option>
                    <option value="score_asc">Lowest similarity first</option>
                  </select>
                )}
              </div>

              {/* ── Per-student table ── */}
              {tab === 'students' && (
                <div style={{ overflowX: 'auto', borderRadius: '0.875rem', border: '1px solid var(--neu-border)' }}>
                  {sorted.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.82rem' }}>
                      No student data available — run a check first
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--neu-surface-deep)' }}>
                          {['Student', 'Roll No', 'Max Similarity', 'difflib', 'Semantic', 'Risk', 'Similar To'].map(h => (
                            <th key={h} style={{
                              textAlign: 'left', padding: '0.65rem 0.9rem',
                              fontSize: '0.62rem', fontWeight: 700,
                              color: 'var(--neu-text-ghost)', textTransform: 'uppercase',
                              letterSpacing: '0.06em', borderBottom: '1px solid var(--neu-border)',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map(s => {
                          const pd  = s.plagiarism_data || {}
                          const cfg = RISK[s.risk_level] || RISK.low
                          const { Icon } = cfg
                          const highlightRow = s.risk_level === 'high'
                          return (
                            <tr key={s.submission_id}
                              className="plag-row"
                              style={{ background: highlightRow ? 'rgba(242,107,107,0.04)' : '' }}>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>
                                {s.full_name || `Student ${s.student_id}`}
                              </td>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)', fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>
                                {s.roll_number || '—'}
                              </td>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                                <Bar value={s.plagiarism_percentage} />
                              </td>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)', fontSize: '0.72rem', color: 'var(--neu-text-secondary)', textAlign: 'center' }}>
                                {pd.difflib_score !== undefined ? pct(pd.difflib_score) : '—'}
                              </td>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)', fontSize: '0.72rem', color: 'var(--neu-text-secondary)', textAlign: 'center' }}>
                                {pd.semantic_score !== undefined ? pct(pd.semantic_score) : '—'}
                              </td>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem',
                                  borderRadius: '0.4rem', background: cfg.bg, color: cfg.color,
                                  border: `1px solid ${cfg.border}`,
                                }}>
                                  <Icon size={9} /> {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                                {(s.similar_to || []).length > 0 ? (
                                  <span style={{ fontSize: '0.65rem', color: '#f5a623', fontWeight: 700 }}>
                                    {s.similar_to.length} submission{s.similar_to.length !== 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>None</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ── Pairs table ── */}
              {tab === 'pairs' && (
                <div style={{ overflowX: 'auto', borderRadius: '0.875rem', border: '1px solid var(--neu-border)' }}>
                  {pairs.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.82rem' }}>
                      Run a check to see pairwise comparisons
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--neu-surface-deep)' }}>
                          {['Student A', '', 'Student B', 'Combined', 'difflib', 'Semantic', 'Risk'].map(h => (
                            <th key={h} style={{
                              textAlign: h === '' ? 'center' : 'left',
                              padding: '0.65rem 0.9rem',
                              fontSize: '0.62rem', fontWeight: 700,
                              color: 'var(--neu-text-ghost)', textTransform: 'uppercase',
                              letterSpacing: '0.06em', borderBottom: '1px solid var(--neu-border)',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...pairs]
                          .sort((a, b) => b.combined_score - a.combined_score)
                          .map((pair, idx) => (
                            <PairRow key={idx} pair={pair} submissionMap={subMap} />
                          ))
                        }
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Method legend */}
              <div style={{
                ...neuInset, borderRadius: '0.75rem',
                padding: '0.65rem 0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.65rem',
              }}>
                <Info size={13} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', lineHeight: 1.5 }}>
                  <strong>Combined</strong> = 40% difflib (exact text match) + 60% sentence-transformers (semantic similarity).
                  <span style={{ marginLeft: '0.5rem' }}>
                    ≥70% = High risk · 40–69% = Medium · &lt;40% = Low
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}