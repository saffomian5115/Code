// ═══════════════════════════════════════════════════════════════
//  ResultsPage.jsx  —  Neumorphic + Right-click Context Menu
//  Replace: frontend/src/pages/teacher/ResultsPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trophy, Eye, Trash2, Loader2,
  X, Users, Award, BarChart2, Hash, CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

// ── Shared styles ─────────────────────────────────────────────
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})

const inputStyle = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.75rem',
  padding: '0.6rem 0.9rem',
  fontSize: '0.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

const thStyle = {
  textAlign: 'left', padding: '0.7rem 1rem',
  fontSize: '0.68rem', fontWeight: 700,
  color: 'var(--neu-text-ghost)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid var(--neu-border)',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.82rem',
  color: 'var(--neu-text-secondary)',
  borderBottom: '1px solid var(--neu-border-inner)',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

function NeuBtn({ onClick, disabled, loading: isLoading, accent = '#5b8af0', children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled || isLoading}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.6rem 1.2rem', borderRadius: '0.875rem', border: 'none',
        background: `linear-gradient(145deg, ${accent}ee, ${accent}bb)`,
        boxShadow: `4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)`,
        color: '#fff', fontSize: '0.8rem', fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'transform 0.14s',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
    >
      {isLoading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  )
}

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.6)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: wide ? 800 : 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--neu-raised-lg)' }}>
        {children}
      </div>
    </div>
  )
}

const TYPE_CFG = {
  midterm: { emoji: '📋', color: '#5b8af0', bg: 'rgba(91,138,240,0.12)' },
  final:   { emoji: '🏆', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  special: { emoji: '⭐', color: '#f5a623', bg: 'rgba(245,166,35,0.12)'  },
}

// ── Create Exam Modal ─────────────────────────────────────────
function CreateExamModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', exam_type: 'midterm', total_marks: 50, passing_marks: 25, exam_date: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setLoading(true)
    try {
      await teacherAPI.createExam(offeringId, form)
      toast.success('Exam created!'); onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Create Exam</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <Field label="Exam Title *"><input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="e.g., Midterm Exam" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Type">
            <select value={form.exam_type} onChange={e => set('exam_type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="special">Special</option>
            </select>
          </Field>
          <Field label="Exam Date"><input type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} style={inputStyle} /></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} min={1} style={inputStyle} /></Field>
          <Field label="Passing Marks"><input type="number" value={form.passing_marks} onChange={e => set('passing_marks', e.target.value)} min={0} style={inputStyle} /></Field>
        </div>
      </div>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleSubmit} loading={loading} accent='#a78bfa'><Trophy size={14} /> Create Exam</NeuBtn>
      </div>
    </Modal>
  )
}

// ── Enter Results Modal ───────────────────────────────────────
function EnterResultsModal({ exam, onClose, onSuccess }) {
  const [students, setStudents] = useState([])
  const [results, setResults] = useState({}) // { student_id: { marks, remarks } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      teacherAPI.getOfferingStudents(exam.offering_id),
      teacherAPI.getExamResults(exam.id).catch(() => ({ data: { data: { results: [] } } })),
    ]).then(([studsRes, resultsRes]) => {
      const studs = studsRes.data.data?.students || []
      const existingResults = resultsRes.data.data?.results || []
      setStudents(studs)
      const init = {}
      studs.forEach(s => {
        const ex = existingResults.find(r => r.student_id === s.student_id)
        init[s.student_id] = { marks: ex?.marks_obtained || '', remarks: ex?.remarks || '' }
      })
      setResults(init)
    })
    .catch(() => toast.error('Failed to load data'))
    .finally(() => setLoading(false))
  }, [exam.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        marks_obtained: parseFloat(results[s.student_id]?.marks) || 0,
        remarks: results[s.student_id]?.remarks || '',
      }))
      await teacherAPI.enterExamResults(exam.id, { results: records })
      toast.success('Results saved!'); onSuccess(); onClose()
    } catch { toast.error('Failed to save results') }
    finally { setSaving(false) }
  }

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{exam.title} — Enter Results</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>Total Marks: {exam.total_marks}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Loader2 size={24} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Student', 'Roll No', `Marks /${exam.total_marks}`, 'Remarks'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.student_id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ transition: 'background 0.12s' }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{s.full_name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.roll_number}</td>
                    <td style={tdStyle}>
                      <input type="number" min={0} max={exam.total_marks}
                        value={results[s.student_id]?.marks || ''}
                        onChange={e => setResults(p => ({ ...p, [s.student_id]: { ...p[s.student_id], marks: e.target.value } }))}
                        style={{ ...inputStyle, width: 90, padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input type="text"
                        value={results[s.student_id]?.remarks || ''}
                        onChange={e => setResults(p => ({ ...p, [s.student_id]: { ...p[s.student_id], remarks: e.target.value } }))}
                        placeholder="Optional"
                        style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleSave} loading={saving} accent='#a78bfa'><Trophy size={14} /> Save Results</NeuBtn>
      </div>
    </Modal>
  )
}

