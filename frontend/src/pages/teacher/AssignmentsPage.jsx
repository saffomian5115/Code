// ═══════════════════════════════════════════════════════════════
//  AssignmentsPage.jsx  —  Teacher Panel  (FIXED)
//  Key fix: submissions now get file_url + file_name from backend.
//  FilePreview + GradeModal use these fields correctly.
//  Replace: frontend/src/pages/teacher/AssignmentsPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, FileText, Loader2, Calendar, Users, Award, X, Clock,
  AlertCircle, CheckCircle, Upload, Eye, Trash2,
  CircleCheck, Download, File, FileArchive, FileImage,
  FileCode, FileJson, FileSpreadsheet,ScanSearch,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'
import api from '../../api/axios'
import AddButton from '../../components/ui/AddButton'
import PlagiarismReportModal from '../../components/teacher/PlagiarismReportModal'


// ─── Backend base URL (same as axios baseURL minus /api/v1) ──────────────────
// The backend mounts  /uploads  as a StaticFiles directory.
// file_url from API is already like  /uploads/assignments/student_1_assign_2_file.pdf
// We prepend the server origin to make it an absolute URL for <img>, <iframe>, etc.
const SERVER_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1')
  .replace('/api/v1', '')   // → "http://127.0.0.1:8000"

/** Turn a relative /uploads/... path into an absolute URL the browser can fetch */
function toAbsoluteUrl(relativeUrl) {
  if (!relativeUrl) return null
  if (relativeUrl.startsWith('http')) return relativeUrl   // already absolute
  return `${SERVER_ORIGIN}${relativeUrl}`
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  .assign-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.4rem;
    position: relative;
    overflow: hidden;
    cursor: context-menu;
    user-select: none;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .assign-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .assign-card:hover .card-accent-border { opacity: 1; }
  .card-accent-border {
    position: absolute; inset: 0; border-radius: 1.25rem;
    pointer-events: none; opacity: 0; transition: opacity 0.25s ease;
  }
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes pulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  .fixed-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(8,12,20,0.85); backdrop-filter: blur(12px);
    z-index: 9999; display: flex; align-items: center;
    justify-content: center; padding: 1rem;
  }
  .grade-modal-container {
    position: fixed; inset: 0;
    background: rgba(8,12,20,0.88); backdrop-filter: blur(14px);
    z-index: 10000; display: flex; align-items: center;
    justify-content: center; padding: 1rem;
  }
  .preview-modal-container {
    position: fixed; inset: 0;
    background: rgba(8,12,20,0.92); backdrop-filter: blur(16px);
    z-index: 10001; display: flex; align-items: center;
    justify-content: center; padding: 1rem;
  }
