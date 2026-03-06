// ═══════════════════════════════════════════════════════════════
//  TeachersPage.jsx  —  Neumorphic + Right-click Context Menu
//  Replace: frontend/src/pages/admin/TeachersPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Eye, Edit2, Trash2, Loader2,
  ChevronLeft, ChevronRight, CheckCircle, Users,
  User, Mail, Phone, Hash, Briefcase,
  GraduationCap, Calendar, Copy, Check,
  UserCheck, UserX,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

const BASE_URL = 'http://127.0.0.1:8000'

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

function Avatar({ name, url, size = 32 }) {
  return url
    ? <img src={`${BASE_URL}${url}`} alt="" style={{ width: size, height: size, borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
    : (
      <div style={{
        width: size, height: size, borderRadius: '0.5rem', flexShrink: 0,
        background: 'rgba(155,89,182,0.15)', color: '#9b59b6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.38, fontFamily: 'Outfit,sans-serif',
      }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    )
}

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
function ViewModal({ teacherId, onClose }) {
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getTeacher(teacherId)
      .then(r => setTeacher(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [teacherId])

  const rows = [
    { icon: Mail,         label: 'Email',         value: teacher?.email },
    { icon: Hash,         label: 'Employee ID',   value: teacher?.employee_id },
    { icon: Phone,        label: 'Phone',         value: teacher?.phone },
    { icon: Hash,         label: 'CNIC',          value: teacher?.cnic },
    { icon: Briefcase,    label: 'Designation',   value: teacher?.designation },
    { icon: GraduationCap,label: 'Qualification', value: teacher?.qualification },
    { icon: Briefcase,    label: 'Specialization',value: teacher?.specialization },
    { icon: Calendar,     label: 'Joining Date',  value: teacher?.joining_date },
  ].filter(r => r.value)

  return (
    <Modal>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {loading
          ? <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: 'var(--neu-surface-deep)' }} />
          : <Avatar name={teacher?.full_name} url={teacher?.profile_picture_url} size={48} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            {loading ? '...' : teacher?.full_name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '1px' }}>
            {teacher?.designation || 'Teacher'}
          </p>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '99px',
          background: teacher?.is_active ? 'rgba(34,160,107,0.12)' : 'rgba(239,68,68,0.1)',
          color: teacher?.is_active ? '#22a06b' : '#ef4444',
        }}>
          {teacher?.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={22} style={{ color: '#9b59b6', animation: 'spin 1s linear infinite' }} /></div>
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
function TeacherModal({ teacher, onClose, onSuccess }) {
  const isEdit = !!teacher?.user_id
  const [form, setForm] = useState({
    email:          teacher?.email          || '',
    full_name:      teacher?.full_name      || '',
    employee_id:    teacher?.employee_id    || '',
    designation:    teacher?.designation    || '',
    qualification:  teacher?.qualification  || '',
    specialization: teacher?.specialization || '',
    phone:          teacher?.phone          || '',
    cnic:           teacher?.cnic           || '',
    joining_date:   teacher?.joining_date   || '',
  })
  const [loading,      setLoading]      = useState(false)
  const [tempPassword, setTempPassword] = useState(null)
  const [copied,       setCopied]       = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.full_name.trim())               { toast.error('Full name required'); return }
    if (!isEdit && !form.email.trim())        { toast.error('Email required'); return }
    if (!isEdit && !form.employee_id.trim())  { toast.error('Employee ID required'); return }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateTeacher(teacher.user_id, {
          full_name: form.full_name, designation: form.designation,
          qualification: form.qualification, specialization: form.specialization,
          phone: form.phone,
        })
        toast.success('Teacher updated!')
        onSuccess(); onClose()
      } else {
        const res = await adminAPI.createTeacher({
          email: form.email, full_name: form.full_name, employee_id: form.employee_id,
          designation: form.designation || undefined, qualification: form.qualification || undefined,
          specialization: form.specialization || undefined, phone: form.phone || undefined,
          cnic: form.cnic || undefined, joining_date: form.joining_date || undefined,
        })
        setTempPassword(res.data.data.temp_password)
        onSuccess()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally { setLoading(false) }
  }

  // Success screen — show temp password
  if (tempPassword) {
    return (
      <Modal>
        <div style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '1.25rem', background: 'rgba(34,160,107,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle size={26} style={{ color: '#22a06b' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.35rem' }}>Teacher Created!</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)', marginBottom: '1.5rem' }}>Share these credentials with the teacher</p>

          <div style={{ background: 'var(--neu-surface-deep)', borderRadius: '0.875rem', padding: '1rem', textAlign: 'left', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Temporary Password</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <code style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--neu-text-primary)', letterSpacing: '0.05em' }}>{tempPassword}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(tempPassword); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ ...inputStyle, width: '2.2rem', height: '2.2rem', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {copied ? <Check size={14} style={{ color: '#22a06b' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: '0.625rem', padding: '0.6rem', marginBottom: '1.5rem' }}>
            ⚠️ Ye password sirf ek bar dikhega — copy kar lo!
          </p>

          <button onClick={onClose} style={{
            width: '100%', padding: '0.75rem', borderRadius: '0.875rem', border: 'none',
            background: 'linear-gradient(145deg, #9b59b6, #7d3c98)',
            boxShadow: '0 4px 14px rgba(155,89,182,0.35)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
          }}>Done</button>
        </div>
      </Modal>
    )
  }

  const fields = [
    { key: 'full_name',      label: 'Full Name *',     type: 'text',  editOnly: false },
    { key: 'email',          label: 'Email *',         type: 'email', createOnly: true },
    { key: 'employee_id',    label: 'Employee ID *',   type: 'text',  createOnly: true },
    { key: 'designation',    label: 'Designation',     type: 'text' },
    { key: 'phone',          label: 'Phone',           type: 'text' },
    { key: 'qualification',  label: 'Qualification',   type: 'text' },
    { key: 'specialization', label: 'Specialization',  type: 'text' },
    { key: 'cnic',           label: 'CNIC',            type: 'text',  createOnly: true },
    { key: 'joining_date',   label: 'Joining Date',    type: 'date',  createOnly: true },
  ].filter(f => isEdit ? !f.createOnly : !f.editOnly)

  return (
    <Modal wide>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
          {isEdit ? 'Edit Teacher' : 'Add Teacher'}
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', fontSize: '1rem' }}>✕</button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          {fields.map(({ key, label, type }) => (
            <Field key={key} label={label}>
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle} />
            </Field>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.6rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, width: 'auto' }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1, padding: '0.65rem', borderRadius: '0.75rem', border: 'none',
            background: 'linear-gradient(145deg, #9b59b6, #7d3c98)',
            boxShadow: '0 4px 14px rgba(155,89,182,0.3)',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}
        >
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create Teacher'}
        </button>
      </div>
    </Modal>
  )
}

