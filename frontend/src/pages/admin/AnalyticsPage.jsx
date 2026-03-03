import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin.api'
import toast from 'react-hot-toast'
import {
  BrainCircuit, Trophy, AlertTriangle, TrendingUp,
  TrendingDown, Minus, Loader2, RefreshCw,
  GraduationCap, BarChart2, Users
} from 'lucide-react'

const RISK_CFG = {
  high:   { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    border: 'border-red-200' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', border: 'border-orange-200' },
  low:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  border: 'border-green-200' },
}

const TREND_CFG = {
  improving: { icon: TrendingUp,   cls: 'text-emerald-600', label: 'Improving' },
  stable:    { icon: Minus,        cls: 'text-blue-500',    label: 'Stable'    },
  declining: { icon: TrendingDown, cls: 'text-red-500',     label: 'Declining' },
}

const ENGAGEMENT_CFG = {
  high:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-blue-100 text-blue-600',
  low:    'bg-red-100 text-red-600',
}

function ScoreBar({ value, max = 100 }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-orange-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-10 text-right">{value?.toFixed(1)}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [semesters, setSemesters] = useState([])
  const [activeSemId, setActiveSemId] = useState(null)
  const [tab, setTab] = useState('leaderboard')

  const [leaderboard, setLeaderboard] = useState([])
  const [atRisk, setAtRisk] = useState(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    adminAPI.getSemesters().then(r => {
      const sems = r.data.data?.semesters || []
      setSemesters(sems)
      const active = sems.find(s => s.is_active)
      if (active) setActiveSemId(active.id)
    })
  }, [])

  useEffect(() => {
    if (!activeSemId) return
    fetchData()
  }, [activeSemId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lb, ar] = await Promise.all([
        adminAPI.getLeaderboard(activeSemId, 20),
        adminAPI.getAtRiskStudents(activeSemId),
      ])
      setLeaderboard(lb.data.data?.leaderboard || [])
      setAtRisk(ar.data.data)
    } catch (err) {
      toast.error('Failed to load analytics data')
    } finally { setLoading(false) }
  }

  const handleCalculateRanks = async () => {
    setCalculating(true)
    try {
      const res = await adminAPI.calculateRanks(activeSemId)
      toast.success(`Ranks calculated for ${res.data.data?.students_ranked || 0} students`)
      fetchData()
    } catch { toast.error('Failed to calculate ranks') }
    finally { setCalculating(false) }
  }

  const handleBulkCalculate = async () => {
    setCalculating(true)
    try {
      await adminAPI.bulkCalculateAnalytics({ semester_id: activeSemId })
      toast.success('Analytics recalculated for all students')
      fetchData()
    } catch { toast.error('Failed to recalculate analytics') }
    finally { setCalculating(false) }
  }

  const atRiskCount = atRisk?.at_risk_count || 0
  const highRisk = atRisk?.students?.filter(s => s.risk_level === 'high') || []
  const medRisk  = atRisk?.students?.filter(s => s.risk_level === 'medium') || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit size={22} className="text-blue-600" />
            <h1 className="font-display font-bold text-2xl text-slate-800">AI Analytics</h1>
          </div>
          <p className="text-slate-400 text-sm">Student performance insights & risk detection</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={activeSemId || ''} onChange={e => setActiveSemId(parseInt(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>)}
          </select>
          <button onClick={handleBulkCalculate} disabled={calculating || !activeSemId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            {calculating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Recalculate
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Users size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-slate-400 text-xs">Total Ranked</p>
              <p className="text-2xl font-display font-bold text-blue-600">{leaderboard.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><Trophy size={18} className="text-emerald-600" /></div>
            <div>
              <p className="text-slate-400 text-xs">Top Score</p>
              <p className="text-2xl font-display font-bold text-emerald-600">{leaderboard[0]?.academic_score?.toFixed(1) || '—'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><AlertTriangle size={18} className="text-red-500" /></div>
            <div>
              <p className="text-slate-400 text-xs">At-Risk (High)</p>
              <p className="text-2xl font-display font-bold text-red-600">{highRisk.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><AlertTriangle size={18} className="text-orange-500" /></div>
            <div>
              <p className="text-slate-400 text-xs">At-Risk (Medium)</p>
              <p className="text-2xl font-display font-bold text-orange-500">{medRisk.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { key: 'at-risk',     label: 'At-Risk Students', icon: AlertTriangle },
        ].map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-400 text-sm">Loading analytics...</p>
          </div>
        </div>
      ) : tab === 'leaderboard' ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-800">Performance Leaderboard</h2>
            <button onClick={handleCalculateRanks} disabled={calculating}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
              {calculating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Update Ranks
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Rank', 'Student', 'Score', 'Engagement', 'Trend', 'Breakdown'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400">No data — click Recalculate to generate scores</td></tr>
                ) : leaderboard.map((s, idx) => {
                  const trend = TREND_CFG[s.trend_direction] || TREND_CFG.stable
                  const TrendIcon = trend.icon
                  const isTop3 = idx < 3
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <tr key={s.student_id} className={`hover:bg-slate-50 transition-colors ${isTop3 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        {isTop3
                          ? <span className="text-lg">{medals[idx]}</span>
                          : <span className="text-slate-500 font-bold text-sm">#{s.rank || idx + 1}</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                            {s.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{s.full_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{s.roll_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <ScoreBar value={s.academic_score} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${ENGAGEMENT_CFG[s.engagement_level] || ENGAGEMENT_CFG.medium}`}>
                          {s.engagement_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${trend.cls}`}>
                          <TrendIcon size={13} /> {trend.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {s.score_breakdown ? (
                          <div className="space-y-0.5">
                            <span>Attendance: {s.score_breakdown.lecture_attendance?.toFixed(0)}%</span>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* At-Risk Tab */
        <div className="space-y-4">
          {atRiskCount === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp size={24} className="text-emerald-600" />
              </div>
              <p className="font-display font-bold text-slate-700">All Students On Track!</p>
              <p className="text-slate-400 text-sm mt-1">No at-risk students detected for this semester</p>
            </div>
          ) : (
            atRisk?.students?.map(s => {
              const rc = RISK_CFG[s.risk_level] || RISK_CFG.low
              return (
                <div key={s.student_id} className={`bg-white rounded-2xl border ${rc.border} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-display font-bold text-slate-800">{s.full_name}</p>
                        <span className="text-xs font-mono text-slate-400">{s.roll_number}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                          {s.risk_level?.toUpperCase()} RISK
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-slate-500">Score: <strong className="text-slate-700">{s.academic_score?.toFixed(1)}</strong></span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ENGAGEMENT_CFG[s.engagement_level] || ENGAGEMENT_CFG.medium}`}>
                          {s.engagement_level} engagement
                        </span>
                      </div>
                      {s.risk_factors?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 font-semibold mb-1.5">Risk Factors:</p>
                          <div className="flex flex-wrap gap-2">
                            {s.risk_factors.map((f, i) => (
                              <span key={i} className={`text-xs px-2.5 py-1 rounded-xl ${rc.bg} ${rc.text} font-medium`}>
                                ⚠ {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-display font-bold text-slate-300">{s.academic_score?.toFixed(0)}</div>
                      <div className="text-xs text-slate-400">/ 100</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
