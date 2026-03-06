// ═══════════════════════════════════════════════════════════════
//  StudentsPage.jsx  —  Neumorphic + Right-click Context Menu
//  Replace: frontend/src/pages/admin/StudentsPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Eye, Edit2, Trash2, Loader2,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  User, Mail, Phone, MapPin, Hash, GraduationCap,
  UserCheck, UserX,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

const BASE_URL = 'http://127.0.0.1:8000'

// ── Shared input style ────────────────────────────────────────
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
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Avatar initials ───────────────────────────────────────────
function Avatar({ name, url, size = 32, accent = '#5b8af0' }) {
  return url
    ? <img src={`${BASE_URL}${url}`} alt="" style={{ width: size, height: size, borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
    : (
      <div style={{
        width: size, height: size, borderRadius: '0.5rem', flexShrink: 0,
        background: accent + '20', color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.38, fontFamily: 'Outfit,sans-serif',
      }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    )
}

// ── Neu modal shell ───────────────────────────────────────────
function Modal({ children, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,14,22,0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: wide ? '560px' : '420px',
        background: 'var(--neu-surface)',
        boxShadow: '12px 12px 32px var(--neu-shadow-dark), -6px -6px 18px var(--neu-shadow-light)',
        border: '1px solid var(--neu-border)',
        borderRadius: '1.5rem',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'neu-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── View Modal ────────────────────────────────────────────────
function ViewModal({ studentId, onClose }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStudent(studentId)
      .then(r => setStudent(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [studentId])

  const rows = [
    { icon: Mail,         label: 'Email',    value: student?.email },
    { icon: Phone,        label: 'Phone',    value: student?.profile?.phone },
    { icon: Hash,         label: 'Roll No',  value: student?.roll_number },
    { icon: User,         label: 'Gender',   value: student?.profile?.gender },
    { icon: MapPin,       label: 'City',     value: student?.profile?.city },
    { icon: User,         label: 'Father',   value: student?.profile?.father_name },
    { icon: Phone,        label: 'Guardian', value: student?.profile?.guardian_phone },
    { icon: MapPin,       label: 'Address',  value: student?.profile?.current_address },
    { icon: Hash,         label: 'CNIC',     value: student?.profile?.cnic },
  ].filter(r => r.value)

  return (
    <Modal>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {loading
          ? <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
          : <Avatar name={student?.profile?.full_name} url={student?.profile?.profile_picture_url} size={48} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            {loading ? '...' : student?.profile?.full_name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '1px', fontFamily: 'monospace' }}>
            {student?.roll_number}
          </p>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '99px',
          background: student?.is_active ? 'rgba(34,160,107,0.12)' : 'rgba(239,68,68,0.1)',
          color: student?.is_active ? '#22a06b' : '#ef4444',
        }}>
          {student?.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={22} style={{ color: 'var(--neu-accent)', animation: 'spin 1s linear infinite' }} /></div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '0.75rem', padding: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '3px' }}>
                    <Icon size={11} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)' }}>
          Close
        </button>
      </div>
    </Modal>
  )
}

// ── Create / Edit Modal ───────────────────────────────────────
function StudentModal({ student, onClose, onSuccess }) {
  const isEdit = !!student?.user_id
  const [form, setForm] = useState({
    full_name: student?.full_name || student?.profile?.full_name || '',
    email:     student?.email || '',
    phone:     student?.profile?.phone || student?.phone || '',
    city:      student?.profile?.city || '',
    current_address: student?.profile?.current_address || '',
    gender:    student?.profile?.gender || '',
    father_name:    student?.profile?.father_name || '',
    guardian_phone: student?.profile?.guardian_phone || '',
    cnic:      student?.profile?.cnic || '',
    roll_number: student?.roll_number || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email required'); return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateStudent(student.user_id, form)
        toast.success('Student updated!')
      } else {
        await adminAPI.createStudent(form)
        toast.success('Student created!')
      }
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally { setLoading(false) }
  }

  const fields = [
    { key: 'full_name',      label: 'Full Name *',     type: 'text' },
    { key: 'email',          label: 'Email *',         type: 'email', disabled: isEdit },
    { key: 'roll_number',    label: 'Roll Number',     type: 'text' },
    { key: 'phone',          label: 'Phone',           type: 'text' },
    { key: 'gender',         label: 'Gender',          type: 'select', options: ['', 'Male', 'Female', 'Other'] },
    { key: 'city',           label: 'City',            type: 'text' },
    { key: 'father_name',    label: 'Father Name',     type: 'text' },
    { key: 'guardian_phone', label: 'Guardian Phone',  type: 'text' },
    { key: 'cnic',           label: 'CNIC',            type: 'text' },
    { key: 'current_address',label: 'Address',         type: 'text' },
  ]

  return (
    <Modal wide>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
          {isEdit ? 'Edit Student' : 'Add Student'}
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '0.25rem' }}>✕</button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          {fields.map(({ key, label, type, disabled, options }) => (
            <Field key={key} label={label}>
              {type === 'select'
                ? (
                  <select value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle}>
                    {options.map(o => <option key={o} value={o}>{o || '— Select —'}</option>)}
                  </select>
                ) : (
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    disabled={disabled}
                    style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
                  />
                )
              }
            </Field>
          ))}
        </div>

        {!isEdit && (
          <p style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: 'var(--neu-text-ghost)', background: 'var(--neu-surface-deep)', borderRadius: '0.625rem', padding: '0.6rem 0.85rem' }}>
            Password will be auto-generated and sent to the provided email.
          </p>
        )}
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.6rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', width: 'auto', flex: 1 }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1, padding: '0.65rem', borderRadius: '0.75rem', border: 'none',
            background: 'linear-gradient(145deg, #5b8af0, #3a6bd4)',
            boxShadow: '0 4px 14px rgba(91,138,240,0.35)',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}
        >
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create Student'}
        </button>
      </div>
    </Modal>
  )
}

