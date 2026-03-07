// ═══════════════════════════════════════════════════════════════
//  TeacherDashboard.jsx  —  frontend/src/pages/teacher/TeacherDashboard.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Users, ClipboardCheck, AlertTriangle,
  FileText, PenSquare, BarChart3, Bell, MessageSquare,
  ChevronRight, Calendar, Layers, ArrowRight, BookMarked, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { teacherAPI } from '../../api/teacher.api'
import { authStore } from '../../store/authStore'

/* ─── helpers ────────────────────────────────────── */
const PRIORITY_CFG = {
  urgent: { c:'#ef4444', bg:'rgba(239,68,68,.09)',   label:'Urgent' },
  high:   { c:'#f97316', bg:'rgba(249,115,22,.09)',  label:'High'   },
  normal: { c:'#5b8af0', bg:'rgba(91,138,240,.09)',  label:'Normal' },
  low:    { c:'#94a3b8', bg:'rgba(148,163,184,.09)', label:'Low'    },
}
const COURSE_COLORS = ['#5b8af0','#a78bfa','#34d399','#f59e0b','#f87171','#38bdf8','#fb923c']

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

/* ═══════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════ */
export default function TeacherDashboard() {
  const user     = authStore.getUser()
  const navigate = useNavigate()

  const [offerings,     setOfferings]     = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [allData,       setAllData]       = useState(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [offRes, annRes] = await Promise.all([
          teacherAPI.getMyOfferings(),
          teacherAPI.getAnnouncements(1),
        ])
        const offs = offRes.data.data?.offerings || []
        setOfferings(offs)
        setAnnouncements((annRes.data.data?.announcements || []).slice(0, 5))

        if (offs.length > 0) {
          const settled = await Promise.allSettled(
            offs.map(o => Promise.all([
              teacherAPI.getOfferingAssignments(o.id).catch(() => ({ data:{ data:{ assignments:[] } } })),
              teacherAPI.getOfferingQuizzes(o.id).catch(()   => ({ data:{ data:{ quizzes:[] }     } })),
              teacherAPI.getShortAttendance(o.id).catch(()   => ({ data:{ data:{ students:[] }    } })),
              teacherAPI.getOfferingSessions(o.id).catch(()  => ({ data:{ data:{ sessions:[] }    } })),
            ]))
          )
          let totalAssignments=0, pendingGrading=0, totalQuizzes=0, shortStudents=0, totalSessions=0
          const offeringDetails = []
          settled.forEach((res, i) => {
            if (res.status !== 'fulfilled') return
            const [aR, qR, sR, sesR] = res.value
            const assignments = aR.data?.data?.assignments || []
            const quizzes     = qR.data?.data?.quizzes     || []
            const short       = sR.data?.data?.students    || []
            const sessions    = sesR.data?.data?.sessions  || []
            totalAssignments += assignments.length
            pendingGrading   += assignments.filter(a => a.pending_count > 0).length
            totalQuizzes     += quizzes.length
            shortStudents    += short.length
            totalSessions    += sessions.length
            offeringDetails.push({
              id: offs[i].id, name: offs[i].course_name,
              code: offs[i].course_code || '', section: offs[i].section || '',
              enrolled: offs[i].enrolled_count || 0,
              shortCount: short.length, sessionCount: sessions.length,
            })
          })
          setAllData({ totalAssignments, pendingGrading, totalQuizzes, shortStudents, totalSessions, offeringDetails })
        }
      } catch { toast.error('Failed to load dashboard') }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:'1rem' }}>
      <Loader2 size={30} style={{ color:'#5b8af0', animation:'spin .8s linear infinite' }} />
      <p style={{ fontSize:'.82rem', color:'var(--neu-text-ghost)' }}>Loading dashboard…</p>
    </div>
  )

  const firstName     = user?.full_name?.split(' ')[0] || 'Teacher'
  const totalStudents  = offerings.reduce((s,o) => s + (o.enrolled_count||0), 0)
  const totalOfferings = offerings.length
  const {
    totalAssignments=0, pendingGrading=0, totalQuizzes=0,
    shortStudents=0, totalSessions=0, offeringDetails=[]
  } = allData || {}

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today    = new Date().toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long' })

  /* shared card wrapper */
  const cardSty = {
    background:'var(--neu-surface)', border:'1px solid var(--neu-border)',
    borderRadius:'1.2rem', padding:'1.2rem',
    boxShadow:'6px 6px 16px var(--neu-shadow-dark),-3px -3px 10px var(--neu-shadow-light)',
    minWidth:0,   /* prevent grid blowout */
    overflow:'hidden',
  }

  /* section header */
  const SH = ({ icon:Icon, title, sub, to }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.9rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
        <div style={{ width:27, height:27, borderRadius:'.55rem', background:'rgba(91,138,240,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={13} style={{ color:'#5b8af0' }} />
        </div>
        <div>
          <p style={{ fontSize:'.86rem', fontWeight:800, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif', lineHeight:1 }}>{title}</p>
          {sub && <p style={{ fontSize:'.63rem', color:'var(--neu-text-ghost)', marginTop:2 }}>{sub}</p>}
        </div>
      </div>
      {to && (
        <button onClick={() => navigate(to)} style={{ display:'flex', alignItems:'center', gap:3, background:'none', border:'none', color:'#5b8af0', fontSize:'.68rem', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
          View all<ArrowRight size={11} />
        </button>
      )}
    </div>
  )

  return (
    /* NO maxWidth, NO overflow — let DashboardLayout handle scrolling */
    <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem', paddingBottom:'2rem' }}>

      {/* ── Welcome Row ─────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem' }}>
        <div>
          <p style={{ fontSize:'.73rem', color:'var(--neu-text-ghost)', marginBottom:'.2rem' }}>{greeting} 👋</p>
          <h1 style={{ fontSize:'1.55rem', fontWeight:900, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif', letterSpacing:'-.03em', lineHeight:1 }}>{firstName}</h1>
          <p style={{ fontSize:'.7rem', color:'var(--neu-text-ghost)', marginTop:'.28rem', display:'flex', alignItems:'center', gap:4 }}>
            <Calendar size={11} style={{ color:'#5b8af0' }} />{today}
          </p>
        </div>
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          {[
            { label:'Mark Attendance', icon:ClipboardCheck, to:'/teacher/attendance', c:'#5b8af0' },
            { label:'Grade Work',      icon:FileText,        to:'/teacher/assignments', c:'#f59e0b' },
          ].map(b => (
            <button key={b.label} onClick={() => navigate(b.to)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'.5rem .95rem',
              borderRadius:'.8rem', border:'1px solid var(--neu-border)',
              background:'var(--neu-surface)',
              boxShadow:'4px 4px 10px var(--neu-shadow-dark),-2px -2px 6px var(--neu-shadow-light)',
              color:b.c, fontWeight:700, fontSize:'.76rem', cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", transition:'transform .18s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}>
              <b.icon size={13} />{b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row — 4 equal columns ───────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'.75rem' }}>
        {[
          { icon:BookOpen,       label:'My Courses',       value:totalOfferings, sub:'This semester',      accent:'#5b8af0', to:'/teacher/courses'    },
          { icon:Users,          label:'Total Students',   value:totalStudents,  sub:'Across all courses', accent:'#a78bfa', to:'/teacher/courses'    },
          { icon:ClipboardCheck, label:'Sessions Held',    value:totalSessions,  sub:'Lecture sessions',   accent:'#34d399', to:'/teacher/attendance' },
          { icon:AlertTriangle,  label:'Short Attendance', value:shortStudents,  sub:'Below 75%',
            accent:shortStudents>0?'#ef4444':'#94a3b8', to:'/teacher/attendance', pulse:shortStudents>0 },
        ].map(k => (
          <div key={k.label} onClick={() => navigate(k.to)} style={{
            ...cardSty, cursor:'pointer', transition:'transform .2s',
            borderLeft:`3px solid ${k.accent}`,
            display:'flex', flexDirection:'column', gap:'.38rem', padding:'.95rem 1rem',
          }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform=''}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:32, height:32, borderRadius:'.65rem', background:`${k.accent}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <k.icon size={15} style={{ color:k.accent }} />
              </div>
              {k.pulse && <span style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 6px #ef4444' }} />}
            </div>
            <p style={{ fontSize:'1.8rem', fontWeight:900, color:k.accent, fontFamily:'Outfit,sans-serif', lineHeight:1 }}>{k.value}</p>
            <p style={{ fontSize:'.78rem', fontWeight:700, color:'var(--neu-text-primary)' }}>{k.label}</p>
            <p style={{ fontSize:'.65rem', color:'var(--neu-text-ghost)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2 — 2 equal columns ─────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'.85rem' }}>

        {/* My Courses list */}
        <div style={cardSty}>
          <SH icon={Layers} title="My Courses" sub={`${totalOfferings} active`} to="/teacher/courses" />
          {offeringDetails.length === 0 ? (
            <div style={{ padding:'2.5rem', textAlign:'center' }}>
              <BookOpen size={26} style={{ color:'var(--neu-text-ghost)', opacity:.15, display:'block', margin:'0 auto .6rem' }} />
              <p style={{ fontSize:'.78rem', color:'var(--neu-text-secondary)', fontWeight:600 }}>No courses assigned yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'.12rem' }}>
              {offeringDetails.map((o, i) => {
                const accent = COURSE_COLORS[i % COURSE_COLORS.length]
                return (
                  <div key={o.id} onClick={() => navigate('/teacher/courses')} style={{
                    display:'flex', alignItems:'center', gap:'.7rem',
                    padding:'.58rem .7rem', borderRadius:'.75rem',
                    border:'1px solid transparent', cursor:'pointer',
                    transition:'background .14s,border-color .14s,transform .18s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--neu-surface-deep)'; e.currentTarget.style.borderColor='var(--neu-border)'; e.currentTarget.style.transform='translateX(3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.transform='' }}>
                    <div style={{ width:32, height:32, borderRadius:'.6rem', background:`${accent}18`, border:`1px solid ${accent}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'.68rem', fontWeight:800, color:accent, fontFamily:'Outfit,sans-serif' }}>
                        {(o.code||o.name||'?').slice(0,3).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'.8rem', fontWeight:700, color:'var(--neu-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.name}</p>
                      <p style={{ fontSize:'.61rem', color:'var(--neu-text-ghost)', marginTop:1 }}>
                        Sec {o.section||'—'} · {o.enrolled} students · {o.sessionCount} sessions
                      </p>
                    </div>
                    {o.shortCount > 0 && (
                      <span style={{ fontSize:'.58rem', fontWeight:800, padding:'.13rem .42rem', background:'rgba(239,68,68,.1)', color:'#ef4444', borderRadius:'.33rem', border:'1px solid rgba(239,68,68,.2)', flexShrink:0, whiteSpace:'nowrap' }}>
                        {o.shortCount} short
                      </span>
                    )}
                    <ChevronRight size={12} style={{ color:'var(--neu-text-ghost)', opacity:.35, flexShrink:0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div style={cardSty}>
          <SH icon={ClipboardCheck} title="Pending Tasks" sub="Needs your attention" />
          <div style={{ display:'flex', flexDirection:'column', gap:'.48rem' }}>
            {[
              { icon:FileText,   label:'Assignments to Grade', value:pendingGrading,    to:'/teacher/assignments', accent:pendingGrading>0?'#f59e0b':'#94a3b8',  urgent:pendingGrading>0 },
              { icon:PenSquare,  label:'Active Quizzes',        value:totalQuizzes,     to:'/teacher/quizzes',     accent:'#a78bfa',                              urgent:false            },
              { icon:Users,      label:'Short Attendance',      value:shortStudents,    to:'/teacher/attendance',  accent:shortStudents>0?'#ef4444':'#94a3b8',    urgent:shortStudents>0  },
              { icon:BookMarked, label:'Total Assignments',      value:totalAssignments, to:'/teacher/assignments', accent:'#5b8af0',                              urgent:false            },
            ].map(t => (
              <div key={t.label} onClick={() => navigate(t.to)} style={{
                display:'flex', alignItems:'center', gap:'.65rem', padding:'.58rem .75rem',
                borderRadius:'.78rem', border:'1px solid var(--neu-border)',
                background:'var(--neu-surface-deep)',
                boxShadow:'inset 2px 2px 5px var(--neu-shadow-dark),inset -1px -1px 4px var(--neu-shadow-light)',
                cursor:'pointer', transition:'transform .16s,box-shadow .16s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateX(3px)'; e.currentTarget.style.boxShadow='3px 3px 8px var(--neu-shadow-dark)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='inset 2px 2px 5px var(--neu-shadow-dark),inset -1px -1px 4px var(--neu-shadow-light)' }}>
                <div style={{ width:29, height:29, borderRadius:'.58rem', background:`${t.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <t.icon size={12} style={{ color:t.accent }} />
                </div>
                <p style={{ flex:1, fontSize:'.78rem', fontWeight:600, color:'var(--neu-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.label}</p>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                  <span style={{ fontSize:'1rem', fontWeight:900, color:t.accent, fontFamily:'Outfit,sans-serif' }}>{t.value}</span>
                  {t.urgent && t.value>0 && <span style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 5px #ef4444' }} />}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.45rem', marginTop:'.85rem', paddingTop:'.85rem', borderTop:'1px solid var(--neu-border)' }}>
            {[
              { label:'New Session', icon:ClipboardCheck, to:'/teacher/attendance', c:'#5b8af0' },
              { label:'Create Quiz', icon:PenSquare,       to:'/teacher/quizzes',    c:'#a78bfa' },
            ].map(b => (
              <button key={b.label} onClick={() => navigate(b.to)} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                padding:'.52rem', borderRadius:'.68rem',
                border:`1px solid ${b.c}30`, background:`${b.c}0f`,
                color:b.c, fontWeight:700, fontSize:'.73rem', cursor:'pointer',
                transition:'background .15s', fontFamily:"'DM Sans',sans-serif",
              }}
                onMouseEnter={e => e.currentTarget.style.background=`${b.c}1c`}
                onMouseLeave={e => e.currentTarget.style.background=`${b.c}0f`}>
                <b.icon size={12} />{b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3 — announcements + quick nav ────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'.85rem' }}>

        {/* Announcements */}
        <div style={cardSty}>
          <SH icon={Bell} title="Announcements" sub="Recent notices" to="/teacher/announcements" />
          {announcements.length === 0 ? (
            <div style={{ padding:'2.5rem', textAlign:'center' }}>
              <Bell size={24} style={{ color:'var(--neu-text-ghost)', opacity:.15, display:'block', margin:'0 auto .6rem' }} />
              <p style={{ fontSize:'.78rem', color:'var(--neu-text-secondary)', fontWeight:600 }}>No announcements yet</p>
            </div>
          ) : announcements.map((ann, idx) => {
            const pc = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.normal
            const isLast = idx === announcements.length - 1
            return (
              <div key={ann.id} style={{ display:'flex', alignItems:'flex-start', gap:'.6rem', padding:'.58rem 0', borderBottom: isLast ? 'none' : '1px solid var(--neu-border)' }}>
                <div style={{ width:28, height:28, borderRadius:'.52rem', background:pc.bg, border:`1px solid ${pc.c}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                  <Bell size={11} style={{ color:pc.c }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                    <p style={{ fontSize:'.78rem', fontWeight:700, color:'var(--neu-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ann.title}</p>
                    <span style={{ fontSize:'.56rem', fontWeight:800, padding:'.1rem .38rem', borderRadius:'.3rem', background:pc.bg, color:pc.c, flexShrink:0, textTransform:'capitalize' }}>{pc.label}</span>
                  </div>
                  <p style={{ fontSize:'.68rem', color:'var(--neu-text-ghost)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ann.content}</p>
                </div>
                <span style={{ fontSize:'.58rem', color:'var(--neu-text-ghost)', flexShrink:0, marginLeft:4, marginTop:3, whiteSpace:'nowrap' }}>{timeAgo(ann.created_at)}</span>
              </div>
            )
          })}
        </div>

        {/* Quick Nav — 3×2 grid */}
        <div style={cardSty}>
          <SH icon={Layers} title="Quick Navigation" sub="Jump to any section" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'.5rem' }}>
            {[
              { label:'Attendance',  icon:ClipboardCheck, to:'/teacher/attendance',    c:'#5b8af0' },
              { label:'Assignments', icon:FileText,        to:'/teacher/assignments',   c:'#f59e0b' },
              { label:'Quizzes',     icon:PenSquare,       to:'/teacher/quizzes',       c:'#a78bfa' },
              { label:'Results',     icon:BarChart3,       to:'/teacher/results',       c:'#34d399' },
              { label:'Announce',    icon:Bell,            to:'/teacher/announcements', c:'#f87171' },
              { label:'Chat',        icon:MessageSquare,   to:'/teacher/chat',          c:'#38bdf8' },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.to)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:'.38rem',
                padding:'.8rem .3rem', borderRadius:'.9rem',
                border:'1px solid var(--neu-border)', background:'var(--neu-surface)',
                boxShadow:'4px 4px 10px var(--neu-shadow-dark),-2px -2px 6px var(--neu-shadow-light)',
                cursor:'pointer', transition:'transform .18s,box-shadow .18s',
                fontFamily:"'DM Sans',sans-serif",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='5px 7px 14px var(--neu-shadow-dark),-2px -2px 6px var(--neu-shadow-light)' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='4px 4px 10px var(--neu-shadow-dark),-2px -2px 6px var(--neu-shadow-light)' }}>
                <div style={{ width:32, height:32, borderRadius:'.65rem', background:`${item.c}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <item.icon size={14} style={{ color:item.c }} />
                </div>
                <span style={{ fontSize:'.65rem', fontWeight:700, color:'var(--neu-text-secondary)', textAlign:'center', lineHeight:1.2 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}