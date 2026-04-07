import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award, TrendingUp, TrendingDown, Minus, Loader2,
  ClipboardCheck, FileText, PenSquare, GraduationCap, Users
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

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

const COMPONENT_META = [
  { key: 'lecture_attendance',    label: 'Lecture Attendance',     icon: ClipboardCheck, color: '#5b8af0', weight: '25%' },
  { key: 'campus_presence',       label: 'Campus Presence',        icon: Users,          color: '#3ecf8e', weight: '10%' },
  { key: 'assignment_consistency',label: 'Assignment Consistency',  icon: FileText,       color: '#f97316', weight: '20%' },
  { key: 'quiz_accuracy',         label: 'Quiz Accuracy',          icon: PenSquare,      color: '#8b5cf6', weight: '20%' },
  { key: 'gpa_factor',            label: 'GPA Factor',             icon: GraduationCap,  color: '#ec4899', weight: '25%' },
]

function Ring({ pct = 0, color = '#5b8af0', size = 110, stroke = 9 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neu-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
          {Math.round(pct)}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)' }}>/100</span>
      </div>
    </div>
  )
}

export default function AnalyticsDetailPage() {
  const user     = authStore.getUser()
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentAPI.getAnalytics()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'16rem' }}>
      <Loader2 size={26} style={{ color:'#5b8af0', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  if (!data) return (
    <div style={{ textAlign:'center', padding:'4rem', color:'var(--neu-text-ghost)' }}>
      <Award size={40} style={{ opacity:0.2, marginBottom:'0.75rem' }} />
      <p style={{ fontWeight:700, color:'var(--neu-text-secondary)' }}>No analytics data yet</p>
      <p style={{ fontSize:'0.8rem', marginTop:'0.35rem' }}>Admin needs to calculate analytics first</p>
    </div>
  )

  const bd         = data.score_breakdown || {}
  const score      = data.academic_score  || 0
  const trend      = data.trend_direction || 'stable'
  const risk       = data.risk_prediction || {}
  const recs       = data.recommendations || []
  const weak       = data.weak_subjects   || []
  const classRank  = data.class_rank
  const sectionRank = data.section_rank
  const improvement = data.improvement_index

  const scoreColor = score >= 75 ? '#3ecf8e' : score >= 50 ? '#5b8af0' : '#f26b6b'
  const TrendIcon  = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  const trendColor = trend === 'improving' ? '#3ecf8e' : trend === 'declining' ? '#f26b6b' : '#94a3b8'

  const radarData = COMPONENT_META.map(m => ({
    subject: m.label.split(' ')[0],
    A: bd[m.key] || 0,
    fullMark: 100,
  }))

  const barData = COMPONENT_META.map(m => ({
    name: m.label.split(' ')[0],
    value: Math.round(bd[m.key] || 0),
    color: m.color,
  }))

  const engColor = data.engagement_level === 'high' ? '#3ecf8e'
    : data.engagement_level === 'medium' ? '#5b8af0' : '#f26b6b'

  return (
    <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:'1.1rem', paddingBottom:'2rem' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <div style={{ ...neuInset({ width:42, height:42, borderRadius:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center' }) }}>
          <Award size={20} style={{ color:'#5b8af0' }} />
        </div>
        <div>
          <h1 style={{ fontSize:'1.35rem', fontWeight:800, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif', letterSpacing:'-.02em' }}>My Analytics</h1>
          <p style={{ fontSize:'0.75rem', color:'var(--neu-text-ghost)' }}>Performance breakdown — {user?.full_name}</p>
        </div>
      </div>

      {/* Top row — Score ring + Rank tiles + Trend */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'1rem' }}>

        {/* Score Ring card */}
        <div style={{ ...neu({ padding:'1.4rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', minWidth:170 }) }}>
          <Ring pct={score} color={scoreColor} />
          <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textAlign:'center' }}>Academic Score</p>
          <div style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <TrendIcon size={14} style={{ color:trendColor }} />
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:trendColor, textTransform:'capitalize' }}>{trend}</span>
          </div>
          <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'0.2rem 0.65rem',
            background: data.engagement_level === 'high' ? 'rgba(62,207,142,0.12)' : data.engagement_level === 'medium' ? 'rgba(91,138,240,0.12)' : 'rgba(242,107,107,0.12)',
            color: engColor, borderRadius:'0.5rem', textTransform:'capitalize'
          }}>
            {data.engagement_level} engagement
          </span>
        </div>

        {/* Rank + Improvement tiles */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:'0.75rem' }}>
          {[
            { label:'Class Rank',    value: classRank   ? `#${classRank}`   : '—', color:'#f59e0b' },
            { label:'Section Rank',  value: sectionRank ? `#${sectionRank}` : '—', color:'#a78bfa' },
            { label:'Improvement',   value: improvement != null ? `${Math.round(improvement)}` : '—', color:'#3ecf8e', sub: improvement != null ? (improvement > 50 ? 'Above avg' : improvement < 50 ? 'Below avg' : 'Neutral') : '' },
            { label:'Risk Level',    value: risk.level ? risk.level.toUpperCase() : 'LOW',
              color: risk.level === 'high' ? '#f26b6b' : risk.level === 'medium' ? '#f97316' : '#3ecf8e' },
          ].map(t => (
            <div key={t.label} style={{ ...neuInset({ borderRadius:'1rem', padding:'0.85rem 1rem' }), display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em' }}>{t.label}</p>
              <p style={{ fontSize:'1.45rem', fontWeight:900, color:t.color, fontFamily:'Outfit,sans-serif', lineHeight:1.1 }}>{t.value}</p>
              {t.sub && <p style={{ fontSize:'0.62rem', color:'var(--neu-text-ghost)' }}>{t.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

        {/* Radar */}
        <div style={{ ...neu({ padding:'1.25rem' }) }}>
          <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'0.85rem' }}>Score Radar</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top:5, right:20, bottom:5, left:20 }}>
              <PolarGrid stroke="var(--neu-border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--neu-text-ghost)', fontSize:10 }} />
              <Radar name="Score" dataKey="A" stroke="#5b8af0" fill="#5b8af0" fillOpacity={0.18} strokeWidth={2} dot={{ fill:'#5b8af0', r:3 }} />
              <Tooltip contentStyle={{ background:'var(--neu-surface)', border:'1px solid var(--neu-border)', borderRadius:'0.6rem', fontSize:'0.75rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar breakdown */}
        <div style={{ ...neu({ padding:'1.25rem' }) }}>
          <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'0.85rem' }}>Component Scores</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top:5, right:5, bottom:5, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:'var(--neu-text-ghost)', fontSize:9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill:'var(--neu-text-ghost)', fontSize:9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--neu-surface)', border:'1px solid var(--neu-border)', borderRadius:'0.6rem', fontSize:'0.75rem' }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Component detail list */}
      <div style={{ ...neu({ padding:'1.25rem' }) }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'1rem' }}>Detailed Breakdown</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
          {COMPONENT_META.map(m => {
            const val = Math.round(bd[m.key] || 0)
            const Icon = m.icon
            return (
              <div key={m.key} style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                <div style={{ ...neuInset({ width:34, height:34, borderRadius:'0.7rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }) }}>
                  <Icon size={14} style={{ color:m.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                    <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--neu-text-primary)' }}>{m.label}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ fontSize:'0.62rem', fontWeight:600, color:'var(--neu-text-ghost)' }}>weight {m.weight}</span>
                      <span style={{ fontSize:'0.8rem', fontWeight:800, color:m.color, fontFamily:'Outfit,sans-serif', minWidth:30, textAlign:'right' }}>{val}</span>
                    </div>
                  </div>
                  <div style={{ height:6, background:'var(--neu-surface-deep)', borderRadius:99, overflow:'hidden', boxShadow:'inset 2px 2px 4px var(--neu-shadow-dark)' }}>
                    <div style={{ height:'100%', width:`${Math.min(val,100)}%`, background:m.color, borderRadius:99, transition:'width 0.9s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Risk factors + Recommendations row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

        {/* Risk factors */}
        <div style={{ ...neu({ padding:'1.25rem' }) }}>
          <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'0.85rem' }}>Risk Factors</p>
          {risk.factors?.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {risk.factors.map((f, i) => (
                <div key={i} style={{ ...neuInset({ borderRadius:'0.75rem', padding:'0.6rem 0.85rem' }), display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ fontSize:'0.75rem', color:'#f97316' }}>⚠</span>
                  <span style={{ fontSize:'0.78rem', color:'var(--neu-text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'1rem', color:'var(--neu-text-ghost)' }}>
              <p style={{ fontSize:'1.5rem', marginBottom:'0.3rem' }}>✅</p>
              <p style={{ fontSize:'0.78rem', fontWeight:600 }}>No risk factors!</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div style={{ ...neu({ padding:'1.25rem' }) }}>
          <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'0.85rem' }}>Recommendations</p>
          {recs.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {recs.map((r, i) => {
                const priorityColor = r.priority === 'high' ? '#f26b6b' : r.priority === 'medium' ? '#f59e0b' : '#3ecf8e'
                return (
                  <div key={i} style={{ ...neuInset({ borderRadius:'0.75rem', padding:'0.6rem 0.85rem' }), borderLeft:`3px solid ${priorityColor}` }}>
                    <p style={{ fontSize:'0.75rem', color:'var(--neu-text-secondary)', lineHeight:1.5 }}>{r.message || r}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'1rem', color:'var(--neu-text-ghost)' }}>
              <p style={{ fontSize:'0.78rem' }}>No recommendations</p>
            </div>
          )}
        </div>
      </div>

      {/* Weak subjects */}
      {weak.length > 0 && (
        <div style={{ ...neu({ padding:'1.25rem' }) }}>
          <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'0.85rem' }}>Weak Subjects</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'0.6rem' }}>
            {weak.map((w, i) => (
              <div key={i} style={{ ...neuInset({ borderRadius:'0.875rem', padding:'0.75rem 1rem' }) }}>
                <p style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--neu-text-primary)' }}>{w.course}</p>
                <p style={{ fontSize:'0.7rem', color:'var(--neu-text-ghost)', marginTop:'0.15rem' }}>{w.code}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.5rem' }}>
                  <span style={{ fontSize:'0.7rem', color:'#f26b6b', fontWeight:700 }}>{w.attendance?.toFixed(1)}%</span>
                  <span style={{ fontSize:'0.65rem', color:'var(--neu-text-ghost)' }}>attendance</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}