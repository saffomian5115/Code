import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  BadgeCheck,
  Building2,
  BookOpen,
  Hash,
  KeyRound,
  Eye,
  EyeOff,
  ScanFace,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";
import FaceEnrollModal from "../../components/shared/FaceEnrollModal";

const BASE_URL = "http://127.0.0.1:8000";

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Password Field Component (Bahar nikal diya) ─────
function PwdField({
  label,
  fieldKey,
  showKey,
  form,
  set,
  show,
  toggleShow,
  inputCls,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show[showKey] ? "text" : "password"}
          value={form[fieldKey]}
          onChange={(e) => set(fieldKey, e.target.value)}
          className={inputCls}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

// ── Change Password Modal ──────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleShow = (k) => setShow((p) => ({ ...p, [k]: !p[k] }));

  const handleSubmit = async () => {
    if (
      !form.current_password ||
      !form.new_password ||
      !form.confirm_password
    ) {
      toast.error("Sab fields required hain");
      return;
    }
    if (form.new_password.length < 8) {
      toast.error("New password kam az kam 8 characters ka hona chahiye");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("New password aur confirm password match nahi karte");
      return;
    }
    if (form.current_password === form.new_password) {
      toast.error("New password old password se alag hona chahiye");
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success("Password successfully change ho gaya!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <KeyRound size={16} className="text-blue-600" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-800">
              Change Password
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <PwdField
            label="Current Password"
            fieldKey="current_password"
            showKey="current"
            form={form}
            set={set}
            show={show}
            toggleShow={toggleShow}
            inputCls={inputCls}
          />
          <PwdField
            label="New Password"
            fieldKey="new_password"
            showKey="new"
            form={form}
            set={set}
            show={show}
            toggleShow={toggleShow}
            inputCls={inputCls}
          />
          <PwdField
            label="Confirm New Password"
            fieldKey="confirm_password"
            showKey="confirm"
            form={form}
            set={set}
            show={show}
            toggleShow={toggleShow}
            inputCls={inputCls}
          />

          <p className="text-xs text-slate-400">
            Password kam az kam 8 characters ka hona chahiye.
          </p>
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
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────
export default function ProfilePage() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [form, setForm] = useState({});
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await authAPI.getProfile();
      const data = res.data.data;
      setProfile(data);
      setFaceEnrolled(data.face_enrolled || false);
      setForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        city: data.city || "",
        current_address: data.current_address || "",
        designation: data.designation || "",
        qualification: data.qualification || "",
        specialization: data.specialization || "",
      });
    } catch {
      toast.error("Profile load nahi ho saka");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authAPI.updateProfile(form);
      const updated = res.data.data;
      setProfile(updated);
      authStore.updateUser({
        full_name: updated.full_name,
        profile_picture_url: updated.profile_picture_url,
      });
      setEditing(false);
      toast.success("Profile update ho gaya!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingPic(true);
      const res = await authAPI.uploadProfilePicture(file);
      const { profile_picture_url } = res.data.data;
      setProfile((p) => ({ ...p, profile_picture_url }));
      authStore.updateUser({ profile_picture_url });
      window.dispatchEvent(new Event('profileUpdated'))
      toast.success("Photo update ho gaya!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadingPic(false);
    }
  };

  const avatarUrl = profile?.profile_picture_url
    ? `${BASE_URL}${profile.profile_picture_url}`
    : null;
  const ROLE_COLOR = {
    admin: "bg-purple-500",
    teacher: "bg-emerald-500",
    student: "bg-blue-500",
  };
  const ROLE_BADGE = {
    admin: "bg-purple-100 text-purple-700",
    teacher: "bg-emerald-100 text-emerald-700",
    student: "bg-blue-100 text-blue-700",
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div
                  className={`w-20 h-20 ${ROLE_COLOR[profile?.role]} rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl`}
                >
                  {profile?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center shadow-md transition-colors"
              >
                {uploadingPic ? (
                  <Loader2 size={12} className="text-white animate-spin" />
                ) : (
                  <Camera size={12} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePictureChange}
              />
            </div>

            <button
              onClick={() => setShowFaceEnroll(true)}
              className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                faceEnrolled
                  ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                  : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <ScanFace size={13} />
              {faceEnrolled ? "✓ Face Enrolled" : "Add Face Login"}
            </button>

            {/* Buttons */}
            <div className="flex gap-2 mt-2 flex-wrap justify-end">
              <button
                onClick={() => setShowChangePwd(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <KeyRound size={14} /> Change Password
              </button>
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}{" "}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-bold text-slate-800">
                {profile?.full_name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[profile?.role]}`}
              >
                {profile?.role}
              </span>
              {profile?.is_active && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <BadgeCheck size={12} /> Active
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Info / Edit Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          {editing ? "Edit Information" : "Personal Information"}
        </h2>

        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "full_name", label: "Full Name", show: true },
              { key: "phone", label: "Phone", show: true },
              { key: "city", label: "City", show: profile?.role === "student" },
              {
                key: "current_address",
                label: "Address",
                show: profile?.role === "student",
              },
              {
                key: "designation",
                label: "Designation",
                show: ["teacher", "admin"].includes(profile?.role),
              },
              {
                key: "qualification",
                label: "Qualification",
                show: profile?.role === "teacher",
              },
              {
                key: "specialization",
                label: "Specialization",
                show: profile?.role === "teacher",
              },
            ]
              .filter((f) => f.show)
              .map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={form[key] || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
          </div>
        ) : (
          <div>
            <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
            <InfoRow
              icon={Hash}
              label="Roll Number"
              value={profile?.roll_number}
            />
            <InfoRow
              icon={Hash}
              label="Employee ID"
              value={profile?.employee_id}
            />
            <InfoRow icon={MapPin} label="City" value={profile?.city} />
            <InfoRow
              icon={MapPin}
              label="Address"
              value={profile?.current_address}
            />
            <InfoRow
              icon={Building2}
              label="Designation"
              value={profile?.designation}
            />
            <InfoRow
              icon={BookOpen}
              label="Qualification"
              value={profile?.qualification}
            />
            <InfoRow
              icon={BookOpen}
              label="Specialization"
              value={profile?.specialization}
            />
            <InfoRow
              icon={Calendar}
              label="Joined"
              value={profile?.joining_date}
            />
            <InfoRow
              icon={Shield}
              label="Last Login"
              value={
                profile?.last_login
                  ? new Date(profile.last_login).toLocaleString()
                  : null
              }
            />
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}

      {showFaceEnroll && (
        <FaceEnrollModal
          onClose={() => setShowFaceEnroll(false)}
          onEnrolled={() => {
            setFaceEnrolled(true);
          }}
        />
      )}
    </div>
  );
}