// ── Exam Card ─────────────────────────────────────────────────
function ExamCard({ exam, onRightClick, onEnterResults }) {
  const [hovered, setHovered] = useState(false)
  const cfg = TYPE_CFG[exam.exam_type] || TYPE_CFG.midterm

  return (
    <div
      onContextMenu={e => onRightClick(e, exam)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...neu({ padding: '1.1rem 1.25rem', position: 'relative', cursor: 'context-menu' }),
        transition: 'transform 0.18s, box-shadow 0.18s',
        transform: hovered ? 'translateY(-2px)' : '',
        boxShadow: hovered ? '12px 12px 28px var(--neu-shadow-dark), -8px -8px 18px var(--neu-shadow-light)' : 'var(--neu-raised)',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
        background: cfg.bg, fontSize: '1.35rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)',
      }}>
        {cfg.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{exam.title}</h3>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: cfg.bg, color: cfg.color, borderRadius: '0.35rem', textTransform: 'capitalize' }}>
            {exam.exam_type}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.71rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Hash size={11} />{exam.total_marks} marks · Pass: {exam.passing_marks}
          </span>
          {exam.results_count > 0 && (
            <span style={{ fontSize: '0.71rem', color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle size={11} />{exam.results_count} results entered
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onEnterResults(exam)}
        style={{
          padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none',
          background: cfg.bg, color: cfg.color,
          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontFamily: "'DM Sans', sans-serif", flexShrink: 0, whiteSpace: 'nowrap',
        }}>
        <Award size={13} /> Enter Results
      </button>
      <span style={{ position: 'absolute', bottom: '0.4rem', right: '0.6rem', fontSize: '0.55rem', color: 'var(--neu-text-ghost)', opacity: 0.35 }}>⊞</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ResultsPage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [enterResults, setEnterResults] = useState(null)
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
  }, [])

  const fetchExams = useCallback(async () => {
    if (!selectedOffering) return
    setLoading(true)
    try {
      const res = await teacherAPI.getOfferingExams(selectedOffering)
      setExams(res.data.data?.exams || [])
    } catch { toast.error('Failed to load exams') }
    finally { setLoading(false) }
  }, [selectedOffering])

  useEffect(() => { fetchExams() }, [selectedOffering])

  const ctxItems = (exam) => [
    { label: 'Enter Results', icon: Award, onClick: e => setEnterResults(e) },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: async (e) => {
      if (!confirm('Delete this exam?')) return
      try { await teacherAPI.deleteExam(e.id); toast.success('Deleted'); fetchExams() }
      catch { toast.error('Failed to delete') }
    }},
  ]

  const selectStyle = {
    background: 'var(--neu-surface-deep)',
    boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
    border: '1px solid var(--neu-border)',
    borderRadius: '0.75rem', padding: '0.6rem 0.9rem',
    fontSize: '0.85rem', color: 'var(--neu-text-primary)', outline: 'none',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", minWidth: 260,
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>Results & Exams</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>{exams.length} exams created</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={selectStyle}>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          <NeuBtn onClick={() => setShowCreate(true)} disabled={!offerings.length} accent='#a78bfa'><Plus size={14} /> Add Exam</NeuBtn>
        </div>
      </div>

      {/* Exam list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : exams.length === 0 ? (
        <div style={{ ...neu({ padding: '3.5rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
            <Trophy size={24} style={{ color: '#a78bfa' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.93rem' }}>No exams yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Add your first exam to start entering results</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {exams.map(e => (
            <ExamCard key={e.id} exam={e} onRightClick={openMenu} onEnterResults={setEnterResults} />
          ))}
        </div>
      )}

      {showCreate && <CreateExamModal offeringId={selectedOffering} onClose={() => setShowCreate(false)} onSuccess={fetchExams} />}
      {enterResults && <EnterResultsModal exam={enterResults} onClose={() => setEnterResults(null)} onSuccess={fetchExams} />}
      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}