// ── Delete Confirm ────────────────────────────────────────────
function DeleteModal({ student, onClose, onConfirm, loading }) {
  return (
    <Modal>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.35rem' }}>Delete Student?</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-muted)', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{student?.full_name}</strong> ko permanently delete karna chahte hain?
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--neu-danger)', marginBottom: '1.5rem' }}>Yeh action undo nahi ho sakta.</p>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1 }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(145deg, #f26b6b, #d94f4f)',
              boxShadow: '0 4px 14px rgba(242,107,107,0.3)',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ═════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function StudentsPage() {
  const [students,   setStudents]   = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [viewId,     setViewId]     = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [delTarget,  setDelTarget]  = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchStudents = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    try {
      const res = await adminAPI.getStudents(page, 10, q)
      setStudents(res.data.data.students)
      setPagination(res.data.data.pagination)
    } catch { toast.error('Failed to load students') }
    finally  { setLoading(false) }
  }, [search])

  useEffect(() => { fetchStudents() }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1, search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleToggle = async (s) => {
    setTogglingId(s.user_id)
    try {
      await adminAPI.toggleStudentStatus(s.user_id)
      toast.success(`Student ${s.is_active ? 'deactivated' : 'activated'}`)
      fetchStudents(pagination.page)
    } catch { toast.error('Status change failed') }
    finally { setTogglingId(null) }
  }

  const handleDelete = async () => {
    setDeletingId(delTarget.user_id)
    try {
      await adminAPI.deleteStudent(delTarget.user_id)
      toast.success('Student deleted')
      setDelTarget(null)
      fetchStudents(pagination.page)
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
    finally { setDeletingId(null) }
  }

  // Context menu items
  const ctxItems = (row) => [
    { label: 'View Profile',   icon: Eye,       onClick: (r) => setViewId(r.user_id) },
    { label: 'Edit',           icon: Edit2,     onClick: (r) => setEditTarget(r) },
    { divider: true },
    {
      label: row?.is_active ? 'Deactivate' : 'Activate',
      icon:  row?.is_active ? UserX : UserCheck,
      onClick: handleToggle,
    },
    { divider: true },
    { label: 'Delete',         icon: Trash2,    onClick: (r) => setDelTarget(r), danger: true },
  ]

  const thStyle = {
    padding: '0.75rem 1rem',
    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    color: 'var(--neu-text-ghost)',
    textAlign: 'left', whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--neu-border)',
  }
  const tdStyle = {
    padding: '0.75rem 1rem',
    fontSize: '0.82rem',
    color: 'var(--neu-text-secondary)',
    borderBottom: '1px solid var(--neu-border)',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em' }}>
            Students
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', marginTop: '2px' }}>
            {pagination.total} registered students
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.2rem',
            background: 'linear-gradient(145deg, #5b8af0, #3a6bd4)',
            boxShadow: '0 4px 14px rgba(91,138,240,0.3), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.875rem',
            color: '#fff', fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '340px' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, roll no…"
          style={{ ...inputStyle, paddingLeft: '2.25rem', width: '100%' }}
        />
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--neu-surface)',
        boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
        border: '1px solid var(--neu-border)',
        borderRadius: '1.25rem',
        overflow: 'hidden',
      }}>
        <p style={{ padding: '0.6rem 1rem', fontSize: '0.68rem', color: 'var(--neu-text-ghost)', borderBottom: '1px solid var(--neu-border)', fontWeight: 600, letterSpacing: '0.04em' }}>
          Right-click on a row to see actions
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Student', 'Roll No', 'Email', 'Status'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j} style={tdStyle}>
                        <div style={{ height: 14, borderRadius: 6, background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite', maxWidth: j === 2 ? 160 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
                : students.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.85rem' }}>
                        <GraduationCap size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        No students found
                      </td>
                    </tr>
                  )
                  : students.map((s, idx) => (
                    <tr
                      key={s.user_id}
                      onContextMenu={e => openMenu(e, s)}
                      style={{ cursor: 'context-menu', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)', width: '3rem' }}>
                        {(pagination.page - 1) * pagination.per_page + idx + 1}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Avatar name={s.full_name || s.profile?.full_name} url={s.profile?.profile_picture_url} size={32} />
                          <span style={{ fontWeight: 600, color: 'var(--neu-text-primary)' }}>
                            {s.full_name || s.profile?.full_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {s.roll_number || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--neu-text-muted)' }}>
                        {s.email || '—'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px',
                          background: s.is_active ? 'rgba(34,160,107,0.12)' : 'rgba(239,68,68,0.1)',
                          color: s.is_active ? '#22a06b' : '#ef4444',
                        }}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--neu-border)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>
              {(pagination.page - 1) * pagination.per_page + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => fetchStudents(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{ ...inputStyle, width: '2rem', height: '2rem', padding: 0, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--neu-text-secondary)', padding: '0 0.5rem', fontWeight: 600 }}>
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => fetchStudents(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                style={{ ...inputStyle, width: '2rem', height: '2rem', padding: 0, cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.total_pages ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context menu */}
      <ContextMenu
        menu={menu}
        close={closeMenu}
        items={menu ? ctxItems(menu.row) : []}
      />

      {/* Modals */}
      {viewId      && <ViewModal studentId={viewId} onClose={() => setViewId(null)} />}
      {showCreate  && <StudentModal onClose={() => setShowCreate(false)} onSuccess={() => fetchStudents(1)} />}
      {editTarget  && <StudentModal student={editTarget} onClose={() => setEditTarget(null)} onSuccess={() => fetchStudents(pagination.page)} />}
      {delTarget   && <DeleteModal student={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
    </div>
  )
}