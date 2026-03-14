// ═══════════════════════════════════════════════════════════════
//  OfferingsPage.jsx  —  frontend/src/pages/admin/OfferingsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, BookOpen, Users, MapPin, Clock,
  Loader2, Edit2, Trash2, Eye, X, Calendar,
  ChevronLeft, ChevronRight, User, Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ────────────────────────────────────────── */
const CSS = `
  @keyframes neu-slide-up {
    from { opacity: 0; transform: translateY(18px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes neu-fade-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

  .off-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition: transform .22s ease, box-shadow .22s ease;
  }
  .off-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 30px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .off-card:hover .oc-ring { opacity: 1; }
  .oc-ring {
    position: absolute; inset: 0; border-radius: 1.25rem;
    pointer-events: none; opacity: 0; transition: opacity .22s ease;
  }
  .add-btn-tip {
    position: fixed; pointer-events: none; z-index: 99999;
    background: var(--neu-surface); border: 1px solid var(--neu-border);
    border-radius: .6rem; padding: .3rem .7rem;
    font-size: .72rem; font-weight: 700; color: var(--neu-text-primary);
    box-shadow: 4px 4px 12px var(--neu-shadow-dark); white-space: nowrap;
    animation: neu-fade-in .1s ease both;
  }
`

/* ─── Shared styles ──────────────────────────────── */
const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}

const F = ({ label, children, wide }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', gridColumn: wide ? 'span 2' : 'span 1' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)' },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)' },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'  },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)' },
]

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday']
const PER_PAGE = 9

const fmt12 = t => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')}${ampm}`
}