`

const inputStyle = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '0.75rem',
  padding: '0.6rem 0.9rem', fontSize: '0.85rem',
  color: 'var(--neu-text-primary)', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)'  },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)'  },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)'  },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)'  },
  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   ring: 'rgba(239,68,68,.35)'   },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)'  },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'   },
]

const formatDate     = d => d ? new Date(d).toLocaleDateString('en-PK',  { day:'numeric', month:'short', year:'numeric' }) : '—'
const formatDateTime = d => d ? new Date(d).toLocaleString('en-PK',      { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'
const isOverdue      = d => d && new Date(d) < new Date()

// ─── File icon helper ─────────────────────────────────────────────────────────
function getFileIcon(filename, size = 14) {
  const ext = (filename || '').split('.').pop().toLowerCase()
  if (['pdf'].includes(ext))                                                   return <FileText size={size} />
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext))                   return <FileImage size={size} />
  if (['doc','docx'].includes(ext))                                            return <FileText size={size} />
  if (['xls','xlsx','csv'].includes(ext))                                      return <FileSpreadsheet size={size} />
  if (['zip','rar','7z','tar','gz'].includes(ext))                             return <FileArchive size={size} />
  if (['js','jsx','ts','tsx','py','java','c','cpp','html','css'].includes(ext)) return <FileCode size={size} />
  if (['json','xml'].includes(ext))                                            return <FileJson size={size} />
  return <File size={size} />
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ children, maxW = 520, wide }) {
  return (
    <div className="fixed-modal-backdrop">
      <div style={{
        width: '100%', maxWidth: wide ? 800 : maxW,
        background: 'var(--neu-surface)',
        boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)',
        border: '1px solid var(--neu-border)', borderRadius: '1.5rem',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp .22s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Ring SVG Chart ───────────────────────────────────────────────────────────
function RingChart({ submitted, total, size = 48 }) {
  const r    = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct  = total > 0 ? submitted / total : 0
  const dash = pct * circ
  const color = pct >= 1 ? '#3ecf8e' : pct >= 0.5 ? '#f5a623' : '#5b8af0'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neu-surface-deep)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{submitted}</span>
        <span style={{ fontSize: '0.5rem', color: 'var(--neu-text-ghost)', lineHeight: 1 }}>/{total}</span>
      </div>
    </div>
  )
}

// ─── Assignment Card ──────────────────────────────────────────────────────────
function AssignmentCard({ assignment, pal, onClick, onContextMenu }) {
  const overdue    = isOverdue(assignment.due_date)
  const totalSubs  = assignment.total_submissions ?? 0
  const gradedSubs = assignment.graded_count       ?? 0
  const pendingSubs = totalSubs - gradedSubs
  const enrolledCount = assignment.total_enrolled || Math.max(totalSubs, 1)

  const statusColor = overdue ? '#f26b6b' : '#3ecf8e'
  const statusBg    = overdue ? 'rgba(242,107,107,0.12)' : 'rgba(62,207,142,0.12)'

  return (
    <div className="assign-card" onContextMenu={onContextMenu} onClick={onClick}>
      <div className="card-accent-border" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: pal.c, opacity: 0.8 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.7rem', background: statusBg, color: statusColor, borderRadius: '0.5rem' }}>
            {overdue ? 'Past Due' : 'Active'}
          </span>
          <RingChart submitted={totalSubs} total={enrolledCount} size={44} />
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {assignment.title}
          </h3>
          {assignment.description && (
            <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.2rem' }}>
              {assignment.description}
            </p>
          )}
          {!assignment.description && <div style={{ minHeight: '2.2rem' }} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--neu-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>Due: {formatDate(assignment.due_date)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-secondary)' }}>
              {assignment.total_marks} marks
              {assignment.weightage_percent > 0 && ` · ${assignment.weightage_percent}% weight`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', background: 'rgba(91,138,240,0.1)', color: '#5b8af0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Upload size={9} /> {totalSubs} submitted
            </span>
            {gradedSubs > 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', background: 'rgba(62,207,142,0.1)', color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={9} /> {gradedSubs} graded
              </span>
            )}
            {pendingSubs > 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', background: 'rgba(245,166,35,0.1)', color: '#f5a623', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={9} /> {pendingSubs} pending
              </span>
            )}
          </div>
        </div>
      </div>

      <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', fontSize: '0.55rem', color: 'var(--neu-text-ghost)', opacity: 0.3, pointerEvents: 'none' }}>
        right-click
      </span>
    </div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '1.4rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
      {[85, 95, 60].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 16 : 12, background: 'var(--neu-surface-deep)', borderRadius: 6, width: `${w}%`, marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

// ─── Create Assignment Modal ──────────────────────────────────────────────────
function CreateModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', due_date: '',
    total_marks: 100, weightage_percent: 0,
    file_required: true, allowed_file_types: '.pdf,.docx,.zip', max_file_size: 10,
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.due_date) { toast.error('Title and due date required'); return }
    setLoading(true)
    try {
      await api.post(`/offerings/${offeringId}/assignments`, form)
      toast.success('Assignment created!')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment')
    } finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(155,89,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={15} style={{ color: '#9b59b6' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>New Assignment</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <Field label="Title *"><input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="Assignment title" autoFocus /></Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Assignment details..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Due Date *"><input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inputStyle} /></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e => set('total_marks', Number(e.target.value))} style={inputStyle} min={1} /></Field>
          <Field label="Weightage %"><input type="number" value={form.weightage_percent} onChange={e => set('weightage_percent', Number(e.target.value))} style={inputStyle} min={0} max={100} /></Field>
          <Field label="Max File Size (MB)"><input type="number" value={form.max_file_size} onChange={e => set('max_file_size', Number(e.target.value))} style={inputStyle} min={1} /></Field>
        </div>
        <Field label="Allowed File Types"><input value={form.allowed_file_types} onChange={e => set('allowed_file_types', e.target.value)} style={inputStyle} placeholder=".pdf,.docx,.zip" /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--neu-text-secondary)' }}>
          <input type="checkbox" checked={form.file_required} onChange={e => set('file_required', e.target.checked)} />
          File submission required
        </label>
      </div>
      <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.6rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(145deg,#9b59b6,#7d3c98)', boxShadow: '0 4px 14px rgba(155,89,182,.35)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          Create
        </button>
      </div>
    </Modal>
  )
}

// ─── File Preview Modal ───────────────────────────────────────────────────────
// Uses absolute URLs so the browser can actually fetch the file from FastAPI's
// /uploads static mount.
function FilePreview({ fileUrl, fileName, onClose }) {
  const absUrl  = toAbsoluteUrl(fileUrl)
  const ext     = (fileName || '').split('.').pop().toLowerCase()
  const isImage = ['jpg','jpeg','png','gif','webp','bmp'].includes(ext)
  const isPDF   = ext === 'pdf'
  const [loading, setLoading] = useState(isImage || isPDF)
  const [error,   setError]   = useState(null)

  const handleDownload = () => {
    const a  = document.createElement('a')
    a.href   = absUrl
    a.download = fileName
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="preview-modal-container" onClick={onClose}>
      <div
        style={{
          background: 'var(--neu-surface)', borderRadius: '1.5rem',
          width: '100%', maxWidth: 920, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '20px 20px 40px var(--neu-shadow-dark), -8px -8px 24px var(--neu-shadow-light)',
          animation: 'slideUp .22s cubic-bezier(.34,1.56,.64,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            {getFileIcon(fileName, 16)}
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={handleDownload}
              style={{ padding: '0.4rem 0.9rem', borderRadius: '0.6rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neu-text-primary)' }}
            >
              <Download size={13} /> Download
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '0.4rem', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', minHeight: 400, position: 'relative' }}>
          {/* Loading spinner shown while image/pdf loads */}
          {loading && !error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={32} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: '1rem' }}>
              <AlertCircle size={40} style={{ color: '#f26b6b', opacity: 0.5 }} />
              <p style={{ color: 'var(--neu-text-secondary)', fontSize: '0.88rem' }}>Could not load preview</p>
              <button onClick={handleDownload} style={{ padding: '0.5rem 1.2rem', borderRadius: '0.6rem', background: '#5b8af0', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Download size={14} /> Download Instead
              </button>
            </div>
          )}

          {!error && isImage && (
            <img
              src={absUrl}
              alt={fileName}
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '0.75rem', display: loading ? 'none' : 'block' }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true) }}
            />
          )}

          {!error && isPDF && (
            <iframe
              src={absUrl}
              title={fileName}
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0.75rem', display: loading ? 'none' : 'block' }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true) }}
            />
          )}

          {!error && !isImage && !isPDF && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: '0.85rem' }}>
              {getFileIcon(fileName, 48)}
              <p style={{ color: 'var(--neu-text-secondary)', fontSize: '0.88rem', marginTop: '0.5rem' }}>
                Preview not available for <strong>.{ext}</strong> files
              </p>
              <button onClick={handleDownload} style={{ padding: '0.5rem 1.2rem', borderRadius: '0.6rem', background: '#5b8af0', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Download size={14} /> Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Grade Modal ──────────────────────────────────────────────────────────────
function GradeModal({ submission, totalMarks, assignmentTitle, onClose, onSuccess }) {
  const [marks,    setMarks]    = useState(submission.obtained_marks != null ? String(submission.obtained_marks) : '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [loading,  setLoading]  = useState(false)
  const [preview,  setPreview]  = useState(null)   // { fileUrl, fileName }

  // ── FIX: submission now has file_url from backend ────────────────────────
  const hasFile = !!submission.file_url

  const handleGrade = async () => {
    if (marks === '' || isNaN(marks)) { toast.error('Enter valid marks'); return }
    if (Number(marks) > totalMarks)   { toast.error(`Marks cannot exceed ${totalMarks}`); return }
    setLoading(true)
    try {
      await api.patch(`/submissions/${submission.id}/grade`, {
        obtained_marks: parseFloat(marks),
        feedback,
        status: 'graded',
      })
      toast.success('Graded successfully!')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="grade-modal-container">
        <div style={{
          background: 'var(--neu-surface)',
          boxShadow: '20px 20px 40px var(--neu-shadow-dark), -8px -8px 24px var(--neu-shadow-light)',
          border: '1px solid var(--neu-border)', borderRadius: '1.5rem',
          width: '100%', maxWidth: 460,
          animation: 'slideUp .22s cubic-bezier(.34,1.56,.64,1) both',
        }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
                Grade: {submission.full_name}
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.2rem' }}>{assignmentTitle}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* ── Submitted File row ── */}
            <div style={{
              background: hasFile ? 'rgba(91,138,240,0.07)' : 'var(--neu-surface-deep)',
              borderRadius: '0.875rem', padding: '0.85rem 1rem',
              border: `1px solid ${hasFile ? 'rgba(91,138,240,0.22)' : 'var(--neu-border)'}`,
            }}>
              <p style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.55rem' }}>
                Submitted File
              </p>
              {hasFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    {getFileIcon(submission.file_name, 15)}
                    <span style={{ fontSize: '0.78rem', color: 'var(--neu-text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {submission.file_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setPreview({ fileUrl: submission.file_url, fileName: submission.file_name })}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: '0.55rem', border: 'none', background: '#5b8af0', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Eye size={12} /> View File
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', fontStyle: 'italic' }}>No file attached to this submission</p>
              )}
            </div>

            <Field label={`Marks (out of ${totalMarks})`}>
              <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min={0} max={totalMarks} style={inputStyle} autoFocus />
            </Field>
            <Field label="Feedback">
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Write feedback for the student..." />
            </Field>
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>Cancel</button>
            <button onClick={handleGrade} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(145deg,#a78bfa,#8b5cf6)', boxShadow: '0 4px 14px rgba(167,139,250,.35)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Save Grade
            </button>
          </div>
        </div>
      </div>

      {/* File preview opened from grade modal */}
      {preview && <FilePreview fileUrl={preview.fileUrl} fileName={preview.fileName} onClose={() => setPreview(null)} />}
    </>
  )
}

// ─── Submissions Modal ────────────────────────────────────────────────────────
function SubmissionsModal({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [gradeModal,  setGradeModal]  = useState(null)   // submission object
  const [preview,     setPreview]     = useState(null)   // { fileUrl, fileName }

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`)
      // submissions now include file_url + file_name from the fixed backend
      setSubmissions(res.data.data?.submissions || [])
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [assignment.id])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const graded  = submissions.filter(s => s.status === 'graded').length
  const pending = submissions.length - graded

  return (
    <>
      <Modal wide>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <RingChart submitted={graded} total={Math.max(submissions.length, 1)} size={52} />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{assignment.title}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
                {submissions.length} submissions · {graded} graded · {pending} pending
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
              <Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>
              <Upload size={32} style={{ opacity: 0.2, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No submissions yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Student', 'Roll No', 'Submitted', 'File', 'Status', 'Marks', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--neu-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      style={{ transition: 'background 0.12s' }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--neu-text-primary)', fontWeight: 600, borderBottom: '1px solid var(--neu-border-inner)' }}>{s.full_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--neu-text-secondary)', fontFamily: 'monospace', borderBottom: '1px solid var(--neu-border-inner)' }}>{s.roll_number}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border-inner)' }}>{formatDateTime(s.submission_date)}</td>

                      {/* ── File cell — uses file_url + file_name from backend ── */}
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                        {s.file_url ? (
                          <button
                            onClick={() => setPreview({ fileUrl: s.file_url, fileName: s.file_name || 'submission' })}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.32rem 0.7rem', borderRadius: '0.5rem', border: 'none', background: 'rgba(91,138,240,0.12)', color: '#5b8af0', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            <Eye size={11} /> View File
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', fontStyle: 'italic' }}>No file</span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                        <span style={{
                          background: s.status === 'graded' ? 'rgba(62,207,142,0.12)' : s.status === 'late' ? 'rgba(245,166,35,0.12)' : 'rgba(91,138,240,0.12)',
                          color:      s.status === 'graded' ? '#3ecf8e'               : s.status === 'late' ? '#f5a623'               : '#5b8af0',
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem', textTransform: 'capitalize',
                        }}>
                          {s.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--neu-text-primary)', fontWeight: 600, borderBottom: '1px solid var(--neu-border-inner)' }}>
                        {s.obtained_marks != null ? `${s.obtained_marks} / ${assignment.total_marks}` : '—'}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                        <button
                          onClick={() => setGradeModal(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.38rem 0.8rem', borderRadius: '0.6rem', border: 'none', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Award size={12} /> {s.status === 'graded' ? 'Update' : 'Grade'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Grade Modal stacks on top */}
      {gradeModal && (
        <GradeModal
          submission={gradeModal}
          totalMarks={assignment.total_marks}
          assignmentTitle={assignment.title}
          onClose={() => setGradeModal(null)}
          onSuccess={loadSubmissions}
        />
      )}

      {/* File Preview stacks on top of submissions */}
      {preview && (
        <FilePreview fileUrl={preview.fileUrl} fileName={preview.fileName} onClose={() => setPreview(null)} />
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [searchParams]     = useSearchParams()
  const [offerings,        setOfferings]        = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [assignments,      setAssignments]      = useState([])
  const [loading,          setLoading]          = useState(false)
  const [showCreate,       setShowCreate]       = useState(false)
  const [viewSubmissions,  setViewSubmissions]  = useState(null)
  const [plagModal, setPlagModal] = useState(null)


  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  // Load offerings
  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
  }, [])

  // Load assignments + submission counts
  const fetchAssignments = useCallback(async () => {
    if (!selectedOffering) return
    setLoading(true)
    try {
      const res  = await api.get(`/offerings/${selectedOffering}/assignments`)
      const list = res.data.data?.assignments || []
      // Fetch submission counts in parallel
      const withCounts = await Promise.all(list.map(async a => {
        try {
          const subRes = await api.get(`/assignments/${a.id}/submissions`)
          const subs = subRes.data.data?.submissions || []
          return { ...a, total_submissions: subs.length, graded_count: subs.filter(s => s.status === 'graded').length }
        } catch {
          return { ...a, total_submissions: 0, graded_count: 0 }
        }
      }))
      setAssignments(withCounts)
    } catch {
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [selectedOffering])

  useEffect(() => { fetchAssignments() }, [selectedOffering])

  const handleDelete = async assignment => {
    if (!window.confirm(`Delete "${assignment.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`/assignments/${assignment.id}`)
      toast.success('Assignment deleted')
      fetchAssignments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const ctxItems = () => [
    { label: 'View Submissions', icon: Users, onClick: a => setViewSubmissions(a) },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: a => handleDelete(a) },
    { label: 'Check Plagiarism', icon: ScanSearch, onClick: a => setPlagModal(a) },
  ]

  const now      = new Date()
  const upcoming = assignments.filter(a => new Date(a.due_date) > now)
  const overdue  = assignments.filter(a => new Date(a.due_date) <= now)
  const getPal   = idx => PALETTE[idx % PALETTE.length]

  const selectStyle = { ...inputStyle, width: 'auto', minWidth: 260, cursor: 'pointer' }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Assignments</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>
              {assignments.length} assignments · {assignments.reduce((s, a) => s + (a.total_submissions || 0), 0)} total submissions
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={selectStyle}>
              {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
            </select>
            <AddButton onClick={() => setShowCreate(true)} tooltip="New Assignment" color="#9b59b6" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
            <FileText size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: 0.25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.9rem' }}>No assignments yet</p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem' }}>Create your first assignment for this course</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {upcoming.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CircleCheck size={14} style={{ color: '#3ecf8e' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3ecf8e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active ({upcoming.length})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
                  {upcoming.map((a, idx) => (
                    <AssignmentCard key={a.id} assignment={a} pal={getPal(idx)}
                      onClick={e => openMenu(e, a)} onContextMenu={e => openMenu(e, a)} />
                  ))}
                </div>
              </div>
            )}
            {overdue.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={14} style={{ color: '#f26b6b' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f26b6b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Past Due ({overdue.length})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
                  {overdue.map((a, idx) => (
                    <AssignmentCard key={a.id} assignment={a} pal={getPal(upcoming.length + idx)}
                      onClick={e => openMenu(e, a)} onContextMenu={e => openMenu(e, a)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showCreate     && <CreateModal offeringId={selectedOffering} onClose={() => setShowCreate(false)} onSuccess={fetchAssignments} />}
        {viewSubmissions && <SubmissionsModal assignment={viewSubmissions} onClose={() => setViewSubmissions(null)} />}

        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems() : []}
        />
      </div>
      {plagModal && (
  <PlagiarismReportModal
    assignment={plagModal}
    onClose={() => setPlagModal(null)}
  />
)}
    </>
  )
}