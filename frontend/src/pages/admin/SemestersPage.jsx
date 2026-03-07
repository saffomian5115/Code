// ═══════════════════════════════════════════════════════════════
//  SemestersPage.jsx  —  frontend/src/pages/admin/SemestersPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Plus, Calendar, CheckCircle2, Loader2, Edit2, Zap, Clock, ChevronRight, Trash2, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

const CSS = `
  .sem-row {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.1rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.1rem 1.3rem;
    cursor: context-menu;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    overflow: hidden;
    transition: background .15s ease, box-shadow .22s ease, transform .22s ease;
  }
  .sem-row:hover {
    background: var(--neu-surface-deep);
    transform: translateX(4px);
    box-shadow: 8px 8px 20px var(--neu-shadow-dark), -3px -3px 12px var(--neu-shadow-light);
  }
  .sem-row.active-sem {
    border-color: rgba(34,160,107,.4);
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light), 0 0 0 1px rgba(34,160,107,.2);
  }
`

const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)
const toDate = v => v ? v.slice(0, 10) : ''
const fmt = d => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function getStatus(sem) {
  if (sem.is_active) return { label: 'Active', c: '#22a06b', bg: 'rgba(34,160,107,.12)', Icon: CheckCircle2 }
  const now = new Date()
  if (sem.end_date && new Date(sem.end_date) < now) return { label: 'Completed', c: 'var(--neu-text-ghost)', bg: 'var(--neu-surface-deep)', Icon: Clock }
  if (sem.start_date && new Date(sem.start_date) > now) return { label: 'Upcoming', c: '#5b8af0', bg: 'rgba(91,138,240,.1)', Icon: ChevronRight }
  return { label: 'Inactive', c: '#f59e0b', bg: 'rgba(245,158,11,.1)', Icon: Clock }
}

