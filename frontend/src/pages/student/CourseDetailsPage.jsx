import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentAPI } from '../../api/student.api'
import toast from 'react-hot-toast'
import { BookOpen, Clock, MapPin, Loader2, ArrowLeft, Target, FileText, CheckCircle2 } from 'lucide-react'

export default function CourseDetailsPage() {
  const { offeringId } = useParams()
  const navigate = useNavigate()
  
  const [offering, setOffering] = useState(null)
  const [clos, setClos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!offeringId) return

    studentAPI.getOffering(offeringId)
      .then(res => {
        const offData = res.data.data
        setOffering(offData)
        if (offData?.course?.id) {
          return studentAPI.getCourseCLOs(offData.course.id)
        }
      })
      .then(res => {
        if (res) {
          setClos(res.data.data?.clos || [])
        }
      })
      .catch(() => toast.error('Failed to load course details'))
      .finally(() => setLoading(false))
  }, [offeringId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    )
  }

  if (!offering) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 font-medium">Course not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 font-semibold hover:underline">
          Go Back
        </button>
      </div>
    )
  }

  const course = offering.course || {}
  const instructor = offering.instructor || {}
  const semester = offering.semester || {}

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/student/courses')} 
          className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">{course.name || 'Course Details'}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{course.code} · Section {offering.section}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-emerald-500"/> Course Description
            </h2>
            {course.description ? (
              <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>
            ) : (
              <p className="text-slate-400 text-sm italic">No description provided for this course.</p>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Syllabus Snapshot</h3>
              {course.syllabus ? (
                 <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {course.syllabus}
                 </div>
              ) : (
                <p className="text-slate-400 text-sm italic">Syllabus not available.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold font-display text-slate-800 mb-4 flex items-center gap-2">
              <Target size={20} className="text-blue-500"/> Course Learning Outcomes (CLOs)
            </h2>
            {clos.length > 0 ? (
              <div className="space-y-3">
                {clos.map(clo => (
                  <div key={clo.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-blue-600 border border-blue-100 flex-shrink-0">
                      {clo.clo_number}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 font-medium mb-1">{clo.description}</p>
                      <div className="flex gap-2">
                        {clo.domain && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold">{clo.domain}</span>}
                        {clo.level && <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-semibold">Level {clo.level}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                <Target size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No CLOs defined for this course yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Meta Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-800">Quick Info</h3>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Credit Hours</p>
                <p className="text-sm font-semibold text-slate-700">{course.credit_hours} CH</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Instructor</p>
                <p className="text-sm font-semibold text-slate-700">{instructor.name || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Semester</p>
                <p className="text-sm font-semibold text-slate-700">{semester.name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Room / Lab</p>
                <p className="text-sm font-semibold text-slate-700">
                  {offering.room_number ? `Room ${offering.room_number}` : ''}
                  {offering.room_number && offering.lab_number ? ' · ' : ''}
                  {offering.lab_number ? `Lab ${offering.lab_number}` : ''}
                  {!offering.room_number && !offering.lab_number && 'Not assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