/* ─── AddButton ──────────────────────────────────── */
const BASE = 42, MAX_SZ = 54, DIST = 110
function AddButton({ onClick, tooltip = 'Add', color = '#5b8af0' }) {
  const ref    = useRef(null)
  const [size, setSize] = useState(BASE)
  const [tip,  setTip]  = useState(null)
  const [mx,   setMx]   = useState(-9999)

  useEffect(() => {
    if (!ref.current || mx === -9999) { setSize(BASE); return }
    const rect = ref.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist = Math.abs(mx - center)
    if (dist >= DIST) { setSize(BASE); return }
    const t = 1 - dist / DIST
    const e = t * t * (3 - 2 * t)
    setSize(BASE + (MAX_SZ - BASE) * e)
  }, [mx])

  return (
    <div onMouseMove={e => setMx(e.clientX)} onMouseLeave={() => { setMx(-9999); setTip(null) }}>
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ top: r.bottom + 8, left: r.left + r.width / 2 }) }}
        onMouseLeave={() => setTip(null)}
        style={{ width: size, height: size, borderRadius: '.85rem', background: 'var(--neu-surface)', boxShadow: `4px 4px 12px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light), 0 0 0 1.5px ${color}55`, border: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color, transition: 'width .1s ease, height .1s ease', flexShrink: 0 }}
      >
        <Plus size={Math.round(size * 0.44)} />
      </button>
      {tip && createPortal(
        <div className="add-btn-tip" style={{ top: tip.top, left: tip.left, transform: 'translateX(-50%)' }}>{tooltip}</div>,
        document.body
      )}
    </div>
  )
}

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 580 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .22s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Details Modal ─────────────────────────── */
function ViewModal({ offering, pal, onClose }) {
  const enrolled  = offering.enrolled_count || offering.enrolled_students || 0
  const max       = offering.max_students || 0
  const pct       = max ? Math.round((enrolled / max) * 100) : 0
  const fillColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#22a06b'
  const schedule  = offering.schedule_json || offering.schedule || []

  const rows = [
    { label: 'Course Code',  value: offering.course_code },
    { label: 'Section',      value: offering.section },
    { label: 'Teacher',      value: offering.teacher_name },
    { label: 'Semester',     value: offering.semester_name },
    { label: 'Room',         value: offering.room_number || '—' },
    { label: 'Max Students', value: String(max) },
    { label: 'Enrolled',     value: `${enrolled} / ${max}` },
    { label: 'Status',       value: offering.is_active !== false ? 'Active' : 'Inactive' },
  ].filter(r => r.value)

  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={22} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.25 }}>{offering.course_name}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{offering.course_code}</span>
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: 'rgba(91,138,240,.1)', color: '#5b8af0', borderRadius: '.4rem' }}>Section {offering.section}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.85rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
          </div>
        ))}
        <div style={{ gridColumn: 'span 2', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
          <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Capacity ({pct}%)</p>
          <div style={{ height: 7, background: 'var(--neu-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: fillColor, borderRadius: 99 }} />
          </div>
        </div>
        {schedule.length > 0 && (
          <div style={{ gridColumn: 'span 2', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Schedule</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.8rem', color: 'var(--neu-text-secondary)' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, color: pal.c, minWidth: 80 }}>{s.day}</span>
                  <span>{fmt12(s.start_time)} – {fmt12(s.end_time)}</span>
                  {s.room && <span style={{ color: 'var(--neu-text-ghost)' }}>• {s.room}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Students Modal ─────────────────────────────── */
function StudentsModal({ offering, onClose }) {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    adminAPI.getOfferingStudents(offering.id)
      .then(r => setStudents(r.data.data?.students || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }, [offering.id])

  return (
    <Modal maxW={460}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Enrolled Students</h2>
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.1rem' }}>{offering.course_name} — Sec {offering.section}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={20} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} /></div>
        ) : students.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '.85rem', padding: '2rem' }}>No students enrolled yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {students.map((s, i) => (
              <div key={s.student_id || i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem .9rem', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '.6rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={14} style={{ color: '#5b8af0' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--neu-text-primary)' }}>{s.full_name}</p>
                  <p style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)' }}>{s.roll_number}</p>
                </div>
                <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: s.is_approved ? 'rgba(34,160,107,.12)' : 'rgba(245,158,11,.1)', color: s.is_approved ? '#22a06b' : '#f59e0b', borderRadius: '.4rem' }}>
                  {s.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Create / Edit Modal ────────────────────────── */
function OfferingModal({ courses, teachers, semesters, offering, onClose, onSuccess }) {
  const isEdit = !!offering?.id

  const existingSchedule = offering?.schedule_json || offering?.schedule

  const [form, setForm] = useState({
    course_id:     offering?.course_id     ? Number(offering.course_id)   : '',
    instructor_id: offering?.instructor_id ? Number(offering.instructor_id) : '',
    semester_id:   offering?.semester_id   ? Number(offering.semester_id) : (semesters?.[0]?.id ? Number(semesters[0].id) : ''),
    section:       offering?.section       || 'A',
    room_number:   offering?.room_number   || '',
    max_students:  offering?.max_students  || 40,
    schedule_json: Array.isArray(existingSchedule) && existingSchedule.length > 0
      ? existingSchedule
      : [{ day: 'monday', start_time: '09:00', end_time: '10:30' }],
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Bug 3 fix: teachers async load hoti hain — jab load ho jayen tab instructor match karo
  useEffect(() => {
    if (!isEdit || !offering || teachers.length === 0) return
    // agar already set hai to skip
    if (form.instructor_id) return
    // instructor_name se match karo
    const name = offering.instructor_name || offering.teacher_name
    if (name) {
      const match = teachers.find(t =>
        t.full_name?.toLowerCase().trim() === name.toLowerCase().trim()
      )
      if (match) set('instructor_id', Number(match.user_id))
    }
  }, [teachers]) // eslint-disable-line

  const addSlot    = () => setForm(p => ({ ...p, schedule_json: [...p.schedule_json, { day: 'tuesday', start_time: '09:00', end_time: '10:30' }] }))
  const removeSlot = i  => setForm(p => ({ ...p, schedule_json: p.schedule_json.filter((_, idx) => idx !== i) }))
  const updateSlot = (i, k, v) => setForm(p => { const s = [...p.schedule_json]; s[i] = { ...s[i], [k]: v }; return { ...p, schedule_json: s } })

  const submit = async () => {
    if (!form.instructor_id) { toast.error('Teacher required'); return }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateOffering(offering.id, {
          instructor_id: form.instructor_id,
          max_students:  form.max_students,
          room_number:   form.room_number,
          schedule_json: form.schedule_json,
        })
        toast.success('Offering updated!')
      } else {
        if (!form.course_id || !form.semester_id) { toast.error('Course and semester required'); setLoading(false); return }
        await adminAPI.createOffering(form)
        toast.success('Offering created!')
      }
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={640}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '.7rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} style={{ color: '#5b8af0' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            {isEdit ? 'Edit Offering' : 'Create Offering'}
          </h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>

        {/* Course — locked on edit, editable on create */}
        <F label="Course *">
          <select
            style={{ ...iS, ...(isEdit ? { opacity: .55, cursor: 'not-allowed' } : {}) }}
            value={form.course_id}
            onChange={e => !isEdit && set('course_id', Number(e.target.value))}
            disabled={isEdit}
          >
            <option value="">— Select Course —</option>
            {courses.map(c => <option key={c.id} value={Number(c.id)}>{c.name} ({c.code})</option>)}
          </select>
        </F>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>

          {/* Teacher — ALWAYS editable */}
          <F label="Teacher *">
            <select style={iS} value={form.instructor_id} onChange={e => set('instructor_id', Number(e.target.value))}>
              <option value="">— Select Teacher —</option>
              {teachers.map(t => <option key={t.user_id} value={Number(t.user_id)}>{t.full_name}</option>)}
            </select>
          </F>

          {/* Semester — locked on edit */}
          <F label="Semester *">
            <select
              style={{ ...iS, ...(isEdit ? { opacity: .55, cursor: 'not-allowed' } : {}) }}
              value={form.semester_id}
              onChange={e => !isEdit && set('semester_id', Number(e.target.value))}
              disabled={isEdit}
            >
              <option value="">— Select Semester —</option>
              {semesters.map(s => <option key={s.id} value={Number(s.id)}>{s.name}{s.is_active ? ' ★' : ''}</option>)}
            </select>
          </F>

          {/* Section — locked on edit */}
          <F label="Section">
            <input
              style={{ ...iS, ...(isEdit ? { opacity: .55, cursor: 'not-allowed', background: 'var(--neu-surface-deep)' } : {}) }}
              value={form.section}
              onChange={e => set('section', e.target.value)}
              readOnly={isEdit}
              placeholder="A"
            />
          </F>

          {/* Room — ALWAYS editable */}
          <F label="Room Number">
            <input
              style={iS}
              value={form.room_number}
              onChange={e => set('room_number', e.target.value)}
              placeholder="e.g. LH-01"
            />
          </F>

          {/* Max Students — ALWAYS editable */}
          <F label="Max Students">
            <input
              style={iS}
              type="number"
              value={form.max_students}
              onChange={e => set('max_students', Number(e.target.value) || 1)}
              min={1}
            />
          </F>
        </div>

        {/* Schedule slots */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Schedule</label>
            <button onClick={addSlot} style={{ fontSize: '.72rem', fontWeight: 700, color: '#5b8af0', background: 'rgba(91,138,240,.1)', border: '1px solid rgba(91,138,240,.25)', borderRadius: '.5rem', padding: '.25rem .65rem', cursor: 'pointer' }}>
              + Add Slot
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {form.schedule_json.map((slot, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '.5rem', alignItems: 'end' }}>
                <select style={iS} value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
                <input style={iS} type="time" value={slot.start_time} onChange={e => updateSlot(i, 'start_time', e.target.value)} />
                <input style={iS} type="time" value={slot.end_time}   onChange={e => updateSlot(i, 'end_time',   e.target.value)} />
                <button
                  onClick={() => removeSlot(i)}
                  disabled={form.schedule_json.length === 1}
                  style={{ width: 36, height: 36, borderRadius: '.6rem', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444', cursor: form.schedule_json.length === 1 ? 'not-allowed' : 'pointer', opacity: form.schedule_json.length === 1 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create Offering'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Modal ───────────────────────────────── */
function DeleteModal({ offering, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Offering?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '.35rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{offering?.course_name}</strong> — Section {offering?.section}
        </p>
        <p style={{ fontSize: '.75rem', color: '#ef4444', marginBottom: '1.6rem' }}>
          Enrolled students aur linked records bhi delete ho jayenge.
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#f26b6b,#d94f4f)', boxShadow: '0 4px 14px rgba(242,107,107,.3)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Skeleton Card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
      <div style={{ height: 4, background: 'var(--neu-surface-deep)' }} />
      <div style={{ padding: '1.25rem 1.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: 52, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ height: 12, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '65%', marginBottom: '.5rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 10, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '45%', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 6, background: 'var(--neu-surface-deep)', borderRadius: 99, animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

/* ─── Offering Card ──────────────────────────────── */
function OfferingCard({ offering, pal, onClick }) {
  const enrolled  = offering.enrolled_count || offering.enrolled_students || 0
  const max       = offering.max_students || 0
  const pct       = max ? Math.round((enrolled / max) * 100) : 0
  const fillColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#22a06b'
  const schedule  = offering.schedule_json || offering.schedule || []
  const firstSlot = schedule[0]

  return (
    <div className="off-card" onClick={onClick}>
      {/* Accent stripe top */}
      <div style={{ height: 4, background: pal.c, width: '100%' }} />

      {/* Hover ring */}
      <div className="oc-ring" style={{ border: `2px solid ${pal.ring}` }} />

      <div style={{ padding: '1.2rem 1.35rem 1.35rem' }}>
        {/* Top: icon + section badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={20} style={{ color: pal.c }} />
          </div>
          <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.2rem .6rem', background: 'rgba(91,138,240,.1)', color: '#5b8af0', border: '1px solid rgba(91,138,240,.25)', borderRadius: '.45rem', letterSpacing: '.03em' }}>
            SEC {offering.section}
          </span>
        </div>

        {/* Course code */}
        <div style={{ marginBottom: '.4rem' }}>
          <span style={{ fontSize: '.62rem', fontWeight: 800, fontFamily: 'monospace', padding: '.15rem .55rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem' }}>
            {offering.course_code}
          </span>
        </div>

        {/* Course name */}
        <p style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, marginBottom: '.3rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
          {offering.course_name}
        </p>

        {/* Teacher */}
        <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)', marginBottom: '.85rem', display: 'flex', alignItems: 'center', gap: '.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <User size={11} style={{ flexShrink: 0 }} />
          {offering.teacher_name || '—'}
        </p>

        {/* Capacity bar */}
        <div style={{ marginBottom: '.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Enrolled</span>
            <span style={{ fontSize: '.65rem', fontWeight: 700, color: fillColor }}>{enrolled}/{max}</span>
          </div>
          <div style={{ height: 5, background: 'var(--neu-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: fillColor, borderRadius: 99, transition: 'width .4s ease' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: '1px solid var(--neu-border)', flexWrap: 'wrap', gap: '.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>
            <Calendar size={10} />
            <span>{offering.semester_name || '—'}</span>
          </div>
          {firstSlot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>
              <Clock size={10} />
              <span style={{ textTransform: 'capitalize' }}>{firstSlot.day?.slice(0,3)} {fmt12(firstSlot.start_time)}</span>
            </div>
          )}
          {offering.room_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>
              <MapPin size={10} />
              <span>{offering.room_number}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function OfferingsPage() {
  const [offerings,  setOfferings]  = useState([])
  const [courses,    setCourses]    = useState([])
  const [teachers,   setTeachers]   = useState([])
  const [semesters,  setSemesters]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterSem,  setFilterSem]  = useState('')
  const [page,       setPage]       = useState(1)
  const [showForm,   setShowForm]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [studTarget, setStudTarget] = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const filtered = useMemo(() => {
    let r = offerings
    if (filterSem) {
      r = r.filter(o => {
        // semester_id se match karo (agar backend bhejta hai)
        if (o.semester_id !== undefined && o.semester_id !== null) {
          return String(o.semester_id) === String(filterSem)
        }
        // fallback: semesters list se semester_name dhundho
        const sem = semesters.find(s => String(s.id) === String(filterSem))
        return sem && o.semester_name === sem.name
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(o =>
        o.course_name?.toLowerCase().includes(q) ||
        o.course_code?.toLowerCase().includes(q) ||
        o.instructor_name?.toLowerCase().includes(q) ||
        o.teacher_name?.toLowerCase().includes(q) ||
        o.semester_name?.toLowerCase().includes(q) ||
        o.section?.toLowerCase().includes(q)
      )
    }
    return r
  }, [offerings, filterSem, search, semesters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [o, c, t, s] = await Promise.all([
        adminAPI.getOfferings(),
        adminAPI.getCourses(),
        adminAPI.getTeachers(1, 200),
        adminAPI.getSemesters(),
      ])
      setOfferings(o.data.data?.offerings || [])
      setCourses(c.data.data?.courses     || [])
      setTeachers(t.data.data?.teachers   || [])
      setSemesters(s.data.data?.semesters || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { setPage(1) }, [search, filterSem])

  const handleDelete = async () => {
    setDeletingId(delTarget.id)
    try {
      await adminAPI.deleteOffering(delTarget.id)
      toast.success('Offering deleted')
      setDelTarget(null)
      fetchAll()
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const ctxItems = (pal) => [
    { label: 'View Details',  icon: Eye,    onClick: o => setViewTarget({ offering: o, pal }) },
    { label: 'View Students', icon: Users,  onClick: o => setStudTarget(o) },
    { label: 'Edit',          icon: Edit2,  onClick: o => { setEditTarget(o); setShowForm(true) } },
    { divider: true },
    { label: 'Delete',        icon: Trash2, onClick: o => setDelTarget(o), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.2 }}>
              Course Offerings
            </h1>
            <p style={{ fontSize: '.8rem', color: 'var(--neu-text-ghost)', marginTop: '.2rem' }}>
              {filtered.length} offering{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <AddButton
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            tooltip="Add Offering"
            color="#5b8af0"
          />
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by course, teacher, section…"
              style={{ ...iS, paddingLeft: '2.4rem' }}
            />
          </div>
          <select
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
            style={{ ...iS, width: 'auto', minWidth: 160 }}
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}{s.is_active ? ' ★' : ''}</option>
            ))}
          </select>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <BookOpen size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.9rem' }}>
              {search || filterSem ? 'No offerings match your filters' : 'No offerings yet'}
            </p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>
              {search || filterSem ? 'Try changing filters' : 'Click + to create your first offering'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {paginated.map((o, i) => {
              const pal = PALETTE[((page - 1) * PER_PAGE + i) % PALETTE.length]
              return (
                <OfferingCard
                  key={o.id}
                  offering={o}
                  pal={pal}
                  onClick={e => openMenu(e, o)}
                />
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ width: 34, height: 34, borderRadius: '.65rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem', fontFamily: "'DM Sans',sans-serif", background: page === i + 1 ? 'linear-gradient(145deg,#5b8af0,#3a6bd4)' : 'var(--neu-surface)', color: page === i + 1 ? '#fff' : 'var(--neu-text-secondary)', boxShadow: page === i + 1 ? '0 4px 12px rgba(91,138,240,.35)' : '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Context menu */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(PALETTE[paginated.findIndex(o => o.id === menu.row?.id) % PALETTE.length]) : []}
        />

        {/* Modals */}
        {viewTarget && <ViewModal    offering={viewTarget.offering} pal={viewTarget.pal} onClose={() => setViewTarget(null)} />}
        {studTarget && <StudentsModal offering={studTarget} onClose={() => setStudTarget(null)} />}
        {showForm   && <OfferingModal courses={courses} teachers={teachers} semesters={semesters} offering={editTarget} onClose={() => { setShowForm(false); setEditTarget(null) }} onSuccess={fetchAll} />}
        {delTarget  && <DeleteModal  offering={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}