/* ── Modal shell ─────────────────────────────────── */
function Modal({ children, maxW = 420 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ── View Modal ──────────────────────────────────── */
function ViewModal({ sem, onClose }) {
  const { label, c, bg, Icon } = getStatus(sem)
  const rows = [
    { label: 'Code',               value: sem.code },
    { label: 'Status',             value: label },
    { label: 'Start Date',         value: fmt(sem.start_date) },
    { label: 'End Date',           value: fmt(sem.end_date) },
    { label: 'Registration Start', value: sem.registration_start ? fmt(sem.registration_start) : null },
    { label: 'Registration End',   value: sem.registration_end  ? fmt(sem.registration_end)   : null },
  ].filter(r => r.value)

  return (
    <Modal maxW={440}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: sem.is_active ? 'rgba(34,160,107,.12)' : 'rgba(91,138,240,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Calendar size={22} style={{ color: sem.is_active ? '#22a06b' : '#5b8af0' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.25 }}>{sem.name}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
            {sem.code && <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', border: '1px solid var(--neu-border)', borderRadius: '.4rem', fontFamily: 'monospace' }}>{sem.code}</span>}
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: bg, color: c, borderRadius: '.4rem', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
              <Icon size={10} />{label}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.75rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.84rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ── Semester Form Modal ─────────────────────────── */
function SemesterModal({ sem, onClose, onSuccess }) {
  const isEdit = !!sem?.id
  const [form, setForm] = useState({ name: sem?.name||'', code: sem?.code||'', start_date: toDate(sem?.start_date), end_date: toDate(sem?.end_date), registration_start: toDate(sem?.registration_start), registration_end: toDate(sem?.registration_end) })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) { toast.error('Name, start & end date required'); return }
    if (form.end_date <= form.start_date) { toast.error('End date must be after start date'); return }
    setLoading(true)
    try {
      const payload = { name: form.name, code: form.code||undefined, start_date: form.start_date, end_date: form.end_date, registration_start: form.registration_start||undefined, registration_end: form.registration_end||undefined }
      isEdit ? await adminAPI.updateSemester(sem.id, payload) : await adminAPI.createSemester(payload)
      toast.success(isEdit ? 'Semester updated!' : 'Semester created!')
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={15} style={{ color: '#5b8af0' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Semester' : 'Add Semester'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Semester Name *"><input style={iS} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Spring 2025" autoFocus /></Field>
          <Field label="Code"><input style={iS} value={form.code} onChange={e => set('code', e.target.value)} placeholder="SP-2025" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Start Date *"><input style={iS} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
          <Field label="End Date *"><input style={iS} type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Reg. Start"><input style={iS} type="date" value={form.registration_start} onChange={e => set('registration_start', e.target.value)} /></Field>
          <Field label="Reg. End"><input style={iS} type="date" value={form.registration_end} onChange={e => set('registration_end', e.target.value)} /></Field>
        </div>
        <div style={{ background: 'rgba(91,138,240,.07)', border: '1px solid rgba(91,138,240,.18)', borderRadius: '.75rem', padding: '.6rem .85rem', fontSize: '.75rem', color: '#5b8af0' }}>
          💡 Active karne ke liye row pe right-click → "Set Active"
        </div>
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create Semester'}
        </button>
      </div>
    </Modal>
  )
}

/* ── Delete Modal ────────────────────────────────── */
function DeleteModal({ sem, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Semester?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '.35rem' }}><strong style={{ color: 'var(--neu-text-primary)' }}>{sem?.name}</strong></p>
        <p style={{ fontSize: '.75rem', color: '#ef4444', marginBottom: '1.6rem' }}>Linked offerings remove ho jayenge.</p>
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

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function SemestersPage() {
  const [semesters,   setSemesters]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activating,  setActivating]  = useState(null)
  const [showForm,    setShowForm]    = useState(false)
  const [editSem,     setEditSem]     = useState(null)
  const [viewSem,     setViewSem]     = useState(null)
  const [delTarget,   setDelTarget]   = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetch_ = async () => {
    setLoading(true)
    try { const r = await adminAPI.getSemesters(); setSemesters(r.data.data?.semesters || []) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch_() }, [])

  const handleActivate = async (sem) => {
    if (sem.is_active) { toast('Already active', { icon: 'ℹ️' }); return }
    setActivating(sem.id)
    try { await adminAPI.activateSemester(sem.id); toast.success(`"${sem.name}" active!`); fetch_() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActivating(null) }
  }

  const handleDelete = async () => {
    setDeletingId(delTarget.id)
    try { await adminAPI.deleteSemester?.(delTarget.id); toast.success('Semester deleted'); setDelTarget(null); fetch_() }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const ctxItems = (sem) => [
    { label: 'View Details',                         icon: Eye,    onClick: s => setViewSem(s) },
    { label: 'Edit',                                 icon: Edit2,  onClick: s => { setEditSem(s); setShowForm(true) } },
    { label: sem?.is_active ? 'Active ✓' : 'Set Active', icon: Zap,   onClick: handleActivate, disabled: sem?.is_active },
    { divider: true },
    { label: 'Delete',                               icon: Trash2, onClick: s => setDelTarget(s), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Semesters</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{semesters.length} semesters configured</p>
          </div>
          <button onClick={() => { setEditSem(null); setShowForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={16} /> Add Semester
          </button>
        </div>

        {/* Hint */}
        <div style={{ background: 'var(--neu-surface-deep)', border: '1px solid var(--neu-border)', borderRadius: '.8rem', padding: '.55rem .9rem', fontSize: '.72rem', color: 'var(--neu-text-ghost)', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
          ⊞ Right-click on a row to view, edit, activate, or delete
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.1rem', padding: '1.1rem 1.3rem', display: 'flex', gap: '1rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '.75rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.5rem', justifyContent: 'center' }}>
                  <div style={{ height: 14, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '35%', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '55%', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <Calendar size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No semesters yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
            {semesters.map(sem => {
              const { label, c, bg, Icon } = getStatus(sem)
              return (
                <div
                  key={sem.id}
                  className={`sem-row${sem.is_active ? ' active-sem' : ''}`}
                  onContextMenu={e => openMenu(e, sem)}
                >
                  {/* Active left stripe */}
                  {sem.is_active && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#22a06b', borderRadius: '1.1rem 0 0 1.1rem' }} />
                  )}

                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: '.8rem', background: sem.is_active ? 'rgba(34,160,107,.12)' : 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: sem.is_active ? 'none' : 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
                    <Calendar size={19} style={{ color: sem.is_active ? '#22a06b' : 'var(--neu-text-ghost)' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', flexWrap: 'wrap', marginBottom: '.25rem' }}>
                      <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{sem.name}</h3>
                      {sem.code && (
                        <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', border: '1px solid var(--neu-border)', borderRadius: '.4rem', fontFamily: 'monospace' }}>{sem.code}</span>
                      )}
                      <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .45rem', background: bg, color: c, borderRadius: '.4rem', display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
                        <Icon size={10} />{label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <Calendar size={11} />{fmt(sem.start_date)} → {fmt(sem.end_date)}
                      </span>
                      {sem.registration_start && (
                        <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                          <Clock size={11} />Reg: {fmt(sem.registration_start)} → {fmt(sem.registration_end)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* right-click hint */}
                  <span style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)', opacity: .4, flexShrink: 0 }}>⊞</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Context menu */}
        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

        {/* Modals */}
        {viewSem    && <ViewModal     sem={viewSem}   onClose={() => setViewSem(null)} />}
        {showForm   && <SemesterModal sem={editSem}   onClose={() => { setShowForm(false); setEditSem(null) }} onSuccess={fetch_} />}
        {delTarget  && <DeleteModal   sem={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}