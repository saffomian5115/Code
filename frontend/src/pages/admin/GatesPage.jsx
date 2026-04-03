// ═══════════════════════════════════════════════════════════════
//  GatesPage.jsx  —  frontend/src/pages/admin/GatesPage.jsx
//  Fixed: Portal dropdown (z-index ok), click anywhere on card,
//  all menu options working with backend
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Shield, Camera, Clock, Wifi, WifiOff, ScanFace,
  Loader2, X, Settings, ChevronDown, ChevronUp,
  Eye, Trash2, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .gate-card {
    border-radius: 1.2rem;
    border: 1px solid var(--neu-border);
    background: var(--neu-surface);
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    position: relative;
    cursor: pointer;
    user-select: none;
  }
  .gate-card:hover {
    transform: translateY(-3px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -5px -5px 16px var(--neu-shadow-light);
    border-color: rgba(91,138,240,.25);
  }
  .gate-card.inactive { opacity: .6; }
  .gate-card.menu-open {
    border-color: rgba(91,138,240,.4);
    box-shadow: 0 0 0 2px rgba(91,138,240,.15), 6px 6px 16px var(--neu-shadow-dark);
  }

  /* Portal dropdown — rendered into body, always on top */
  .gate-portal-menu {
    position: fixed;
    width: 220px;
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1rem;
    box-shadow:
      12px 12px 32px rgba(0,0,0,.22),
      -4px -4px 14px rgba(255,255,255,.06),
      0 0 0 1px rgba(255,255,255,.06);
    padding: .35rem;
    z-index: 99999;
    animation: gate-pop .15s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes gate-pop {
    from { opacity:0; transform: scale(0.88) translateY(-8px); }
    to   { opacity:1; transform: scale(1)    translateY(0);    }
  }
  .gate-menu-item {
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .55rem .75rem;
    border-radius: .65rem;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    font-size: .8rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: var(--neu-text-secondary);
    text-align: left;
    transition: background .1s, color .1s;
  }
  .gate-menu-item:hover {
    background: var(--neu-surface-deep);
    color: var(--neu-text-primary);
  }
  .gate-menu-item.danger { color: #ef4444; }
  .gate-menu-item.danger:hover { background: rgba(242,107,107,.1); color: #ef4444; }
  .gate-menu-divider { height: 1px; background: var(--neu-border); margin: .3rem .35rem; }

  @keyframes spin { to { transform: rotate(360deg) } }
`

/* ─── Shared input style ─────────────────────────── */
const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}

const F = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const GATE_TYPE_CFG = {
  main:       { label: 'Main',       c: '#5b8af0', bg: 'rgba(91,138,240,.13)'  },
  department: { label: 'Department', c: '#8b5cf6', bg: 'rgba(139,92,246,.13)'  },
  lab:        { label: 'Lab',        c: '#22a06b', bg: 'rgba(34,160,107,.13)'  },
  library:    { label: 'Library',    c: '#f59e0b', bg: 'rgba(245,158,11,.13)'  },
  hostel:     { label: 'Hostel',     c: '#f97316', bg: 'rgba(249,115,22,.13)'  },
}
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

/* ═══════════════════════════════════════════════════
   PORTAL DROPDOWN — renders at document.body
   so it's never clipped by any ancestor overflow
═══════════════════════════════════════════════════ */
function PortalDropdown({ anchorEl, onClose, items }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Position relative to the anchor element
  useEffect(() => {
    if (!anchorEl) return
    const rect = anchorEl.getBoundingClientRect()
    // Place menu below-right of the card
    // But clamp to viewport
    const menuW = 220
    let left = rect.right - menuW
    let top  = rect.bottom + 6
    if (left < 8) left = 8
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8
    if (top + 280 > window.innerHeight) top = rect.top - 280 // flip up if no space
    setPos({ top, left })
  }, [anchorEl])

  // Close on outside click or Escape
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && e.target !== anchorEl && !anchorEl?.contains(e.target)) {
        onClose()
      }
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    // Small delay so the triggering click doesn't immediately close
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('keydown', onKey)
    }, 50)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, anchorEl])

  return createPortal(
    <div
      ref={ref}
      className="gate-portal-menu"
      style={{ top: pos.top, left: pos.left }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (!item) return <div key={i} className="gate-menu-divider" />
        return (
          <button
            key={item.label}
            className={`gate-menu-item${item.danger ? ' danger' : ''}`}
            onClick={() => { onClose(); item.onClick() }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '.5rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item.danger ? 'rgba(242,107,107,.12)'
                : item.color ? `${item.color}15`
                : 'var(--neu-surface-deep)',
            }}>
              <item.icon size={13} style={{ color: item.danger ? '#ef4444' : item.color || 'var(--neu-text-muted)' }} />
            </div>
            {item.label}
          </button>
        )
      })}
    </div>,
    document.body
  )
}

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 440 }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && e.stopPropagation()}
    >
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Details Modal ─────────────────────────── */
function ViewModal({ gate, detail, onClose }) {
  const tc = GATE_TYPE_CFG[gate.gate_type] || GATE_TYPE_CFG.main
  const isOnline = gate.last_ping && Date.now() - new Date(gate.last_ping).getTime() < 5 * 60 * 1000

  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', gap: '.85rem', alignItems: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: '.95rem', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={20} style={{ color: tc.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{gate.gate_name}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', borderRadius: '.4rem', fontFamily: 'monospace' }}>{gate.gate_code}</span>
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: tc.bg, color: tc.c, borderRadius: '.4rem', textTransform: 'capitalize' }}>{tc.label}</span>
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: isOnline ? 'rgba(34,160,107,.1)' : 'var(--neu-surface-deep)', color: isOnline ? '#22a06b' : 'var(--neu-text-ghost)', borderRadius: '.4rem' }}>{isOnline ? '● Online' : '○ Offline'}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', flexShrink: 0 }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1rem 1.4rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem' }}>
          {[
            { label: 'Cameras',  value: detail?.cameras?.length ?? gate.total_cameras ?? 0 },
            { label: 'Status',   value: gate.is_active ? 'Active' : 'Inactive' },
            { label: 'Type',     value: tc.label },
          ].map(r => (
            <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.65rem .9rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)', textAlign: 'center' }}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{r.label}</p>
              <p style={{ fontSize: '.88rem', color: 'var(--neu-text-primary)', fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>{r.value}</p>
            </div>
          ))}
        </div>

        {detail?.cameras?.length > 0 && (
          <div>
            <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Cameras ({detail.cameras.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              {detail.cameras.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .85rem', background: 'var(--neu-surface-deep)', borderRadius: '.75rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)' }}>
                  <Camera size={13} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--neu-text-primary)' }}>{c.camera_name}</p>
                    <p style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)', textTransform: 'capitalize' }}>{c.camera_type}{c.is_primary ? ' · Primary' : ''}</p>
                  </div>
                  <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .45rem', background: c.status === 'active' ? 'rgba(34,160,107,.1)' : 'rgba(239,68,68,.1)', color: c.status === 'active' ? '#22a06b' : '#ef4444', borderRadius: '.4rem' }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail?.schedules?.length > 0 && (
          <div>
            <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Schedule</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              {detail.schedules.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.45rem .85rem', background: 'var(--neu-surface-deep)', borderRadius: '.65rem' }}>
                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--neu-text-secondary)', textTransform: 'capitalize', width: 90 }}>{s.day || s.day_of_week}</span>
                  {s.is_holiday
                    ? <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#ef4444' }}>Holiday / Closed</span>
                    : <span style={{ fontSize: '.75rem', color: 'var(--neu-text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{s.open_time} – {s.close_time}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {(gate.ip_address || gate.location_description) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', paddingTop: '.3rem', borderTop: '1px solid var(--neu-border)', fontSize: '.7rem', color: 'var(--neu-text-ghost)' }}>
            {gate.location_description && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><MapPin size={11} />{gate.location_description}</span>}
            {gate.ip_address && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><Settings size={11} />{gate.ip_address}</span>}
            {gate.device_model && <span>{gate.device_model}</span>}
          </div>
        )}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Create Gate Modal ──────────────────────────── */
function CreateGateModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ gate_name: '', gate_code: '', gate_type: 'main', location_description: '', is_active: true })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.gate_name.trim() || !form.gate_code.trim()) { toast.error('Name and code are required'); return }
    setLoading(true)
    try {
      await adminAPI.createGate(form)
      toast.success('Gate created successfully!')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create gate')
    } finally { setLoading(false) }
  }

  return (
    <Modal>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={15} style={{ color: '#5b8af0' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Add New Gate</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Gate Name *"><input style={iS} value={form.gate_name} onChange={e => set('gate_name', e.target.value)} placeholder="Main Entrance" autoFocus /></F>
          <F label="Gate Code *"><input style={iS} value={form.gate_code} onChange={e => set('gate_code', e.target.value.toUpperCase())} placeholder="GATE-01" /></F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Gate Type">
            <select style={iS} value={form.gate_type} onChange={e => set('gate_type', e.target.value)}>
              {Object.entries(GATE_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </F>
          <F label="Location Description">
            <input style={iS} value={form.location_description} onChange={e => set('location_description', e.target.value)} placeholder="Block A, Main Road" />
          </F>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.65rem .9rem', background: 'var(--neu-surface-deep)', borderRadius: '.75rem', cursor: 'pointer', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)', userSelect: 'none' }}>
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: 15, height: 15, accentColor: '#5b8af0' }} />
          <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--neu-text-secondary)' }}>Gate is active</span>
        </label>
      </div>
      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Create Gate
        </button>
      </div>
    </Modal>
  )
}

/* ─── Add Camera Modal ───────────────────────────── */
function CameraModal({ gate, onClose, onSuccess }) {
  const [form, setForm] = useState({ camera_name: '', camera_type: 'both', is_primary: true, rtsp_url: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.camera_name.trim()) { toast.error('Camera name required'); return }
    setLoading(true)
    try {
      await adminAPI.addCamera(gate.id, form)
      toast.success('Camera added successfully!')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add camera')
    } finally { setLoading(false) }
  }

  return (
    <Modal maxW={400}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Add Camera</h2>
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.15rem' }}>{gate.gate_name}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        <F label="Camera Name *"><input style={iS} value={form.camera_name} onChange={e => set('camera_name', e.target.value)} placeholder="Entry Camera 1" autoFocus /></F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Direction Type">
            <select style={iS} value={form.camera_type} onChange={e => set('camera_type', e.target.value)}>
              <option value="entry">Entry Only</option>
              <option value="exit">Exit Only</option>
              <option value="both">Both</option>
            </select>
          </F>
          <label style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', paddingBottom: '.1rem', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} style={{ width: 15, height: 15, accentColor: '#5b8af0', marginBottom: '.55rem' }} />
            <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--neu-text-secondary)', marginBottom: '.5rem' }}>Set as Primary</span>
          </label>
        </div>
        <F label="RTSP URL (optional)"><input style={iS} value={form.rtsp_url} onChange={e => set('rtsp_url', e.target.value)} placeholder="rtsp://192.168.1.x/stream" /></F>
      </div>
      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Add Camera
        </button>
      </div>
    </Modal>
  )
}

/* ─── Schedule Modal ─────────────────────────────── */
function ScheduleModal({ gate, onClose, onSuccess }) {
  const [rows, setRows] = useState(
    DAYS.map(day => ({ day_of_week: day, open_time: '08:00', close_time: '17:00', is_holiday: false }))
  )
  const [loading, setLoading] = useState(false)
  const upd = (i, k, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r))

  const submit = async () => {
    setLoading(true)
    try {
      // Backend: POST /gates/{gate_id}/schedules  (one day at a time, upserts existing)
      for (const row of rows) {
        await adminAPI.addSchedule(gate.id, row)
      }
      toast.success('Schedule saved!')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save schedule')
    } finally { setLoading(false) }
  }

  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Gate Schedule</h2>
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.15rem' }}>{gate.gate_name} — set open/close times per day</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '.9rem 1.2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '.32rem' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr 1fr 52px', gap: '.5rem', padding: '0 .75rem .2rem', fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          <span>Day</span><span>Open</span><span>Close</span><span>Off</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.day_of_week} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 1fr 52px', gap: '.5rem', alignItems: 'center', padding: '.45rem .75rem', background: row.is_holiday ? 'rgba(239,68,68,.06)' : 'var(--neu-surface-deep)', borderRadius: '.75rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)', border: row.is_holiday ? '1px solid rgba(239,68,68,.18)' : '1px solid transparent' }}>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: row.is_holiday ? '#ef4444' : 'var(--neu-text-secondary)', textTransform: 'capitalize' }}>{row.day_of_week}</span>
            <input type="time" value={row.open_time} onChange={e => upd(i, 'open_time', e.target.value)} disabled={row.is_holiday} style={{ ...iS, padding: '.38rem .6rem', fontSize: '.8rem', opacity: row.is_holiday ? .3 : 1 }} />
            <input type="time" value={row.close_time} onChange={e => upd(i, 'close_time', e.target.value)} disabled={row.is_holiday} style={{ ...iS, padding: '.38rem .6rem', fontSize: '.8rem', opacity: row.is_holiday ? .3 : 1 }} />
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={row.is_holiday} onChange={e => upd(i, 'is_holiday', e.target.checked)} style={{ width: 15, height: 15, accentColor: '#ef4444' }} />
            </label>
          </div>
        ))}
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 4px 14px rgba(34,160,107,.32)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Save Schedule
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Confirm Modal ───────────────────────── */
function DeleteModal({ gate, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={380}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 54, height: 54, borderRadius: '1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', boxShadow: 'inset 3px 3px 8px rgba(239,68,68,.15)' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '.96rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Gate?</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{gate?.gate_name}</strong> aur uski saari cameras
          aur schedule permanently delete ho jayegi. Ye action undo nahi ho sakti.
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.65rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.65rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#f26b6b,#d94f4f)', boxShadow: '0 4px 14px rgba(242,107,107,.28)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Gate Card ──────────────────────────────────── */
function GateCard({ gate, onRefresh, onRequestDelete, onRequestView }) {
  const navigate   = useNavigate()
  const cardRef    = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal,    setModal]    = useState(null) // 'camera' | 'schedule'

  const tc = GATE_TYPE_CFG[gate.gate_type] || GATE_TYPE_CFG.main
  const isOnline = gate.last_ping && Date.now() - new Date(gate.last_ping).getTime() < 5 * 60 * 1000

  // Open kiosk: use first camera if available, otherwise camera_id=1
  const openKiosk = useCallback(async () => {
    let cameraId = 1
    try {
      const res = await adminAPI.getGate(gate.id)
      cameraId = res.data.data?.cameras?.[0]?.id ?? 1
    } catch {}
    navigate(`/admin/gate-attendance?gate_id=${gate.id}&camera_id=${cameraId}&direction=in`)
  }, [gate.id, navigate])

  const handleViewDetail = useCallback(async () => {
    try {
      const res = await adminAPI.getGate(gate.id)
      onRequestView(gate, res.data.data)
    } catch {
      onRequestView(gate, null)
    }
  }, [gate, onRequestView])

  const refresh = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  // Menu items — all wired to backend
  const menuItems = [
    { icon: Eye,      label: 'View Details',  color: null,      onClick: handleViewDetail,             danger: false },
    { icon: Camera,   label: 'Add Camera',    color: '#5b8af0', onClick: () => setModal('camera'),     danger: false },
    { icon: Clock,    label: 'Set Schedule',  color: '#22a06b', onClick: () => setModal('schedule'),   danger: false },
    { icon: ScanFace, label: 'Open Kiosk',    color: '#22d3a5', onClick: openKiosk,                    danger: false },
    null, // divider
    { icon: Trash2,   label: 'Delete Gate',   color: '#ef4444', onClick: () => onRequestDelete(gate),  danger: true  },
  ]

  return (
    <>
      {/* Card — clicking anywhere opens menu */}
      <div
        ref={cardRef}
        className={`gate-card${gate.is_active ? '' : ' inactive'}${menuOpen ? ' menu-open' : ''}`}
        onClick={() => setMenuOpen(p => !p)}
        title="Click to open options"
      >
        <div style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.9rem' }}>
          {/* Type icon */}
          <div style={{ width: 46, height: 46, borderRadius: '.95rem', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' }}>
            <Shield size={20} style={{ color: tc.c }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '.92rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', margin: 0 }}>{gate.gate_name}</h3>
              <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .45rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', borderRadius: '.4rem', fontFamily: 'monospace', border: '1px solid var(--neu-border)' }}>{gate.gate_code}</span>
              <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.15rem .5rem', background: tc.bg, color: tc.c, borderRadius: '.4rem', textTransform: 'capitalize' }}>{tc.label}</span>
              {!gate.is_active && <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .45rem', background: 'rgba(239,68,68,.1)', color: '#ef4444', borderRadius: '.4rem' }}>Inactive</span>}
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.72rem', fontWeight: 600, color: isOnline ? '#22a06b' : 'var(--neu-text-ghost)' }}>
                {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}{isOnline ? 'Online' : 'Offline'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.7rem', color: 'var(--neu-text-ghost)' }}>
                <Camera size={11} />{gate.total_cameras || 0} camera{gate.total_cameras !== 1 ? 's' : ''}
              </span>
              {gate.location_description && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.7rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  <MapPin size={10} />{gate.location_description}
                </span>
              )}
            </div>
          </div>

          {/* Click indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flexShrink: 0, color: menuOpen ? '#5b8af0' : 'var(--neu-text-ghost)', fontSize: '.7rem', fontWeight: 600, transition: 'color .15s' }}>
            {menuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Portal dropdown — rendered at body level, always on top */}
      {menuOpen && (
        <PortalDropdown
          anchorEl={cardRef.current}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
        />
      )}

      {/* Sub-modals */}
      {modal === 'camera'   && <CameraModal   gate={gate} onClose={() => setModal(null)} onSuccess={() => { setModal(null); refresh() }} />}
      {modal === 'schedule' && <ScheduleModal gate={gate} onClose={() => setModal(null)} onSuccess={() => { setModal(null); refresh() }} />}
    </>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function GatesPage() {
  const [gates,        setGates]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [viewDetail,   setViewDetail]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const fetchGates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getGates()
      setGates(res.data.data?.gates || [])
    } catch {
      toast.error('Failed to load gates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGates() }, [fetchGates])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminAPI.deleteGate(deleteTarget.id)
      toast.success(`"${deleteTarget.gate_name}" deleted!`)
      setDeleteTarget(null)
      fetchGates()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete gate')
    } finally {
      setDeleting(false)
    }
  }

  const activeCount  = gates.filter(g => g.is_active).length
  const totalCameras = gates.reduce((s, g) => s + (g.total_cameras || 0), 0)

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em', margin: 0 }}>Campus Gates</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '3px' }}>
              {gates.length} gates · {activeCount} active · Click any gate card to see options
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            <Plus size={16} /> Add Gate
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem' }}>
          {[
            { label: 'Total Gates',   value: gates.length,  c: 'var(--neu-text-primary)' },
            { label: 'Active',        value: activeCount,   c: '#22a06b' },
            { label: 'Total Cameras', value: totalCameras,  c: '#5b8af0' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1rem', padding: '.9rem 1.1rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Gate Cards */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 88, background: 'var(--neu-surface)', borderRadius: '1.2rem', border: '1px solid var(--neu-border)', boxShadow: '6px 6px 16px var(--neu-shadow-dark)', opacity: .5 }} />
          ))
        ) : gates.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <Shield size={40} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto 1rem', opacity: .15, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', margin: 0 }}>No gates configured yet</p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem' }}>Click "Add Gate" to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {gates.map(g => (
              <GateCard
                key={g.id}
                gate={g}
                onRefresh={fetchGates}
                onRequestDelete={(gate) => setDeleteTarget(gate)}
                onRequestView={(gate, detail) => { setViewTarget(gate); setViewDetail(detail) }}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        {viewTarget   && <ViewModal   gate={viewTarget}   detail={viewDetail} onClose={() => { setViewTarget(null); setViewDetail(null) }} />}
        {showCreate   && <CreateGateModal onClose={() => setShowCreate(false)} onSuccess={fetchGates} />}
        {deleteTarget && <DeleteModal gate={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />}
      </div>
    </>
  )
}