// ── Delete Confirm ────────────────────────────────────────────
function DeleteModal({ teacher, onClose, onConfirm, loading }) {
  return (
    <Modal>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.35rem' }}>Delete Teacher?</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-muted)', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{teacher?.full_name}</strong> ko permanently delete karna chahte hain?
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
export default function TeachersPage() {
  const [teachers,   setTeachers]   = useState([])
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

  const fetchTeachers = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    try {
      const res = await adminAPI.getTeachers(page, 10, q)
      setTeachers(res.data.data.teachers)
      setPagination(res.data.data.pagination)
    } catch { toast.error('Failed to load teachers') }
    finally  { setLoading(false) }
  }, [search])

  useEffect(() => { fetchTeachers() }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchTeachers(1, search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleToggle = async (t) => {
    setTogglingId(t.user_id)
    try {
      await adminAPI.toggleTeacherStatus(t.user_id)
      toast.success(`Teacher ${t.is_active ? 'deactivated' : 'activated'}`)
      fetchTeachers(pagination.page)
    } catch { toast.error('Status change failed') }
    finally { setTogglingId(null) }
  }

  const handleDelete = async () => {
    setDeletingId(delTarget.user_id)
    try {
      await adminAPI.deleteTeacher(delTarget.user_id)
      toast.success('Teacher deleted')
      setDelTarget(null)
      fetchTeachers(pagination.page)
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
    finally { setDeletingId(null) }
  }

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
    color: 'var(--neu-text-ghost)', textAlign: 'left', whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--neu-border)',
  }
  const tdStyle = {
    padding: '0.75rem 1rem', fontSize: '0.82rem',
    color: 'var(--neu-text-secondary)',
    borderBottom: '1px solid var(--neu-border)',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.02em' }}>
            Teachers
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', marginTop: '2px' }}>
            {pagination.total} faculty members
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.2rem',
            background: 'linear-gradient(145deg, #9b59b6, #7d3c98)',
            boxShadow: '0 4px 14px rgba(155,89,182,0.3), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.875rem',
            color: '#fff', fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '340px' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, emp ID…"
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
                {['#', 'Teacher', 'Emp ID', 'Designation', 'Phone', 'Status'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} style={tdStyle}>
                        <div style={{ height: 14, borderRadius: 6, background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite', maxWidth: j === 2 ? 160 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
                : teachers.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.85rem' }}>
                        <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
                        No teachers found
                      </td>
                    </tr>
                  )
                  : teachers.map((t, idx) => (
                    <tr
                      key={t.user_id}
                      onContextMenu={e => openMenu(e, t)}
                      style={{ cursor: 'context-menu', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)', width: '3rem' }}>
                        {(pagination.page - 1) * pagination.per_page + idx + 1}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Avatar name={t.full_name} url={t.profile_picture_url} size={32} />
                          <span style={{ fontWeight: 600, color: 'var(--neu-text-primary)' }}>
                            {t.full_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {t.employee_id || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--neu-text-muted)' }}>
                        {t.designation || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--neu-text-muted)' }}>
                        {t.phone || '—'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px',
                          background: t.is_active ? 'rgba(34,160,107,0.12)' : 'rgba(239,68,68,0.1)',
                          color: t.is_active ? '#22a06b' : '#ef4444',
                        }}>
                          {t.is_active ? 'Active' : 'Inactive'}
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
                onClick={() => fetchTeachers(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{ ...inputStyle, width: '2rem', height: '2rem', padding: 0, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--neu-text-secondary)', padding: '0 0.5rem', fontWeight: 600 }}>
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => fetchTeachers(pagination.page + 1)}
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
      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

      {/* Modals */}
      {viewId     && <ViewModal teacherId={viewId} onClose={() => setViewId(null)} />}
      {showCreate && <TeacherModal onClose={() => setShowCreate(false)} onSuccess={() => fetchTeachers(1)} />}
      {editTarget && <TeacherModal teacher={editTarget} onClose={() => setEditTarget(null)} onSuccess={() => fetchTeachers(pagination.page)} />}
      {delTarget  && <DeleteModal teacher={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
    </div>
  )
}