import { useState, useEffect } from "react";
import { adminAPI } from "../../api/admin.api";
import { formatDateTime } from "../../utils/helpers";
import toast from "react-hot-toast";
import {
  Plus,
  Shield,
  Camera,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";

const GATE_TYPES = ["main", "department", "lab", "library", "hostel"];
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TYPE_COLORS = {
  main: "bg-blue-100 text-blue-700",
  department: "bg-purple-100 text-purple-700",
  lab: "bg-emerald-100 text-emerald-700",
  library: "bg-orange-100 text-orange-700",
  hostel: "bg-pink-100 text-pink-700",
};

// ── Create Gate Modal ──────────────────────────────
function GateModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    gate_name: "",
    gate_code: "",
    gate_type: "main",
    location_description: "",
    ip_address: "",
    device_model: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.gate_name || !form.gate_code) {
      toast.error("Gate name and code required");
      return;
    }
    setLoading(true);
    try {
      await adminAPI.createGate(form);
      toast.success("Gate created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create gate");
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
          <h3 className="font-display font-bold text-lg text-slate-800">
            Add Campus Gate
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Gate Name *
              </label>
              <input
                className={inputCls}
                value={form.gate_name}
                onChange={(e) => set("gate_name", e.target.value)}
                placeholder="Main Entrance"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Gate Code *
              </label>
              <input
                className={inputCls}
                value={form.gate_code}
                onChange={(e) => set("gate_code", e.target.value.toUpperCase())}
                placeholder="GATE-001"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Gate Type
            </label>
            <select
              className={inputCls}
              value={form.gate_type}
              onChange={(e) => set("gate_type", e.target.value)}
            >
              {GATE_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Location Description
            </label>
            <input
              className={inputCls}
              value={form.location_description}
              onChange={(e) => set("location_description", e.target.value)}
              placeholder="North wing entrance near parking"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                IP Address
              </label>
              <input
                className={inputCls}
                value={form.ip_address}
                onChange={(e) => set("ip_address", e.target.value)}
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Device Model
              </label>
              <input
                className={inputCls}
                value={form.device_model}
                onChange={(e) => set("device_model", e.target.value)}
                placeholder="Hikvision DS-K1T671M"
              />
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              "Create Gate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Camera Modal ───────────────────────────────
function CameraModal({ gateId, gateName, onClose, onSuccess }) {
  const [form, setForm] = useState({
    camera_name: "",
    camera_type: "entry",
    is_primary: true,
    rtsp_url: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.camera_name) {
      toast.error("Camera name required");
      return;
    }
    setLoading(true);
    try {
      await adminAPI.addCamera(gateId, form);
      toast.success("Camera added successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add camera");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">
              Add Camera
            </h3>
            <p className="text-slate-400 text-sm">{gateName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Camera Name *
            </label>
            <input
              className={inputCls}
              value={form.camera_name}
              onChange={(e) => set("camera_name", e.target.value)}
              placeholder="Entry Camera 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Type
              </label>
              <select
                className={inputCls}
                value={form.camera_type}
                onChange={(e) => set("camera_type", e.target.value)}
              >
                <option value="entry">Entry</option>
                <option value="exit">Exit</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) => set("is_primary", e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-sm text-slate-600 font-medium">
                  Primary
                </span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              RTSP URL
            </label>
            <input
              className={inputCls}
              value={form.rtsp_url}
              onChange={(e) => set("rtsp_url", e.target.value)}
              placeholder="rtsp://192.168.1.100:554/stream"
            />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Adding...
              </>
            ) : (
              "Add Camera"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Schedule Modal ─────────────────────────────
function ScheduleModal({ gateId, gateName, onClose, onSuccess }) {
  const [form, setForm] = useState({
    day_of_week: "monday",
    open_time: "07:00",
    close_time: "20:00",
    is_holiday: false,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await adminAPI.setGateSchedule(gateId, form);
      toast.success("Schedule added");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">
              Set Schedule
            </h3>
            <p className="text-slate-400 text-sm">{gateName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Day
            </label>
            <select
              className={inputCls}
              value={form.day_of_week}
              onChange={(e) => set("day_of_week", e.target.value)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Open Time
              </label>
              <input
                className={inputCls}
                type="time"
                value={form.open_time}
                onChange={(e) => set("open_time", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">
                Close Time
              </label>
              <input
                className={inputCls}
                type="time"
                value={form.close_time}
                onChange={(e) => set("close_time", e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_holiday}
              onChange={(e) => set("is_holiday", e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-slate-600">
              Mark as Holiday (gate closed)
            </span>
          </label>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Schedule"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gate Card ──────────────────────────────────────
function GateCard({ gate, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'camera' | 'schedule'

  const loadDetail = async () => {
    if (detail) {
      setExpanded((p) => !p);
      return;
    } // already loaded — sirf toggle
    setLoading(true);
    try {
      const res = await adminAPI.getGate(gate.id);
      setDetail(res.data.data);
      setExpanded(true);
    } catch (err) {
      toast.error(
        "Failed to load gate details: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const isOnline =
    gate.last_ping &&
    Date.now() - new Date(gate.last_ping).getTime() < 5 * 60 * 1000;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${gate.is_active ? "border-slate-200" : "border-slate-200 opacity-60"}`}
    >
      {/* Gate Header */}
      <div className="p-5 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${gate.is_active ? "bg-blue-100" : "bg-slate-100"}`}
        >
          <Shield
            size={22}
            className={gate.is_active ? "text-blue-600" : "text-slate-400"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-slate-800">
              {gate.gate_name}
            </h3>
            <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
              {gate.gate_code}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${TYPE_COLORS[gate.gate_type] || "bg-slate-100 text-slate-600"}`}
            >
              {gate.gate_type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`flex items-center gap-1 text-xs font-medium ${isOnline ? "text-emerald-600" : "text-slate-400"}`}
            >
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? "Online" : "Offline"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Camera size={11} /> {gate.total_cameras || 0} cameras
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("camera")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl text-xs font-medium transition-colors"
          >
            <Camera size={12} /> Camera
          </button>
          <button
            onClick={() => setModal("schedule")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl text-xs font-medium transition-colors"
          >
            <Clock size={12} /> Schedule
          </button>
          <button
            onClick={loadDetail}
            disabled={loading}
            className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : expanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          {!detail ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-blue-500 w-5 h-5" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Cameras */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Cameras ({detail.cameras?.length || 0})
                </p>
                {detail.cameras?.length > 0 ? (
                  <div className="space-y-2">
                    {detail.cameras.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl"
                      >
                        <Camera
                          size={13}
                          className="text-slate-400 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {c.camera_name}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">
                            {c.camera_type}
                            {c.is_primary ? " · Primary" : ""}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No cameras added yet
                  </p>
                )}
              </div>

              {/* Schedule */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Schedule ({detail.schedules?.length || 0} days)
                </p>
                {detail.schedules?.length > 0 ? (
                  <div className="space-y-1">
                    {detail.schedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-24 text-slate-500 capitalize font-medium">
                          {s.day}
                        </span>
                        {s.is_holiday ? (
                          <span className="text-red-500 font-medium">
                            Holiday / Closed
                          </span>
                        ) : (
                          <span className="text-slate-700">
                            {s.open_time} – {s.close_time}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No schedule configured yet
                  </p>
                )}
              </div>
            </div>
          )}

          {detail?.ip_address && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <Settings size={11} />
              {detail.device_model || "Unknown device"} · {detail.ip_address}
            </p>
          )}
        </div>
      )}
      
      {expanded && detail && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {detail.cameras?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Cameras
                </p>
                <div className="space-y-2">
                  {detail.cameras.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl"
                    >
                      <Camera
                        size={13}
                        className="text-slate-400 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {c.camera_name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {c.camera_type}
                          {c.is_primary ? " · Primary" : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail.schedules?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Schedule
                </p>
                <div className="space-y-1">
                  {detail.schedules.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-slate-500 capitalize">
                        {s.day}
                      </span>
                      {s.is_holiday ? (
                        <span className="text-red-500 font-medium">
                          Holiday
                        </span>
                      ) : (
                        <span className="text-slate-700">
                          {s.open_time} – {s.close_time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {detail.ip_address && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Settings size={11} /> {detail.device_model || "Unknown device"} ·{" "}
              {detail.ip_address}
            </p>
          )}
        </div>
      )}

      {modal === "camera" && (
        <CameraModal
          gateId={gate.id}
          gateName={gate.gate_name}
          onClose={() => setModal(null)}
          onSuccess={() => {
            onRefresh();
            setDetail(null);
          }}
        />
      )}
      {modal === "schedule" && (
        <ScheduleModal
          gateId={gate.id}
          gateName={gate.gate_name}
          onClose={() => setModal(null)}
          onSuccess={() => {
            onRefresh();
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────
export default function GatesPage() {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchGates = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getGates();
      setGates(res.data.data?.gates || []);
    } catch {
      toast.error("Failed to load gates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGates();
  }, []);

  const activeGates = gates.filter((g) => g.is_active).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">
            Campus Gates
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {gates.length} gates · {activeGates} active
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Gate
        </button>
      </div>

      {/* Gates */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : gates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Shield size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">
            No campus gates configured
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Add gates to enable AI-powered campus attendance
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gates.map((gate) => (
            <GateCard key={gate.id} gate={gate} onRefresh={fetchGates} />
          ))}
        </div>
      )}

      {showCreate && (
        <GateModal
          onClose={() => setShowCreate(false)}
          onSuccess={fetchGates}
        />
      )}
    </div>
  );
}
