// ═══════════════════════════════════════════════════════════════
//  ResultsPage.jsx  —  Teacher Results (Fully Fixed)
//  Replace: frontend/src/pages/teacher/ResultsPage.jsx
//
//  Fixes:
//  1. createExam — correct fields: weightage_percent (not passing_marks)
//  2. enterResults — correct field: obtained_marks (not marks_obtained)
//  3. offering_id preserved in exam objects for student loading
//  4. Delete exam — DELETE /exams/{id} call
//  5. Results load correctly — GET /exams/{id}/results
//  6. Left-click context menu (not right-click)
//  7. Beautiful card design with ring chart
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trophy, Loader2,
  X, Award, BarChart2, Hash, CheckCircle,
  AlertCircle, Trash2, Eye, Users, TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'
import api from '../../api/axios'
import AddButton from '../../components/ui/AddButton'


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

function NeuBtn({ onClick, disabled, loading: isLoading, accent = '#a78bfa', children, style = {} }) {
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
      onMouseEnter={e => { if (!disabled && !isLoading) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
    >
      {isLoading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  )
}

function Modal({ children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.6)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: wide ? 820 : 520, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--neu-raised-lg)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Ring Chart ────────────────────────────────────────────────
function RingChart({ value, total, size = 56 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(value / total, 1) : 0
  const dash = pct * circ
  const color = pct >= 0.8 ? '#3ecf8e' : pct >= 0.5 ? '#f5a623' : '#a78bfa'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neu-surface-deep)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--neu-text-ghost)', lineHeight: 1 }}>/{total}</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// CREATE EXAM MODAL
// Backend ExamCreateRequest: offering_id(URL), exam_type, title,
// total_marks, weightage_percent, exam_date?, start_time?, end_time?, room_number?
// ════════════════════════════════════════════════════════
function CreateExamModal({ offeringId, existingTypes, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    exam_type: 'midterm',
    total_marks: 50,
    weightage_percent: 30,   // ✅ correct field name
    exam_date: '',
    start_time: '',
    end_time: '',
    room_number: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // midterm/final can only be created once
  const isTypeTaken = (type) =>
    type !== 'special' && existingTypes.includes(type)

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (isTypeTaken(form.exam_type)) {
      toast.error(`${form.exam_type} exam already exists for this course`)
      return
    }

    setLoading(true)
    try {
      const payload = {
        exam_type:        form.exam_type,
        title:            form.title.trim(),
        total_marks:      parseInt(form.total_marks) || 50,
        weightage_percent: parseFloat(form.weightage_percent) || 0,  // ✅ correct
        offering_id:      parseInt(offeringId),
      }
      if (form.exam_date)   payload.exam_date   = form.exam_date
      if (form.start_time)  payload.start_time  = form.start_time
      if (form.end_time)    payload.end_time    = form.end_time
      if (form.room_number) payload.room_number = form.room_number

      await api.post(`/offerings/${offeringId}/exams`, payload)
      toast.success('Exam created!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam')
    } finally { setLoading(false) }
  }

  const TYPE_CFG = {
    midterm: { emoji: '📋', label: 'Midterm', color: '#5b8af0' },
    final:   { emoji: '🏆', label: 'Final',   color: '#a78bfa' },
    special: { emoji: '⭐', label: 'Special',  color: '#f5a623' },
  }

  return (
    <Modal>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Create Exam</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Exam type picker */}
        <Field label="Exam Type *">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Object.entries(TYPE_CFG).map(([type, cfg]) => {
              const taken = isTypeTaken(type)
              const active = form.exam_type === type
              return (
                <button key={type} onClick={() => !taken && set('exam_type', type)}
                  title={taken ? `${cfg.label} already exists` : ''}
                  style={{
                    flex: 1, padding: '0.65rem 0.5rem', borderRadius: '0.75rem',
                    border: active ? `2px solid ${cfg.color}` : '1px solid var(--neu-border)',
                    background: active ? `${cfg.color}12` : 'var(--neu-surface-deep)',
                    color: taken ? 'var(--neu-text-ghost)' : active ? cfg.color : 'var(--neu-text-secondary)',
                    cursor: taken ? 'not-allowed' : 'pointer',
                    opacity: taken ? 0.5 : 1,
                    fontWeight: 700, fontSize: '0.78rem',
                    fontFamily: "'DM Sans',sans-serif",
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: '1.2rem' }}>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                  {taken && <span style={{ fontSize: '0.6rem', color: '#f26b6b' }}>exists</span>}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Title *">
          <input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle}
            placeholder={`e.g., ${TYPE_CFG[form.exam_type]?.label} Examination`} autoFocus />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Total Marks *">
            <input type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} min={1} style={inputStyle} />
          </Field>
          <Field label="Weightage % *">
            <input type="number" value={form.weightage_percent} onChange={e => set('weightage_percent', e.target.value)} min={0} max={100} style={inputStyle} />
          </Field>
          <Field label="Exam Date">
            <input type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Room Number">
            <input value={form.room_number} onChange={e => set('room_number', e.target.value)} style={inputStyle} placeholder="e.g. LH-01" />
          </Field>
          <Field label="Start Time">
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="End Time">
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleSubmit} loading={loading}><Trophy size={14} /> Create Exam</NeuBtn>
      </div>
    </Modal>
  )
}

// ════════════════════════════════════════════════════════
// ENTER RESULTS MODAL
// Backend BulkExamResultRequest: { results: [{student_id, obtained_marks, grade?, remarks?}] }
// ════════════════════════════════════════════════════════
function EnterResultsModal({ exam, offeringId, onClose, onSuccess }) {
  const [students, setStudents] = useState([])
  // marks map: { student_id: { obtained_marks, remarks } }
  const [marksMap, setMarksMap] = useState({})
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoadingStudents(true)
      try {
        // Load enrolled students
        const studsRes = await api.get(`/offerings/${offeringId}/students`)
        const studs = studsRes.data.data?.students || []
        setStudents(studs)

        // Load existing results if any
        try {
          const resultsRes = await api.get(`/exams/${exam.id}/results`)
          const existingResults = resultsRes.data.data?.results || []
          const init = {}
          studs.forEach(s => {
            const ex = existingResults.find(r => r.student_id === s.student_id)
            init[s.student_id] = {
              obtained_marks: ex ? String(ex.obtained_marks) : '',
              remarks: ex?.remarks || '',
            }
          })
          setMarksMap(init)
        } catch {
          // No existing results — init empty
          const init = {}
          studs.forEach(s => {
            init[s.student_id] = { obtained_marks: '', remarks: '' }
          })
          setMarksMap(init)
        }
      } catch {
        toast.error('Failed to load students')
      } finally {
        setLoadingStudents(false)
      }
    }
    loadData()
  }, [exam.id, offeringId])

  const updateMark = (studentId, field, value) => {
    setMarksMap(p => ({ ...p, [studentId]: { ...p[studentId], [field]: value } }))
  }

  const handleSave = async () => {
    // Validate marks
    const filled = students.filter(s => marksMap[s.student_id]?.obtained_marks !== '')
    if (filled.length === 0) { toast.error('Enter marks for at least one student'); return }

    for (const s of filled) {
      const m = parseFloat(marksMap[s.student_id]?.obtained_marks)
      if (isNaN(m) || m < 0) {
        toast.error(`Invalid marks for ${s.full_name}`)
        return
      }
      if (m > exam.total_marks) {
        toast.error(`${s.full_name}: marks (${m}) exceed total (${exam.total_marks})`)
        return
      }
    }

    setSaving(true)
    try {
      // ✅ correct field: obtained_marks (NOT marks_obtained)
      const results = filled.map(s => ({
        student_id:    s.student_id,
        obtained_marks: parseFloat(marksMap[s.student_id].obtained_marks),
        remarks:       marksMap[s.student_id].remarks || null,
      }))

      await api.post(`/exams/${exam.id}/results`, { results })
      toast.success(`Results saved for ${results.length} students!`)
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save results')
    } finally { setSaving(false) }
  }

  const totalFilled = students.filter(s => marksMap[s.student_id]?.obtained_marks !== '').length
  const avgMarks = totalFilled > 0
    ? (students
        .filter(s => marksMap[s.student_id]?.obtained_marks !== '')
        .reduce((sum, s) => sum + (parseFloat(marksMap[s.student_id]?.obtained_marks) || 0), 0) / totalFilled
      ).toFixed(1)
    : '—'

  return (
    <Modal wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <RingChart value={totalFilled} total={students.length || 1} size={52} />
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
              {exam.title} — Enter Results
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
              Total: {exam.total_marks} marks · {totalFilled}/{students.length} filled · Avg: {avgMarks}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingStudents ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem' }}>
            <Loader2 size={24} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>
            <Users size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>No students enrolled</p>
          </div>
        ) : (
          <>
            {/* Bulk actions */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Quick fill:</span>
              {[0, exam.total_marks, Math.round(exam.total_marks * 0.8), Math.round(exam.total_marks * 0.6)].map(val => (
                <button key={val} onClick={() => {
                  const updated = {}
                  students.forEach(s => { updated[s.student_id] = { ...marksMap[s.student_id], obtained_marks: String(val) } })
                  setMarksMap(prev => ({ ...prev, ...updated }))
                }}
                  style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '0.4rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-secondary)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  {val === 0 ? 'Zero all' : val === exam.total_marks ? 'Full marks' : `${val} marks`}
                </button>
              ))}
              <button onClick={() => {
                const cleared = {}
                students.forEach(s => { cleared[s.student_id] = { obtained_marks: '', remarks: '' } })
                setMarksMap(cleared)
              }}
                style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '0.4rem', border: '1px solid rgba(242,107,107,0.3)', background: 'rgba(242,107,107,0.08)', color: '#f26b6b', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Clear all
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Student', 'Roll No', `Marks /${exam.total_marks}`, 'Percentage', 'Remarks'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    const marks = marksMap[s.student_id]?.obtained_marks
                    const numMarks = parseFloat(marks)
                    const pct = marks !== '' && !isNaN(numMarks) ? ((numMarks / exam.total_marks) * 100).toFixed(1) : null
                    const pctColor = pct !== null ? (parseFloat(pct) >= 60 ? '#3ecf8e' : parseFloat(pct) >= 40 ? '#f5a623' : '#f26b6b') : 'var(--neu-text-ghost)'
                    return (
                      <tr key={s.student_id}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        style={{ transition: 'background 0.12s' }}>
                        <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)', width: 40 }}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{s.full_name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.roll_number}</td>
                        <td style={tdStyle}>
                          <input
                            type="number"
                            min={0}
                            max={exam.total_marks}
                            value={marks}
                            onChange={e => updateMark(s.student_id, 'obtained_marks', e.target.value)}
                            style={{
                              ...inputStyle,
                              width: 90,
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.82rem',
                              border: marks !== '' && !isNaN(numMarks) && numMarks > exam.total_marks
                                ? '1px solid #f26b6b'
                                : '1px solid var(--neu-border)',
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td style={tdStyle}>
                          {pct !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 48, height: 4, borderRadius: 99, background: 'var(--neu-surface-deep)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(parseFloat(pct), 100)}%`, background: pctColor, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pctColor }}>{pct}%</span>
                            </div>
                          ) : <span style={{ color: 'var(--neu-text-ghost)', fontSize: '0.75rem' }}>—</span>}
                        </td>
                        <td style={tdStyle}>
                          <input
                            value={marksMap[s.student_id]?.remarks || ''}
                            onChange={e => updateMark(s.student_id, 'remarks', e.target.value)}
                            style={{ ...inputStyle, padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                            placeholder="Optional..."
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>
          {totalFilled} of {students.length} filled
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
          <NeuBtn onClick={handleSave} loading={saving} disabled={loadingStudents}>
            <Trophy size={14} /> Save Results
          </NeuBtn>
        </div>
      </div>
    </Modal>
  )
}

// ════════════════════════════════════════════════════════
// VIEW RESULTS MODAL — show saved results
// ════════════════════════════════════════════════════════
function ViewResultsModal({ exam, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/exams/${exam.id}/results`)
      .then(r => {
        const data = r.data.data
        setResults(data?.results || [])
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [exam.id])

  const marks = results.map(r => r.obtained_marks)
  const highest = marks.length ? Math.max(...marks) : 0
  const lowest  = marks.length ? Math.min(...marks) : 0
  const average = marks.length ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1) : '—'
  const passed  = results.filter(r => r.grade !== 'F').length
  const failed  = results.filter(r => r.grade === 'F').length

  return (
    <Modal wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <RingChart value={passed} total={results.length || 1} size={52} />
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
              {exam.title} — Results
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
              {results.length} results · {passed} passed · {failed} failed
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
            <Loader2 size={24} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>
            <BarChart2 size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>No results entered yet</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Highest', value: highest, color: '#3ecf8e' },
                { label: 'Lowest',  value: lowest,  color: '#f26b6b' },
                { label: 'Average', value: average,  color: '#f5a623' },
                { label: 'Passed',  value: passed,   color: '#3ecf8e' },
                { label: 'Failed',  value: failed,   color: '#f26b6b' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '0.75rem', padding: '0.6rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', flex: 1, minWidth: 80 }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{s.label}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit,sans-serif' }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Student', 'Roll No', 'Marks', 'Percentage', 'Grade', 'Remarks'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const pct = exam.total_marks > 0
                      ? ((r.obtained_marks / exam.total_marks) * 100).toFixed(1)
                      : '0'
                    const pctNum = parseFloat(pct)
                    const color = pctNum >= 75 ? '#3ecf8e' : pctNum >= 50 ? '#f5a623' : '#f26b6b'
                    const gradeColor = r.grade === 'F' ? '#f26b6b' : pctNum >= 75 ? '#3ecf8e' : '#f5a623'
                    return (
                      <tr key={r.student_id || i}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        style={{ transition: 'background 0.12s' }}>
                        <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)', width: 40 }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{r.full_name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.roll_number || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--neu-text-primary)' }}>
                          {r.obtained_marks}/{exam.total_marks}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 50, height: 5, borderRadius: 99, background: 'var(--neu-surface-deep)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(pctNum, 100)}%`, background: color, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontWeight: 700, color, fontSize: '0.8rem' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: gradeColor,
                            background: `${gradeColor}15`, padding: '0.2rem 0.55rem', borderRadius: '0.4rem' }}>
                            {r.grade || '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)', fontSize: '0.75rem' }}>{r.remarks || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '0.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

// ════════════════════════════════════════════════════════
// EXAM CARD
// ════════════════════════════════════════════════════════
const TYPE_CFG = {
  midterm: { emoji: '📋', color: '#5b8af0', bg: 'rgba(91,138,240,0.1)' },
  final:   { emoji: '🏆', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  special: { emoji: '⭐', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
}

function ExamCard({ exam, onClick }) {
  const [hovered, setHovered] = useState(false)
  const cfg = TYPE_CFG[exam.exam_type] || TYPE_CFG.special
  const resultsCount = exam.total_results ?? 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...neu({ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }),
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : '',
        boxShadow: hovered ? '12px 12px 28px var(--neu-shadow-dark), -8px -8px 18px var(--neu-shadow-light)' : 'var(--neu-raised)',
      }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

      <div style={{ padding: '1.2rem 1.35rem 1.35rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Icon + ring */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            {cfg.emoji}
          </div>
          {resultsCount > 0 && (
            <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>
              {resultsCount} results
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '0.93rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {exam.title}
            </h3>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: cfg.bg, color: cfg.color, borderRadius: '0.4rem', flexShrink: 0, textTransform: 'capitalize' }}>
              {exam.exam_type}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Hash size={11} />{exam.total_marks} marks
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <TrendingUp size={11} />{exam.weightage_percent}% weight
            </span>
            {exam.exam_date && (
              <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                📅 {exam.exam_date}
              </span>
            )}
            {exam.room_number && (
              <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                🚪 {exam.room_number}
              </span>
            )}
          </div>

          {/* Results pill */}
          {resultsCount > 0 ? (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0.45rem', background: 'rgba(62,207,142,0.1)', color: '#3ecf8e', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle size={10} />{resultsCount} results entered
            </span>
          ) : (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0.45rem', background: 'rgba(245,166,35,0.1)', color: '#f5a623', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={10} />No results yet
            </span>
          )}
        </div>
      </div>

      <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', fontSize: '0.58rem', color: 'var(--neu-text-ghost)', opacity: hovered ? 0.6 : 0.2, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
        click for options
      </span>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════
export default function ResultsPage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [enterResults, setEnterResults] = useState(null)   // { exam, offeringId }
  const [viewResults, setViewResults] = useState(null)     // exam object
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
      const res = await api.get(`/offerings/${selectedOffering}/exams`)
      const list = res.data.data?.exams || []
      // ✅ Preserve offering_id in each exam for student loading
      setExams(list.map(e => ({ ...e, offering_id: parseInt(selectedOffering) })))
    } catch { toast.error('Failed to load exams') }
    finally { setLoading(false) }
  }, [selectedOffering])

  useEffect(() => { fetchExams() }, [fetchExams])

  // ✅ Delete exam — backend endpoint added separately
  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? Results will also be deleted.`)) return
    try {
      await api.delete(`/exams/${exam.id}`)
      toast.success('Exam deleted')
      fetchExams()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam')
    }
  }

  const existingTypes = exams.map(e => e.exam_type)

  // Left-click context menu
  const ctxItems = (exam) => [
    {
      label: 'Enter / Update Results',
      icon: Award,
      onClick: e => setEnterResults({ exam: e, offeringId: selectedOffering }),
    },
    {
      label: 'View Results',
      icon: BarChart2,
      onClick: e => setViewResults(e),
    },
    { divider: true },
    {
      label: 'Delete Exam',
      icon: Trash2,
      danger: true,
      onClick: e => handleDelete(e),
    },
  ]

  const selectStyle = { ...inputStyle, width: 'auto', minWidth: 260, cursor: 'pointer' }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>Results & Exams</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>
            {exams.length} exam{exams.length !== 1 ? 's' : ''} · {exams.reduce((s, e) => s + (e.total_results || 0), 0)} results entered
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={selectStyle}>
            <option value="">-- Select Course --</option>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          
          <AddButton onClick={() => setShowCreate(true)} tooltip="Add Exam" color="#5b8af0" />

        </div>
      </div>

      {/* Exam list */}
      {!selectedOffering ? (
        <div style={{ ...neu({ padding: '3.5rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
            <Trophy size={24} style={{ color: '#a78bfa' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.93rem' }}>Select a course to manage exams</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : exams.length === 0 ? (
        <div style={{ ...neu({ padding: '3.5rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
            <Trophy size={24} style={{ color: '#a78bfa' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.93rem' }}>No exams yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Add midterm, final, or special exams</p>
          <NeuBtn onClick={() => setShowCreate(true)} style={{ marginTop: '0.25rem' }}>
            <Plus size={14} /> Add First Exam
          </NeuBtn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {exams.map(e => (
            <ExamCard
              key={e.id}
              exam={e}
              onClick={evt => openMenu(evt, e)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateExamModal
          offeringId={selectedOffering}
          existingTypes={existingTypes}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchExams}
        />
      )}
      {enterResults && (
        <EnterResultsModal
          exam={enterResults.exam}
          offeringId={enterResults.offeringId}
          onClose={() => setEnterResults(null)}
          onSuccess={fetchExams}
        />
      )}
      {viewResults && (
        <ViewResultsModal
          exam={viewResults}
          onClose={() => setViewResults(null)}
        />
      )}

      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}