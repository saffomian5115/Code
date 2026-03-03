import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../api/admin.api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";
import {
  CreditCard,
  Search,
  Loader2,
  X,
  Plus,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

const STATUS_CONFIG = {
  paid: {
    cls: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    iconCls: "text-emerald-500",
  },
  unpaid: {
    cls: "bg-red-100 text-red-700",
    icon: Clock,
    iconCls: "text-red-400",
  },
  partial: {
    cls: "bg-orange-100 text-orange-700",
    icon: Clock,
    iconCls: "text-orange-400",
  },
  overdue: {
    cls: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    iconCls: "text-red-500",
  },
};

// ── Pay Voucher Modal ──────────────────────────────
function PayModal({ voucher, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount_paid: voucher.total_due - (voucher.total_paid || 0),
    payment_method: "bank_transfer",
    reference_number: "",
    bank_name: "",
    receipt_number: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.amount_paid || !form.reference_number) {
      toast.error("Amount and reference number required");
      return;
    }
    setLoading(true);
    try {
      await adminAPI.payVoucher(voucher.id, form);
      toast.success("Payment recorded successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">
              Record Payment
            </h3>
            <p className="text-slate-400 text-sm">{voucher.voucher_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Amount Summary */}
        <div className="mx-6 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Total Due</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(voucher.total_due)}
            </span>
          </div>
          {voucher.total_paid > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Already Paid</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(voucher.total_paid)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-blue-200 pt-2 mt-2">
            <span className="text-blue-700">Remaining</span>
            <span className="text-blue-700">
              {formatCurrency(voucher.total_due - (voucher.total_paid || 0))}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Amount Paying *
            </label>
            <input
              className={inputCls}
              type="number"
              value={form.amount_paid}
              onChange={(e) => set("amount_paid", parseFloat(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Payment Method
              </label>
              <select
                className={inputCls}
                value={form.payment_method}
                onChange={(e) => set("payment_method", e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Bank Name
              </label>
              <input
                className={inputCls}
                value={form.bank_name}
                onChange={(e) => set("bank_name", e.target.value)}
                placeholder="HBL"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Reference No. *
              </label>
              <input
                className={inputCls}
                value={form.reference_number}
                onChange={(e) => set("reference_number", e.target.value)}
                placeholder="TXN-2025-001"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Receipt No.
              </label>
              <input
                className={inputCls}
                value={form.receipt_number}
                onChange={(e) => set("receipt_number", e.target.value)}
                placeholder="RCP-2025-001"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Payment Date
            </label>
            <input
              className={inputCls}
              type="date"
              value={form.payment_date}
              onChange={(e) => set("payment_date", e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Recording...
              </>
            ) : (
              "Record Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// -- generate voucher ---------------------

function GenerateModal({ onClose, onSuccess }) {
  const [students, setStudents] = useState([])
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState({
    student_id: '', semester_id: '',
    due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Promise.all([
      adminAPI.getStudents(1, 200),
      adminAPI.getSemesters()
    ]).then(([s, sem]) => {
      setStudents(s.data.data?.students || [])
      setSemesters(sem.data.data?.semesters || [])
    }).finally(() => setLoadingData(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.student_id || !form.semester_id || !form.due_date) {
      toast.error('All fields required'); return
    }
    setLoading(true)
    try {
      await adminAPI.createVoucher(form)
      toast.success('Voucher generated!')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate voucher')
    } finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Generate Fee Voucher</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          {loadingData ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600 w-5 h-5" /></div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Student <span className="text-red-400">*</span></label>
                <select className={inputCls} value={form.student_id} onChange={e => set('student_id', Number(e.target.value))}>
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s.user_id} value={s.user_id}>{s.full_name} — {s.roll_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Semester <span className="text-red-400">*</span></label>
                <select className={inputCls} value={form.semester_id} onChange={e => set('semester_id', Number(e.target.value))}>
                  <option value="">-- Select Semester --</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Due Date <span className="text-red-400">*</span></label>
                <input className={inputCls} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || loadingData}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function FeeVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [showGenerate, setShowGenerate] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 20,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [payVoucher, setPayVoucher] = useState(null);
  const [updatingOverdue, setUpdatingOverdue] = useState(false);

  const fetchVouchers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, per_page: 20 };
        if (filterStatus) params.status = filterStatus;
        const res = await adminAPI.getVouchers(params);
        setVouchers(res.data.data?.vouchers || []);
        setPagination(
          res.data.data?.pagination || {
            total: 0,
            page: 1,
            per_page: 20,
            total_pages: 1,
          },
        );
      } catch {
        toast.error("Failed to load vouchers");
      } finally {
        setLoading(false);
      }
    },
    [filterStatus],
  );

  useEffect(() => {
    fetchVouchers();
  }, [filterStatus]);

  const handleUpdateOverdue = async () => {
    setUpdatingOverdue(true);
    try {
      const res = await adminAPI.updateOverdueVouchers();
      toast.success(
        `${res.data.data?.updated_count || 0} vouchers updated to overdue`,
      );
      fetchVouchers();
    } catch {
      toast.error("Failed to update overdue");
    } finally {
      setUpdatingOverdue(false);
    }
  };

  const filtered = vouchers.filter(
    (v) =>
      !search ||
      v.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.voucher_number?.toLowerCase().includes(search.toLowerCase()),
  );

  // Stats from current page
  const stats = {
    total: pagination.total,
    paid: vouchers.filter((v) => v.status === "paid").length,
    unpaid: vouchers.filter((v) => v.status === "unpaid").length,
    overdue: vouchers.filter((v) => v.status === "overdue").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">
            Fee Vouchers
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {pagination.total} total vouchers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Generate Voucher
          </button>
          <button
            onClick={handleUpdateOverdue}
            disabled={updatingOverdue}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {updatingOverdue ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <AlertTriangle size={15} />
            )}
            Update Overdue
          </button>
        </div>
      </div>
      {/* Stat pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          {
            label: "All",
            value: pagination.total,
            color: "bg-slate-100 text-slate-600",
            key: "",
          },
          {
            label: "Paid",
            value: stats.paid,
            color: "bg-emerald-100 text-emerald-700",
            key: "paid",
          },
          {
            label: "Unpaid",
            value: stats.unpaid,
            color: "bg-red-100 text-red-700",
            key: "unpaid",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            color: "bg-orange-100 text-orange-700",
            key: "overdue",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterStatus === s.key ? `${s.color} ring-2 ring-offset-1 ring-current` : `${s.color} opacity-70 hover:opacity-100`}`}
          >
            {s.label} <span className="ml-1 opacity-80">({s.value})</span>
          </button>
        ))}
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or voucher..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:bg-slate-100 transition-colors"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {[
                  "Voucher No",
                  "Student",
                  "Amount",
                  "Fine",
                  "Total Due",
                  "Due Date",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    No vouchers found
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const sc = STATUS_CONFIG[v.status] || STATUS_CONFIG.unpaid;
                  const StatusIcon = sc.icon;
                  const isPastDue =
                    new Date(v.due_date) < new Date() && v.status !== "paid";
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                        {v.voucher_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">
                          {v.student_name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {v.roll_number}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(v.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {v.fine_amount > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(v.fine_amount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(v.total_due)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isPastDue && v.status !== "paid"
                              ? "text-red-600 font-medium"
                              : "text-slate-500"
                          }
                        >
                          {formatDate(v.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold ${sc.cls}`}
                        >
                          <StatusIcon size={11} className={sc.iconCls} />
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {v.status !== "paid" && (
                          <button
                            onClick={() => setPayVoucher(v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <DollarSign size={11} /> Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Page {pagination.page} of {pagination.total_pages} (
              {pagination.total} records)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchVouchers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {Array.from(
                { length: Math.min(pagination.total_pages, 5) },
                (_, i) => i + 1,
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchVouchers(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => fetchVouchers(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
      {payVoucher && (
        <PayModal
          voucher={payVoucher}
          onClose={() => setPayVoucher(null)}
          onSuccess={() => fetchVouchers(pagination.page)}
        />
      )}
      {showGenerate && (
        <GenerateModal 
          onClose={() => setShowGenerate(false)} 
          onSuccess={() => fetchVouchers(1)} 
        />
      )}
    </div>
  );
}
