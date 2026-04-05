// ═══════════════════════════════════════════════════════════════
//  MyCoursesPage.jsx (Student) — Clean Course Detail Modal with 3 Tabs
//  Click on card → opens inline modal with CLOs, Syllabus, Schedule tabs
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen, Search, GraduationCap, Clock,
  Hash, Layers, X, Target, MapPin, Users,
  Award, Code2, Calendar, Mail, FileText,
  ChevronDown, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'

/* ─── CSS injected once ──────────────────────────── */
const CSS = `
  .course-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .course-card:hover {
    transform: translateY(-2px);
    box-shadow: 8px 12px 24px var(--neu-shadow-dark), -4px -4px 12px var(--neu-shadow-light);
  }

  @keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modal-in { 
    from { opacity: 0; transform: translateY(20px) scale(0.96); } 
    to { opacity: 1; transform: translateY(0) scale(1); } 
  }
  @keyframes fadeUp { 
    from { opacity: 0; transform: translateY(10px); } 
    to { opacity: 1; transform: none; } 
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`

const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.08)', ring: 'rgba(91,138,240,.25)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.08)', ring: 'rgba(155,89,182,.25)' },
  { c: '#22a06b', bg: 'rgba(34,160,107,.08)', ring: 'rgba(34,160,107,.25)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.08)', ring: 'rgba(249,115,22,.25)' },
  { c: '#ef4444', bg: 'rgba(239,68,68,.08)',  ring: 'rgba(239,68,68,.25)' },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.08)', ring: 'rgba(245,158,11,.25)' },
]

const DOMAIN_COLOR = { cognitive: '#5b8af0', psychomotor: '#22a06b', affective: '#9b59b6' }
const DOMAIN_ICON = { cognitive: Brain, psychomotor: Code2, affective: Sparkles }

const BLOOM_COLOR = {
  1: '#94a3b8', 2: '#5b8af0', 3: '#22a06b',
  4: '#f59e0b', 5: '#f97316', 6: '#ef4444',
}
const BLOOM_LABEL = {
  1: 'Remember', 2: 'Understand', 3: 'Apply',
  4: 'Analyze', 5: 'Evaluate', 6: 'Create',
}

// Need these imports for the icons above
import { Brain, Sparkles } from 'lucide-react'

