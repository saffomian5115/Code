import { useState, useEffect } from 'react'
import { studentAPI } from '../../api/student.api'
import { formatDate, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { CreditCard, CheckCircle2, AlertTriangle, Clock, Loader2, Download } from 'lucide-react'

const STATUS_CFG = {
  paid:    { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2,  label: 'Paid'    },
  unpaid:  { cls: 'bg-blue-100 text-blue-700',       icon: Clock,         label: 'Unpaid'  },
  partial: { cls: 'bg-orange-100 text-orange-700',   icon: AlertTriangle, label: 'Partial' },
  overdue: { cls: 'bg-red-100 text-red-700',         icon: AlertTriangle, label: 'Overdue' },
}

export default function FeePage() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    studentAPI.getMyVouchers()
      .then(r => setVouchers(r.data.data?.vouchers || []))
      .catch(() => toast.error('Failed to load fee vouchers'))
      .finally(() => setLoading(false))
  }, [])

  const totalDue = vouchers.filter(v => v.status !== 'paid').reduce((s, v) => s + parseFloat(v.total_amount || 0), 0)
  const totalPaid = vouchers.filter(v => v.status === 'paid').reduce((s, v) => s + parseFloat(v.total_amount || 0), 0)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Fee Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">View and manage your fee vouchers</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wide mb-1">Total Paid</p>
          <p className="text-3xl font-display font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className={`rounded-2xl p-5 border ${totalDue > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${totalDue > 0 ? 'text-red-600' : 'text-slate-500'}`}>Outstanding</p>
          <p className={`text-3xl font-display font-bold ${totalDue > 0 ? 'text-red-700' : 'text-slate-600'}`}>{formatCurrency(totalDue)}</p>
        </div>
      </div>

      {/* Vouchers */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <CreditCard size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No vouchers generated</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map(v => {
            const sc = STATUS_CFG[v.status] || STATUS_CFG.unpaid
            const StatusIcon = sc.icon
            const isExp = expanded === v.id
            return (
              <div key={v.id} className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-sm ${v.status === 'overdue' ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : v.id)}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${v.status === 'paid' ? 'bg-emerald-100' : v.status === 'overdue' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <CreditCard size={18} className={v.status === 'paid' ? 'text-emerald-600' : v.status === 'overdue' ? 'text-red-600' : 'text-blue-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-display font-bold text-slate-800">Voucher #{v.voucher_number}</p>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${sc.cls}`}>
                        <StatusIcon size={10} /> {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Due: {formatDate(v.due_date)} · {v.semester_name || 'Semester'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-slate-800 text-lg">{formatCurrency(v.total_amount)}</p>
                    {v.fine_amount > 0 && <p className="text-xs text-red-500 font-medium">+ {formatCurrency(v.fine_amount)} fine</p>}
                  </div>
                </div>

                {/* Expanded fee breakdown */}
                {isExp && (
                  <div className="border-t border-slate-100 p-5 space-y-3 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Tuition Fee',   val: v.tuition_fee   },
                        { label: 'Admission Fee', val: v.admission_fee },
                        { label: 'Library Fee',   val: v.library_fee   },
                        { label: 'Sports Fee',    val: v.sports_fee    },
                      ].filter(f => f.val > 0).map(f => (
                        <div key={f.label} className="flex items-center justify-between">
                          <span className="text-slate-500">{f.label}</span>
                          <span className="font-semibold text-slate-700">{formatCurrency(f.val)}</span>
                        </div>
                      ))}
                      {v.other_fees && JSON.parse(v.other_fees || '[]').map((of, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-slate-500">{of.name}</span>
                          <span className="font-semibold text-slate-700">{formatCurrency(of.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                      <span className="font-bold text-slate-700">Total</span>
                      <span className="font-display font-bold text-slate-800">{formatCurrency(v.total_amount)}</span>
                    </div>
                    {v.status !== 'paid' && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                        <p className="font-semibold mb-1">Payment Instructions:</p>
                        <p>Pay at any branch of HBL, MCB, or UBL using voucher number <strong>{v.voucher_number}</strong>. For online payment use JazzCash or Easypaisa.</p>
                      </div>
                    )}
                    {v.status === 'paid' && v.payments?.length > 0 && (
                      <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700">
                        <p className="font-semibold mb-1">Payment Received:</p>
                        <p>Receipt: {v.payments[0].receipt_number} · {v.payments[0].payment_method} · {v.payments[0].bank_name || 'Cash'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}