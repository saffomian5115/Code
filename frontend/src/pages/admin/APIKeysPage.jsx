// ═══════════════════════════════════════════════════════════════
//  APIKeysPage.jsx  —  Admin: Gemini API Key Manager
//  Place at: frontend/src/pages/admin/APIKeysPage.jsx
//  Add to App.jsx: <Route path="api-keys" element={<APIKeysPage />} />
//  Add to Sidebar: { label: 'API Keys', icon: KeyRound, to: '/admin/api-keys' }
//  Add to admin.api.js the apiKeysAPI calls (shown at bottom of this file)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  KeyRound, Plus, Trash2, RefreshCw, Power, PowerOff,
  Loader2, AlertTriangle, CheckCircle2, Clock, X,
  Eye, EyeOff, ShieldCheck, Zap, BarChart2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

// ── Neu helpers ───────────────────────────────────────────────
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})
const inputS = {
  width: '100%',
  ...neuInset(),
  padding: '0.7rem 1rem',
  fontSize: '0.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

// ── API helpers ───────────────────────────────────────────────
const keysAPI = {
  list:       ()           => api.get('/admin/api-keys'),
  add:        (key, label) => api.post('/admin/api-keys', { key, label }),
  toggle:     (id)         => api.patch(`/admin/api-keys/${id}/toggle`),
  resetQuota: (id)         => api.patch(`/admin/api-keys/${id}/reset-quota`),
  remove:     (id)         => api.delete(`/admin/api-keys/${id}`),
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div style={{ ...neuInset({ borderRadius: '1rem', padding: '1.1rem 1.25rem', flex: 1, minWidth: 120 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '1.65rem', fontWeight: 900, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</p>
    </div>
  )
}

// ── Add Key Modal ─────────────────────────────────────────────
function AddKeyModal({ onClose, onAdded }) {
  const [key, setKey]     = useState('')
  const [label, setLabel] = useState('')
  const [show, setShow]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!key.trim() || key.trim().length < 10) {
      toast.error('Enter a valid API key (min 10 chars)')
      return
    }
    setLoading(true)
    try {
      await keysAPI.add(key.trim(), label.trim() || `Key ${Date.now()}`)
      toast.success('API key added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add key')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.65)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem', padding: '1.75rem', width: '100%', maxWidth: 480 }), boxShadow: 'var(--neu-raised-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ ...neuInset({ width: 40, height: 40, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
              <KeyRound size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>Add Gemini API Key</h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Get free keys from aistudio.google.com</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Label (optional)</label>
            <input value={label} onChange={e => setLabel(e.target.value)} style={inputS} placeholder="e.g. Key 1, Backup Key, Project Key..." autoFocus />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>API Key *</label>
            <div style={{ position: 'relative' }}>
              <input
                value={key}
                onChange={e => setKey(e.target.value)}
                type={show ? 'text' : 'password'}
                style={{ ...inputS, paddingRight: '2.8rem' }}
                placeholder="AIzaSy..."
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              />
              <button onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Info box */}
          <div style={{ ...neuInset({ borderRadius: '0.75rem', padding: '0.75rem 1rem', borderLeft: '3px solid #5b8af0' }), display: 'flex', gap: '0.6rem' }}>
            <Zap size={13} style={{ color: '#5b8af0', flexShrink: 0, marginTop: '0.1rem' }} />
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-secondary)', lineHeight: 1.55 }}>
              Free tier: <strong>gemini-2.0-flash</strong> = 1500 req/day · <strong>gemini-2.5-flash</strong> = 20/day.
              Add multiple keys — system auto-rotates when quota hits.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button onClick={onClose} style={{ ...inputS, width: 'auto', padding: '0.65rem 1.25rem', cursor: 'pointer', fontWeight: 600, color: 'var(--neu-text-secondary)', textAlign: 'center' }}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !key.trim()}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                padding: '0.65rem', borderRadius: '0.875rem', border: 'none',
                background: key.trim() ? 'linear-gradient(145deg, #5b8af0, #3a6bd4)' : 'var(--neu-surface-deep)',
                color: key.trim() ? '#fff' : 'var(--neu-text-ghost)',
                cursor: loading || !key.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif",
                boxShadow: key.trim() ? '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px rgba(91,138,240,0.35)' : 'none',
                transition: 'all 0.18s',
              }}
            >
              {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={15} />}
              Add Key
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Key Row Card ──────────────────────────────────────────────
function KeyCard({ k, onToggle, onResetQuota, onDelete, busy }) {
  const isExceeded = k.quota_exceeded
  const isActive   = k.active

  const statusColor = isExceeded ? '#f26b6b' : isActive ? '#3ecf8e' : '#94a3b8'
  const statusLabel = isExceeded ? 'Quota Exceeded' : isActive ? 'Available' : 'Disabled'
  const statusBg    = isExceeded ? 'rgba(242,107,107,0.12)' : isActive ? 'rgba(62,207,142,0.12)' : 'rgba(148,163,184,0.1)'

  const cooldownMin = k.cooldown_seconds_left > 0
    ? k.cooldown_seconds_left < 60
      ? `${k.cooldown_seconds_left}s`
      : `${Math.ceil(k.cooldown_seconds_left / 60)}m`
    : null

  return (
    <div style={{
      ...neu({ padding: '1.1rem 1.35rem', position: 'relative', overflow: 'hidden' }),
      transition: 'transform 0.18s, box-shadow 0.18s',
      borderLeft: `3px solid ${statusColor}`,
      opacity: !isActive ? 0.65 : 1,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        {/* Icon */}
        <div style={{ ...neuInset({ width: 42, height: 42, borderRadius: '0.875rem', flexShrink: 0 }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor }}>
          <KeyRound size={17} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>{k.label}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '0.4rem', background: statusBg, color: statusColor }}>
              {isExceeded && <Clock size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />}
              {statusLabel}
              {cooldownMin && ` — ${cooldownMin}`}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>...{k.key_preview?.replace('...', '')}</p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <BarChart2 size={11} /> {k.requests_today} req today
            </span>
            {k.quota_hit_count > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#f5a623', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={11} /> {k.quota_hit_count} quota hits
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {/* Reset quota */}
          {isExceeded && (
            <button
              onClick={() => onResetQuota(k.id)}
              disabled={busy === k.id}
              title="Reset quota cooldown"
              style={{ ...neuInset({ width: 34, height: 34, borderRadius: '0.6rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#5b8af0', transition: 'all 0.15s' }}>
              <RefreshCw size={14} style={busy === k.id ? { animation: 'spin 0.8s linear infinite' } : {}} />
            </button>
          )}

          {/* Toggle */}
          <button
            onClick={() => onToggle(k.id)}
            disabled={busy === k.id}
            title={isActive ? 'Disable key' : 'Enable key'}
            style={{ ...neuInset({ width: 34, height: 34, borderRadius: '0.6rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: isActive ? '#3ecf8e' : '#94a3b8', transition: 'all 0.15s' }}>
            {isActive ? <Power size={14} /> : <PowerOff size={14} />}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(k.id, k.label)}
            disabled={busy === k.id}
            title="Delete key"
            style={{ ...neuInset({ width: 34, height: 34, borderRadius: '0.6rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#f26b6b', transition: 'all 0.15s' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════
export default function APIKeysPage() {
  const [keys, setKeys]         = useState([])
  const [summary, setSummary]   = useState({ total: 0, available: 0, quota_exceeded: 0 })
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState(null)
  const [showAdd, setShowAdd]   = useState(false)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await keysAPI.list()
      const data = res.data.data
      setKeys(data.keys || [])
      setSummary({ total: data.total, available: data.available, quota_exceeded: data.quota_exceeded })
    } catch {
      toast.error('Failed to load API keys')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])
  useEffect(() => {
    const interval = setInterval(fetchKeys, 30000)
    return () => clearInterval(interval)
  }, [fetchKeys])

  const handleToggle = async (id) => {
    setBusy(id)
    try {
      const res = await keysAPI.toggle(id)
      const active = res.data.data?.active
      toast.success(active ? 'Key enabled' : 'Key disabled')
      fetchKeys()
    } catch { toast.error('Failed') } finally { setBusy(null) }
  }

  const handleResetQuota = async (id) => {
    setBusy(id)
    try {
      await keysAPI.resetQuota(id)
      toast.success('Quota reset — key available again')
      fetchKeys()
    } catch { toast.error('Failed') } finally { setBusy(null) }
  }

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return
    setBusy(id)
    try {
      await keysAPI.remove(id)
      toast.success('Key deleted')
      fetchKeys()
    } catch { toast.error('Failed') } finally { setBusy(null) }
  }

  const allOk = summary.available === summary.total && summary.total > 0
  const someExceeded = summary.quota_exceeded > 0

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ ...neuInset({ width: 48, height: 48, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
            <KeyRound size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>Gemini API Keys</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Auto-rotation when quota exceeded · refreshes every 30s</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={fetchKeys} style={{ ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--neu-text-muted)' }}>
            <RefreshCw size={15} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', borderRadius: '0.875rem', border: 'none',
              background: 'linear-gradient(145deg, #5b8af0, #3a6bd4)',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px rgba(91,138,240,0.35)',
            }}>
            <Plus size={15} /> Add Key
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <StatCard label="Total Keys"   value={summary.total}           color="var(--neu-text-primary)" icon={KeyRound} />
        <StatCard label="Available"    value={summary.available}        color="#3ecf8e"                 icon={CheckCircle2} />
        <StatCard label="Quota Hit"    value={summary.quota_exceeded}   color={someExceeded ? '#f26b6b' : '#94a3b8'} icon={AlertTriangle} />
      </div>

      {/* System health banner */}
      {summary.total > 0 && (
        <div style={{
          ...neuInset({ borderRadius: '0.875rem', padding: '0.75rem 1.1rem', marginBottom: '1.25rem', borderLeft: `3px solid ${allOk ? '#3ecf8e' : someExceeded ? '#f5a623' : '#5b8af0'}` }),
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <ShieldCheck size={15} style={{ color: allOk ? '#3ecf8e' : '#f5a623', flexShrink: 0 }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-secondary)' }}>
            {allOk
              ? `All ${summary.total} keys available. AI will auto-rotate to spread load.`
              : someExceeded
              ? `${summary.quota_exceeded} key(s) on cooldown — AI is using the remaining ${summary.available} available key(s).`
              : 'No keys available — AI responses will use fallback message.'}
          </p>
        </div>
      )}

      {/* How rotation works */}
      <div style={{ ...neu({ padding: '1rem 1.35rem', marginBottom: '1.25rem' }) }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>How auto-rotation works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {[
            { step: '1', text: 'AI picks key with fewest requests today' },
            { step: '2', text: 'If 429 quota error → mark key as cooling down' },
            { step: '3', text: 'Next request auto-uses a different key' },
            { step: '4', text: 'Cooldown expires → key becomes available again' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(91,138,240,0.15)', color: '#5b8af0', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.05rem' }}>{s.step}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-secondary)', lineHeight: 1.45 }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keys list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : keys.length === 0 ? (
        <div style={{ ...neu({ padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }) }}>
          <div style={{ ...neuInset({ width: 56, height: 56, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
            <KeyRound size={24} />
          </div>
          <p style={{ fontWeight: 800, color: 'var(--neu-text-secondary)', fontSize: '0.95rem' }}>No API keys yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)', textAlign: 'center', maxWidth: 320 }}>
            Add 7-8 free Gemini keys from <strong>aistudio.google.com</strong> for unlimited AI usage with auto-rotation.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1.5rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer', background: 'linear-gradient(145deg, #5b8af0, #3a6bd4)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", boxShadow: '5px 5px 14px var(--neu-shadow-dark)', marginTop: '0.5rem' }}>
            <Plus size={15} /> Add First Key
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {keys.map(k => (
            <KeyCard
              key={k.id}
              k={k}
              onToggle={handleToggle}
              onResetQuota={handleResetQuota}
              onDelete={handleDelete}
              busy={busy}
            />
          ))}

          <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', textAlign: 'center', marginTop: '0.5rem' }}>
            Tip: Add 7–8 keys for ~10,500 free requests/day (gemini-2.0-flash = 1,500/key/day)
          </p>
        </div>
      )}

      {showAdd && <AddKeyModal onClose={() => setShowAdd(false)} onAdded={fetchKeys} />}
    </div>
  )
}