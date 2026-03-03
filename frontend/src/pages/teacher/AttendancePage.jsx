import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { formatDate, formatDateTime, calcPercentage, getAttendanceBg, getAttendanceColor } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Plus, ClipboardCheck, AlertTriangle, ChevronDown,
  ChevronRight, Loader2, X, CheckCircle2, XCircle,
  Clock, Users, BookOpen, BarChart2
} from 'lucide-react'

const STATUS_CFG = {
  present: { cls: 'bg-emerald-500', label: 'Present', abbr: 'P' },
  absent:  { cls: 'bg-red-500',     label: 'Absent',  abbr: 'A' },
  late:    { cls: 'bg-orange-400',  label: 'Late',    abbr: 'L' },
  excused: { cls: 'bg-blue-400',    label: 'Excused', abbr: 'E' },
}

const TABS = ['mark', 'sessions', 'report', 'short']

// ── Create Session Modal ───────────────────────────
function CreateSessionModal({ offeringId, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    offering_id: offeringId,
    session_date: today,
    start_time: '09:00',
    end_time: '10:30',
    topic: '',
    session_type: 'lecture',
    is_makeup: false,
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.topic) { toast.error('Topic is required'); return }
    setLoading(true)
    try {
      await teacherAPI.createSession(form)
      toast.success('Session created successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Create Session</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Date *</label>
              <input className={inputCls} type="date" value={form.session_date} onChange={e => set('session_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Type</label>
              <select className={inputCls} value={form.session_type} onChange={e => set('session_type', e.target.value)}>
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Start Time</label>
              <input className={inputCls} type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">End Time</label>
              <input className={inputCls} type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Topic *</label>
            <input className={inputCls} value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. Introduction to OOP" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_makeup} onChange={e => set('is_makeup', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm text-slate-600">Makeup class</span>
          </label>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mark Attendance Tab ────────────────────────────
function MarkAttendanceTab({ offeringId }) {
  const [sessions, setSessions]   = useState([])
  const [students, setStudents]   = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [attendance, setAttendance] = useState({}) // {student_id: status}
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [existingRecords, setExistingRecords] = useState([])

  const loadSessions = useCallback(async () => {
    try {
      const res = await teacherAPI.getOfferingSessions(offeringId)
      setSessions(res.data.data?.sessions || [])
    } catch { toast.error('Failed to load sessions') }
  }, [offeringId])

  const loadStudents = useCallback(async () => {
    try {
      const res = await teacherAPI.getOfferingStudents(offeringId)
      const studs = res.data.data?.students || []
      setStudents(studs)
      // Default all present
      const defaultAtt = {}
      studs.forEach(s => { defaultAtt[s.student_id] = 'present' })
      setAttendance(defaultAtt)
    } catch { toast.error('Failed to load students') }
  }, [offeringId])

  useEffect(() => {
    loadSessions()
    loadStudents()
  }, [offeringId])

  const handleSelectSession = async (session) => {
    setSelectedSession(session)
    if (session.attendance_marked) {
      // Load existing records
      setLoading(true)
      try {
        const res = await teacherAPI.getSessionAttendance(session.id)
        const records = res.data.data?.records || []
        setExistingRecords(records)
        const existing = {}
        records.forEach(r => { existing[r.student_id] = r.status })
        // Fill defaults for students not in records
        const merged = {}
        students.forEach(s => { merged[s.student_id] = existing[s.student_id] || 'absent' })
        setAttendance(merged)
      } catch { toast.error('Failed to load existing attendance') }
      finally { setLoading(false) }
    } else {
      setExistingRecords([])
      const defaultAtt = {}
      students.forEach(s => { defaultAtt[s.student_id] = 'present' })
      setAttendance(defaultAtt)
    }
  }

  const setAll = (status) => {
    const all = {}
    students.forEach(s => { all[s.student_id] = status })
    setAttendance(all)
  }

  const handleSave = async () => {
    if (!selectedSession) { toast.error('Select a session first'); return }
    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: attendance[s.student_id] || 'absent',
      }))
      await teacherAPI.markAttendance(selectedSession.id, { records })
      toast.success(`Attendance saved for ${records.length} students`)
      loadSessions()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const counts = Object.values(attendance).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1; return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Session Selector + New Session btn */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-slate-500 font-medium mb-1.5">Select Session</label>
          <select
            value={selectedSession?.id || ''}
            onChange={e => handleSelectSession(sessions.find(s => s.id === parseInt(e.target.value)))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value="">-- Select a session --</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {formatDate(s.session_date)} — {s.topic} {s.attendance_marked ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-5">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={15} /> New Session
          </button>
        </div>
      </div>

      {selectedSession && (
        <>
          {/* Session info */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-blue-800 font-semibold text-sm">{selectedSession.topic}</p>
              <p className="text-blue-600 text-xs">{formatDate(selectedSession.session_date)} · {selectedSession.session_type}</p>
            </div>
            {selectedSession.attendance_marked && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={12} /> Already Marked
              </span>
            )}
          </div>

          {/* Bulk actions + stats */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Mark all as:</span>
              {['present','absent','late','excused'].map(s => (
                <button key={s} onClick={() => setAll(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                    s === 'present' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' :
                    s === 'absent'  ? 'border-red-200 text-red-700 hover:bg-red-50' :
                    s === 'late'    ? 'border-orange-200 text-orange-700 hover:bg-orange-50' :
                                     'border-blue-200 text-blue-700 hover:bg-blue-50'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {Object.entries(counts).map(([s, c]) => (
                <span key={s} className="flex items-center gap-1 font-medium">
                  <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s]?.cls}`} />
                  {c} {s}
                </span>
              ))}
            </div>
          </div>

          {/* Student List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-blue-600 w-6 h-6" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Roll No</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s, idx) => {
                    const current = attendance[s.student_id] || 'present'
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold">
                              {s.full_name?.[0] || '?'}
                            </div>
                            <span className="font-medium text-slate-700">{s.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{s.roll_number}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {['present','absent','late','excused'].map(st => (
                              <button
                                key={st}
                                onClick={() => setAttendance(p => ({ ...p, [s.student_id]: st }))}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border-2 ${
                                  current === st
                                    ? `${STATUS_CFG[st].cls} text-white border-transparent`
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                }`}
                                title={STATUS_CFG[st].label}
                              >
                                {STATUS_CFG[st].abbr}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-600/20">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><ClipboardCheck size={15} /> Save Attendance</>}
            </button>
          </div>
        </>
      )}

      {showCreate && (
        <CreateSessionModal
          offeringId={offeringId}
          onClose={() => setShowCreate(false)}
          onSuccess={loadSessions}
        />
      )}
    </div>
  )
}

// ── Sessions History Tab ───────────────────────────
function SessionsTab({ offeringId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getOfferingSessions(offeringId)
      .then(r => setSessions(r.data.data?.sessions || []))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [offeringId])

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Date', 'Topic', 'Type', 'Time', 'Attendance', 'Marked At'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-lg" /></td>
                  ))}
                </tr>
              ))
            ) : sessions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-14 text-slate-400">No sessions yet — create your first session</td></tr>
            ) : (
              sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-medium">{formatDate(s.session_date)}</td>
                  <td className="px-4 py-3 text-slate-600">{s.topic}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{s.session_type}</span>
                    {s.is_makeup && <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg font-medium">Makeup</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.start_time} – {s.end_time}</td>
                  <td className="px-4 py-3">
                    {s.attendance_marked
                      ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle2 size={13} /> Marked</span>
                      : <span className="flex items-center gap-1 text-slate-400 text-xs"><Clock size={13} /> Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.marked_at ? formatDateTime(s.marked_at) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Attendance Report Tab ──────────────────────────
function ReportTab({ offeringId }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getAttendanceReport(offeringId)
      .then(r => setReport(r.data.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }, [offeringId])

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>
  if (!report) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <p className="text-blue-600 text-xs font-semibold uppercase tracking-wide mb-1">Total Sessions</p>
          <p className="text-3xl font-display font-bold text-blue-700">{report.total_sessions}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Total Students</p>
          <p className="text-3xl font-display font-bold text-slate-700">{report.total_students}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Student', 'Roll No', 'Attended', 'Absent', 'Percentage', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {report.report?.map(r => (
                <tr key={r.student_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{r.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.roll_number}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">{r.attended}</td>
                  <td className="px-4 py-3 text-red-500 font-semibold">{r.absent}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.percentage >= 75 ? 'bg-emerald-400' : r.percentage >= 60 ? 'bg-orange-400' : 'bg-red-500'}`}
                          style={{ width: `${r.percentage}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${getAttendanceColor(r.percentage)}`}>{r.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'short'
                      ? <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <AlertTriangle size={11} /> Short
                        </span>
                      : <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full w-fit">OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Short Attendance Tab ───────────────────────────
function ShortAttendanceTab({ offeringId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getShortAttendance(offeringId)
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load short attendance'))
      .finally(() => setLoading(false))
  }, [offeringId])

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>

  const students = data?.students || []

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${students.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        {students.length > 0
          ? <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          : <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />}
        <p className={`font-semibold text-sm ${students.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
          {students.length > 0 ? `${students.length} students below 75% attendance threshold` : 'All students have satisfactory attendance'}
        </p>
      </div>
      {students.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Student', 'Roll No', 'Attended', 'Total', 'Percentage', 'Shortage'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.student_id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{s.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.roll_number}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{s.attended_classes}</td>
                    <td className="px-4 py-3 text-slate-500">{s.total_classes}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-bold">{s.percentage.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                        -{s.shortage?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function AttendancePage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [tab, setTab] = useState('mark')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
      .finally(() => setLoading(false))
  }, [])

  const TAB_CFG = [
    { key: 'mark',     label: 'Mark Attendance', icon: ClipboardCheck },
    { key: 'sessions', label: 'Session History',  icon: BookOpen },
    { key: 'report',   label: 'Full Report',      icon: BarChart2 },
    { key: 'short',    label: 'Short Attendance', icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Attendance</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage sessions and track student attendance</p>
        </div>
        {/* Offering Selector */}
        <select
          value={selectedOffering}
          onChange={e => setSelectedOffering(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-blue-400 bg-white min-w-[260px]"
        >
          <option value="">-- Select Course --</option>
          {offerings.map(o => (
            <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>
          ))}
        </select>
      </div>

      {!selectedOffering ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <ClipboardCheck size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">Select a course to manage attendance</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
            {TAB_CFG.map(t => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <Icon size={14} /> {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {tab === 'mark'     && <MarkAttendanceTab  offeringId={selectedOffering} />}
          {tab === 'sessions' && <SessionsTab        offeringId={selectedOffering} />}
          {tab === 'report'   && <ReportTab          offeringId={selectedOffering} />}
          {tab === 'short'    && <ShortAttendanceTab offeringId={selectedOffering} />}
        </>
      )}
    </div>
  )
}
