// ═══════════════════════════════════════════════════════════════
//  GatesPage.jsx  —  frontend/src/pages/admin/GatesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Shield, Camera, Clock, Wifi, WifiOff, ScanFace,
  Loader2, X, Settings, ChevronDown, ChevronRight,
  Eye, Edit2, Trash2, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .gate-card {
    border-radius: 1.2rem;
    border: 1px solid var(--neu-border);
    background: var(--neu-surface);
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    transition: transform .22s ease, box-shadow .22s ease;
    overflow: hidden;
  }
  .gate-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -5px -5px 16px var(--neu-shadow-light);
  }
  .gate-card.inactive { opacity: .65; }
  .gate-ring {
    position: absolute; inset: 0; border-radius: 1.2rem;
    border: 1.5px solid transparent;
    transition: border-color .22s ease;
    pointer-events: none;
  }
  .gate-card:hover .gate-ring { border-color: rgba(91,138,240,.25); }
`

/* ─── Shared ─────────────────────────────────────── */
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
  main:      { label: 'Main',      c: '#5b8af0', bg: 'rgba(91,138,240,.12)'  },
  secondary: { label: 'Secondary', c: '#8b5cf6', bg: 'rgba(139,92,246,.12)'  },
  emergency: { label: 'Emergency', c: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
  service:   { label: 'Service',   c: '#f97316', bg: 'rgba(249,115,22,.12)'  },
}
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 440 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ gate, detail, onClose }) {
  const tc = GATE_TYPE_CFG[gate.gate_type] || GATE_TYPE_CFG.main
  const isOnline = gate.last_ping && Date.now() - new Date(gate.last_ping).getTime() < 5 * 60 * 1000

  return (
    <Modal maxW={480}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Cameras',  value: gate.total_cameras || 0 },
            { label: 'Status',   value: gate.is_active ? 'Active' : 'Inactive' },
            { label: 'Location', value: gate.location || 'N/A' },
          ].map(r => (
            <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.65rem .9rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', textAlign: 'center' }}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
              <p style={{ fontSize: '.88rem', color: 'var(--neu-text-primary)', fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Cameras list */}
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

        {/* Schedule */}
        {detail?.schedules?.length > 0 && (
          <div>
            <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Schedule</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              {detail.schedules.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.45rem .85rem', background: 'var(--neu-surface-deep)', borderRadius: '.65rem', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--neu-text-secondary)', textTransform: 'capitalize', width: 90 }}>{s.day}</span>
                  {s.is_holiday
                    ? <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#ef4444' }}>Holiday / Closed</span>
                    : <span style={{ fontSize: '.75rem', color: 'var(--neu-text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{s.open_time} – {s.close_time}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {gate.ip_address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.7rem', color: 'var(--neu-text-ghost)', paddingTop: '.3rem', borderTop: '1px solid var(--neu-border)' }}>
            <Settings size={11} />{gate.device_model || 'Unknown device'} · {gate.ip_address}
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
  const [form, setForm] = useState({ gate_name: '', gate_code: '', gate_type: 'main', location: '', is_active: true })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.gate_name || !form.gate_code) { toast.error('Name and code required'); return }
    setLoading(true)
    try { await adminAPI.createGate(form); toast.success('Gate created!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
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
          <F label="Location">
            <input style={iS} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Block A, Main Road" />
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
  const [form, setForm] = useState({ camera_name: '', camera_type: 'entry', is_primary: true, rtsp_url: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.camera_name) { toast.error('Camera name required'); return }
    setLoading(true)
    try { await adminAPI.addCamera(gate.id, form); toast.success('Camera added!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={400}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Add Camera</h2>
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.1rem' }}>{gate.gate_name}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        <F label="Camera Name *"><input style={iS} value={form.camera_name} onChange={e => set('camera_name', e.target.value)} placeholder="Entry Camera 1" autoFocus /></F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Type">
            <select style={iS} value={form.camera_type} onChange={e => set('camera_type', e.target.value)}>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="both">Both</option>
            </select>
          </F>
          <label style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', paddingBottom: '.1rem', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)} style={{ width: 15, height: 15, accentColor: '#5b8af0', marginBottom: '.55rem' }} />
            <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--neu-text-secondary)', marginBottom: '.5rem' }}>Primary</span>
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
    DAYS.map(day => ({ day, open_time: '08:00', close_time: '17:00', is_holiday: false }))
  )
  const [loading, setLoading] = useState(false)
  const upd = (i, k, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r))

  const submit = async () => {
    setLoading(true)
    try { await adminAPI.setGateSchedule(gate.id, { schedules: rows }); toast.success('Schedule saved!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={480}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Set Schedule</h2>
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.1rem' }}>{gate.gate_name}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '.9rem 1.2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
        {rows.map((row, i) => (
          <div key={row.day} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr auto', gap: '.5rem', alignItems: 'center', padding: '.5rem .75rem', background: row.is_holiday ? 'rgba(239,68,68,.06)' : 'var(--neu-surface-deep)', borderRadius: '.75rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--neu-text-secondary)', textTransform: 'capitalize' }}>{row.day}</span>
            <input type="time" value={row.open_time}  onChange={e => upd(i, 'open_time',  e.target.value)} disabled={row.is_holiday} style={{ ...iS, padding: '.35rem .6rem', fontSize: '.78rem', opacity: row.is_holiday ? .35 : 1 }} />
            <input type="time" value={row.close_time} onChange={e => upd(i, 'close_time', e.target.value)} disabled={row.is_holiday} style={{ ...iS, padding: '.35rem .6rem', fontSize: '.78rem', opacity: row.is_holiday ? .35 : 1 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '.3rem', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
              <input type="checkbox" checked={row.is_holiday} onChange={e => upd(i, 'is_holiday', e.target.checked)} style={{ width: 14, height: 14, accentColor: '#ef4444' }} />
              <span style={{ fontSize: '.65rem', fontWeight: 700, color: row.is_holiday ? '#ef4444' : 'var(--neu-text-ghost)' }}>Off</span>
            </label>
          </div>
        ))}
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 4px 14px rgba(34,160,107,.32)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Save Schedule
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Confirm ─────────────────────────────── */
function DeleteModal({ gate, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={380}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Gate?</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', marginBottom: '1.5rem' }}>
          "<strong style={{ color: 'var(--neu-text-primary)' }}>{gate?.gate_name}</strong>" aur uski saari cameras delete ho jayengi.
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#f26b6b,#d94f4f)', boxShadow: '0 4px 14px rgba(242,107,107,.28)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Gate Card ──────────────────────────────────── */
function GateCard({ gate, onContextMenu, onRefresh }) {
  const navigate   = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [detail,   setDetail]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [modal,    setModal]    = useState(null) // 'camera' | 'schedule'

  const tc       = GATE_TYPE_CFG[gate.gate_type] || GATE_TYPE_CFG.main
  const isOnline = gate.last_ping && Date.now() - new Date(gate.last_ping).getTime() < 5 * 60 * 1000

  const loadDetail = async () => {
    if (detail) { setExpanded(p => !p); return }
    setLoading(true)
    try {
      const res = await adminAPI.getGate(gate.id)
      setDetail(res.data.data)
      setExpanded(true)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to load gate') }
    finally { setLoading(false) }
  }

  const openKiosk = () => navigate(`/admin/gate-attendance?gate_id=${gate.id}&camera_id=${gate.cameras?.[0]?.id ?? 1}&direction=in`)

  return (
    <div className={`gate-card${gate.is_active ? '' : ' inactive'}`} onContextMenu={onContextMenu} style={{ position: 'relative' }}>
      <div className="gate-ring" />

      {/* Card Header */}
      <div style={{ padding: '1.1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '.9rem' }}>
        {/* Icon */}
        <div style={{ width: 46, height: 46, borderRadius: '.95rem', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={20} style={{ color: tc.c }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '.92rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{gate.gate_name}</h3>
            <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .45rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', borderRadius: '.4rem', fontFamily: 'monospace', border: '1px solid var(--neu-border)' }}>{gate.gate_code}</span>
            <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.15rem .5rem', background: tc.bg, color: tc.c, borderRadius: '.4rem', textTransform: 'capitalize' }}>{tc.label}</span>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.3rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.72rem', fontWeight: 600, color: isOnline ? '#22a06b' : 'var(--neu-text-ghost)' }}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}{isOnline ? 'Online' : 'Offline'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.7rem', color: 'var(--neu-text-ghost)' }}>
              <Camera size={11} />{gate.total_cameras || 0} cameras
            </span>
            {gate.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.7rem', color: 'var(--neu-text-ghost)' }}>
                <MapPin size={10} />{gate.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            <button onClick={e => { e.stopPropagation(); setModal('camera') }} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .7rem', background: 'var(--neu-surface-deep)', border: '1px solid var(--neu-border)', boxShadow: '3px 3px 8px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)', borderRadius: '.6rem', fontSize: '.7rem', fontWeight: 600, color: '#5b8af0', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s ease' }}>
              <Camera size={11} /> Camera
            </button>
            <button onClick={e => { e.stopPropagation(); setModal('schedule') }} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .7rem', background: 'var(--neu-surface-deep)', border: '1px solid var(--neu-border)', boxShadow: '3px 3px 8px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)', borderRadius: '.6rem', fontSize: '.7rem', fontWeight: 600, color: '#22a06b', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s ease' }}>
              <Clock size={11} /> Schedule
            </button>
            <button onClick={e => { e.stopPropagation(); loadDetail() }} disabled={loading} style={{ width: 30, height: 30, background: 'var(--neu-surface-deep)', border: '1px solid var(--neu-border)', boxShadow: '3px 3px 8px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)', borderRadius: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .15s ease' }}>
              {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>
          <button onClick={e => { e.stopPropagation(); openKiosk() }} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.4rem .85rem', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 3px 10px rgba(34,160,107,.3)', borderRadius: '.65rem', border: 'none', fontSize: '.72rem', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <ScanFace size={12} /> Open Kiosk
          </button>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && detail && (
        <div style={{ padding: '.8rem 1.2rem 1rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Cameras */}
          <div>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.45rem' }}>Cameras ({detail.cameras?.length || 0})</p>
            {detail.cameras?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {detail.cameras.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.4rem .65rem', background: 'var(--neu-surface)', borderRadius: '.6rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)' }}>
                    <Camera size={11} style={{ color: 'var(--neu-text-ghost)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.camera_name}</p>
                      <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', textTransform: 'capitalize' }}>{c.camera_type}{c.is_primary ? ' · Primary' : ''}</p>
                    </div>
                    <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', background: c.status === 'active' ? 'rgba(34,160,107,.12)' : 'rgba(239,68,68,.1)', color: c.status === 'active' ? '#22a06b' : '#ef4444', borderRadius: '.35rem' }}>{c.status}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)', fontStyle: 'italic', opacity: .6 }}>No cameras yet</p>}
          </div>

          {/* Schedule */}
          <div>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.45rem' }}>Schedule ({detail.schedules?.length || 0} days)</p>
            {detail.schedules?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                {detail.schedules.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.72rem' }}>
                    <span style={{ color: 'var(--neu-text-secondary)', fontWeight: 600, textTransform: 'capitalize', width: 80 }}>{s.day}</span>
                    {s.is_holiday
                      ? <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '.68rem' }}>Closed</span>
                      : <span style={{ color: 'var(--neu-text-primary)', fontFamily: 'monospace', fontWeight: 500, fontSize: '.68rem' }}>{s.open_time} – {s.close_time}</span>
                    }
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)', fontStyle: 'italic', opacity: .6 }}>No schedule yet</p>}
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {modal === 'camera'   && <CameraModal   gate={gate} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); setDetail(null); setExpanded(false) }} />}
      {modal === 'schedule' && <ScheduleModal gate={gate} onClose={() => setModal(null)} onSuccess={() => { onRefresh(); setDetail(null); setExpanded(false) }} />}
    </div>
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

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchGates = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getGates()
      setGates(res.data.data?.gates || [])
    } catch { toast.error('Failed to load gates') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGates() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.updateGate(deleteTarget.id, { is_active: false }) // soft-delete / use actual delete if available
      toast.success('Gate removed'); setDeleteTarget(null); fetchGates()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleView = async (gate) => {
    setViewTarget(gate)
    try {
      const res = await adminAPI.getGate(gate.id)
      setViewDetail(res.data.data)
    } catch {}
  }

  const activeCount = gates.filter(g => g.is_active).length

  const ctxItems = (g) => [
    { label: 'View Details', icon: Eye,   onClick: gg => handleView(gg) },
    { divider: true },
    { label: 'Delete Gate',  icon: Trash2, onClick: gg => setDeleteTarget(gg), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Campus Gates</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{gates.length} gates · {activeCount} active</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={16} /> Add Gate
          </button>
        </div>

        {/* Stats tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem' }}>
          {[
            { label: 'Total Gates',  value: gates.length,                                         c: 'var(--neu-text-primary)' },
            { label: 'Active',       value: activeCount,                                           c: '#22a06b' },
            { label: 'Total Cameras',value: gates.reduce((s, g) => s + (g.total_cameras || 0), 0), c: '#5b8af0' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1rem', padding: '.9rem 1.1rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.55rem', fontWeight: 800, color: s.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Gate cards */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 90, background: 'var(--neu-surface)', borderRadius: '1.2rem', border: '1px solid var(--neu-border)', boxShadow: '6px 6px 16px var(--neu-shadow-dark)', animation: 'pulse 1.5s infinite' }} />)
        ) : gates.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <Shield size={42} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto 1rem', opacity: .15, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No gates configured yet</p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>Click "Add Gate" to add a campus gate</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {gates.map(g => <GateCard key={g.id} gate={g} onContextMenu={e => openMenu(e, g)} onRefresh={fetchGates} />)}
          </div>
        )}

        {/* Context menu */}
        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

        {/* Modals */}
        {viewTarget   && <ViewModal    gate={viewTarget}   detail={viewDetail}   onClose={() => { setViewTarget(null); setViewDetail(null) }} />}
        {showCreate   && <CreateGateModal onClose={() => setShowCreate(false)}   onSuccess={fetchGates} />}
        {deleteTarget && <DeleteModal  gate={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />}
      </div>
    </>
  )
}