/* ─── Skeleton card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--neu-surface)', border: '1px solid var(--neu-border)',
      borderRadius: '1rem', padding: '1.2rem',
      boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ width: 60, height: 20, borderRadius: '0.3rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 50, height: 20, borderRadius: '0.3rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 18, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '80%', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════
   CLEAN COURSE DETAIL MODAL WITH 3 TABS
══════════════════════════════════════════════════ */
function CourseDetailModal({ enr, pal, onClose }) {
  const [offering, setOffering] = useState(null)
  const [clos, setClos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clos')
  const [closExpanded, setClosExpanded] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const offRes = await studentAPI.getOffering(enr.offering_id)
        const offData = offRes.data.data
        setOffering(offData)
        if (offData?.course?.id) {
          const closRes = await studentAPI.getCourseCLOs(offData.course.id)
          setClos(closRes.data.data?.clos || [])
        }
      } catch {
        toast.error('Failed to load course details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [enr.offering_id])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleClo = (id) => setClosExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const course = offering?.course || {}
  const semester = offering?.semester || {}
  const instructor = offering?.instructor || {}
  const acc = pal.c

  const tabs = [
    { id: 'clos', label: `CLOs (${clos.length})`, icon: Target },
    { id: 'syllabus', label: 'Syllabus', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ]

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'overlay-in 0.2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 600,
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--neu-surface)',
          border: `1px solid ${acc}30`,
          borderRadius: '1.25rem',
          boxShadow: `0 20px 40px -12px rgba(0,0,0,0.4), 0 0 0 1px ${acc}15`,
          overflow: 'hidden',
          animation: 'modal-in 0.25s ease both',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${acc}20`,
          background: `linear-gradient(135deg, ${acc}06 0%, transparent 100%)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
                  background: `${acc}12`, color: acc,
                  fontFamily: 'monospace',
                }}>
                  {enr.course_code || course.code || '—'}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600,
                  padding: '0.15rem 0.5rem', borderRadius: '0.35rem',
                  background: enr.is_approved ? 'rgba(34,160,107,.12)' : 'rgba(245,166,35,.12)',
                  color: enr.is_approved ? '#22a06b' : '#f5a623',
                }}>
                  {enr.is_approved ? 'Enrolled' : 'Pending'}
                </span>
                {course.is_elective && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    padding: '0.15rem 0.5rem', borderRadius: '0.35rem',
                    background: 'rgba(155,89,182,.12)', color: '#9b59b6',
                  }}>Elective</span>
                )}
              </div>
              <h2 style={{
                fontSize: '1.2rem', fontWeight: 700,
                color: 'var(--neu-text-primary)',
                margin: '0.25rem 0 0.2rem',
                lineHeight: 1.3,
              }}>
                {enr.course_name || course.name || 'Course Details'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-muted)' }}>
                Section {offering?.section || enr.section || '—'} · {semester.name || '—'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: '0.5rem', border: 'none',
                background: 'var(--neu-surface-deep)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--neu-text-muted)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${acc}12`; e.currentTarget.style.color = acc }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--neu-surface-deep)'; e.currentTarget.style.color = 'var(--neu-text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Instructor quick info */}
          {(instructor.name || enr.instructor) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${acc}15` }}>
              <GraduationCap size={14} style={{ color: acc }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--neu-text-secondary)' }}>
                {instructor.name || enr.instructor}
              </span>
              {instructor.email && (
                <>
                  <span style={{ color: 'var(--neu-border)' }}>•</span>
                  <Mail size={12} style={{ color: 'var(--neu-text-muted)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-muted)' }}>{instructor.email}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem',
          padding: '0.5rem 1.5rem',
          borderBottom: '1px solid var(--neu-border)',
          background: 'var(--neu-surface-deep)',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 1rem', borderRadius: '0.6rem', border: 'none',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  transition: 'all 0.15s',
                  background: isActive ? `linear-gradient(135deg, ${acc}12, ${acc}06)` : 'transparent',
                  color: isActive ? acc : 'var(--neu-text-muted)',
                  borderBottom: isActive ? `2px solid ${acc}` : '2px solid transparent',
                }}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          scrollbarWidth: 'thin',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Loader2 size={28} style={{ color: acc, animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div key={activeTab} style={{ animation: 'fadeUp 0.2s ease both' }}>
              
              {/* CLOs TAB */}
              {activeTab === 'clos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {clos.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '3rem 1.5rem',
                      background: 'var(--neu-surface-deep)', borderRadius: '0.875rem',
                      border: '1px solid var(--neu-border)',
                    }}>
                      <Target size={32} style={{ color: 'var(--neu-text-muted)', opacity: 0.3, marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-secondary)' }}>No CLOs defined for this course</p>
                    </div>
                  ) : (
                    clos.map((clo, i) => {
                      const domainColor = DOMAIN_COLOR[clo.domain?.toLowerCase()] || acc
                      const bloomLevel = parseInt(clo.level)
                      const bloomColor = BLOOM_COLOR[bloomLevel] || acc
                      const isOpen = closExpanded[clo.id]
                      
                      return (
                        <div
                          key={clo.id}
                          style={{
                            borderRadius: '0.75rem',
                            background: 'var(--neu-surface)',
                            border: `1px solid ${isOpen ? domainColor + '25' : 'var(--neu-border)'}`,
                            overflow: 'hidden',
                            transition: 'border-color 0.2s',
                          }}
                        >
                          <div
                            onClick={() => toggleClo(clo.id)}
                            style={{
                              padding: '0.85rem 1rem',
                              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: '0.6rem', flexShrink: 0,
                              background: `${domainColor}15`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 700, color: domainColor,
                            }}>
                              {clo.clo_number}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{
                                fontSize: '0.85rem', fontWeight: 600, color: 'var(--neu-text-primary)',
                                lineHeight: 1.4, margin: 0,
                                display: '-webkit-box', WebkitLineClamp: isOpen ? 999 : 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              }}>
                                {clo.description}
                              </p>
                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                {clo.domain && (
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 600,
                                    padding: '0.15rem 0.45rem', borderRadius: '0.3rem',
                                    background: `${domainColor}12`, color: domainColor,
                                  }}>
                                    {clo.domain}
                                  </span>
                                )}
                                {bloomLevel && (
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 600,
                                    padding: '0.15rem 0.45rem', borderRadius: '0.3rem',
                                    background: `${bloomColor}12`, color: bloomColor,
                                  }}>
                                    Level {bloomLevel}: {BLOOM_LABEL[bloomLevel]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronDown
                              size={14}
                              style={{
                                color: 'var(--neu-text-muted)',
                                transition: 'transform 0.2s',
                                transform: isOpen ? 'rotate(180deg)' : 'none',
                              }}
                            />
                          </div>
                          {isOpen && (
                            <div style={{
                              padding: '0.75rem 1rem',
                              borderTop: '1px solid var(--neu-border)',
                              background: 'var(--neu-surface-deep)',
                            }}>
                              <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                {clo.description}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* SYLLABUS TAB */}
              {activeTab === 'syllabus' && (
                <div>
                  {course.syllabus ? (
                    <div style={{
                      padding: '1rem',
                      background: 'var(--neu-surface-deep)',
                      borderRadius: '0.875rem',
                      border: '1px solid var(--neu-border)',
                    }}>
                      <pre style={{
                        fontSize: '0.8rem', color: 'var(--neu-text-secondary)',
                        lineHeight: 1.7, whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit', margin: 0,
                      }}>
                        {course.syllabus}
                      </pre>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center', padding: '3rem 1.5rem',
                      background: 'var(--neu-surface-deep)', borderRadius: '0.875rem',
                      border: '1px solid var(--neu-border)',
                    }}>
                      <FileText size={32} style={{ color: 'var(--neu-text-muted)', opacity: 0.3, marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-secondary)' }}>No syllabus available</p>
                    </div>
                  )}
                </div>
              )}

              {/* SCHEDULE TAB */}
              {activeTab === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Room & Capacity */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {[
                      { icon: MapPin, label: 'Lecture Room', value: offering?.room_number ? `Room ${offering.room_number}` : 'Not assigned' },
                      { icon: Code2, label: 'Lab', value: offering?.lab_number ? `Lab ${offering.lab_number}` : 'Not assigned' },
                      { icon: Users, label: 'Capacity', value: offering?.max_students ? `${offering.enrolled_students || 0}/${offering.max_students}` : '—' },
                      { icon: Award, label: 'Credit Hours', value: course.credit_hours || enr.credit_hours || '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.75rem',
                        background: 'var(--neu-surface-deep)',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--neu-border)',
                      }}>
                        <Icon size={14} style={{ color: acc, opacity: 0.7 }} />
                        <div>
                          <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--neu-text-muted)', marginBottom: '0.1rem' }}>{label}</p>
                          <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--neu-text-primary)' }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly Schedule */}
                  {offering?.schedule && offering.schedule.length > 0 ? (
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--neu-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Weekly Schedule
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {offering.schedule.map((s, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--neu-surface-deep)',
                            borderRadius: '0.65rem',
                            border: '1px solid var(--neu-border)',
                          }}>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 600,
                              padding: '0.2rem 0.5rem', borderRadius: '0.35rem',
                              background: `${acc}12`, color: acc,
                              minWidth: 70, textAlign: 'center',
                            }}>
                              {s.day}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--neu-text-secondary)' }}>
                              {s.start_time} – {s.end_time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center', padding: '2rem 1.5rem',
                      background: 'var(--neu-surface-deep)', borderRadius: '0.875rem',
                      border: '1px solid var(--neu-border)',
                    }}>
                      <Calendar size={28} style={{ color: 'var(--neu-text-muted)', opacity: 0.3, marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-secondary)' }}>No schedule defined</p>
                    </div>
                  )}

                  {/* Online Meet Link */}
                  {offering?.online_meet_link && (
                    <a
                      href={offering.online_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.6rem 1rem', borderRadius: '0.75rem',
                        background: `${acc}08`, border: `1px solid ${acc}20`,
                        color: acc, fontSize: '0.8rem', fontWeight: 600,
                        textDecoration: 'none', textAlign: 'center',
                        transition: 'background 0.15s',
                        marginTop: '0.5rem',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = `${acc}12`}
                      onMouseLeave={e => e.currentTarget.style.background = `${acc}08`}
                    >
                      Join Online Class
                    </a>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Course Card ─────────────────────────────────── */
function CourseCard({ enr, pal, idx, onClick }) {
  const approved = enr.is_approved
  const code = enr.course_code || ''
  const name = enr.course_name || 'Unnamed Course'

  return (
    <div
      className="course-card"
      onClick={onClick}
      style={{ animationDelay: `${idx * 0.05}s`, animation: 'fadeUp 0.3s ease both' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: pal.c, opacity: 0.7 }} />

      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600,
            padding: '0.2rem 0.6rem', background: pal.bg,
            color: pal.c, borderRadius: '0.4rem',
            fontFamily: 'monospace',
          }}>
            {code || '—'}
          </span>
          <span style={{
            fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.35rem',
            background: approved ? 'rgba(34,160,107,.1)' : 'rgba(245,166,35,.1)',
            color: approved ? '#22a06b' : '#f5a623',
          }}>
            {approved ? 'Active' : 'Pending'}
          </span>
        </div>

        <h3 style={{
          fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)',
          margin: 0, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {name}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid var(--neu-border)' }}>
          {enr.instructor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GraduationCap size={11} style={{ color: pal.c }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-secondary)' }}>{enr.instructor}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {enr.section && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Hash size={10} style={{ color: pal.c }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-muted)' }}>Sec {enr.section}</span>
              </div>
            )}
            {enr.credit_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={10} style={{ color: pal.c }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-muted)' }}>{enr.credit_hours} cr</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailModal, setDetailModal] = useState(null)

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments(r.data.data?.enrollments || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return enrollments
    const q = search.toLowerCase()
    return enrollments.filter(e =>
      e.course_name?.toLowerCase().includes(q) ||
      e.course_code?.toLowerCase().includes(q) ||
      e.instructor?.toLowerCase().includes(q) ||
      e.section?.toLowerCase().includes(q)
    )
  }, [enrollments, search])

  const approved = enrollments.filter(e => e.is_approved)
  const pending = enrollments.filter(e => !e.is_approved)

  const inputStyle = {
    background: 'var(--neu-surface-deep)',
    boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
    border: '1px solid var(--neu-border)',
    borderRadius: '0.75rem', padding: '0.6rem 0.9rem 0.6rem 2.25rem',
    fontSize: '0.85rem', color: 'var(--neu-text-primary)', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        maxWidth: 1000, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        paddingBottom: '2rem',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '0.75rem',
                background: 'var(--neu-surface-deep)',
                boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Layers size={16} style={{ color: '#5b8af0' }} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--neu-text-primary)', margin: 0 }}>My Courses</h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-muted)', marginLeft: '0.2rem' }}>
              {loading ? 'Loading...' : `${enrollments.length} enrollment(s)`}
            </p>
          </div>

          {!loading && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '0.6rem',
                background: 'rgba(34,160,107,.1)', color: '#22a06b',
              }}>{approved.length} Active</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '0.6rem',
                background: 'rgba(245,166,35,.1)', color: '#f5a623',
              }}>{pending.length} Pending</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            style={inputStyle}
          />
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--neu-surface)', border: '1px solid var(--neu-border)',
            borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center',
          }}>
            <BookOpen size={32} style={{ color: 'var(--neu-text-muted)', margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-secondary)' }}>
              {search ? 'No matching courses' : 'No enrolled courses yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {filtered.map((enr, idx) => {
              const pal = PALETTE[idx % PALETTE.length]
              return (
                <CourseCard
                  key={enr.offering_id}
                  enr={enr}
                  pal={pal}
                  idx={idx}
                  onClick={() => setDetailModal({ enr, pal })}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {detailModal && (
        <CourseDetailModal
          enr={detailModal.enr}
          pal={detailModal.pal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </>
  )
}