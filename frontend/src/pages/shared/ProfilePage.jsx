import { useState, useEffect, useRef, useCallback } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Edit3, Save, X, Loader2, BadgeCheck,
  Building2, BookOpen, Hash, KeyRound, Eye, EyeOff, ScanFace,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";
import FaceScannerWidget from "../../components/shared/FaceScannerWidget";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ROLE_CONFIG = {
  admin:   { accent: "#9b59b6", bg: "rgba(155,89,182,0.12)", label: "Administrator" },
  teacher: { accent: "#22a06b", bg: "rgba(62,207,142,0.12)",  label: "Teacher"       },
  student: { accent: "#5b8af0", bg: "rgba(91,138,240,0.12)",  label: "Student"       },
};

// ─────────────────────────────────────────────────────────────
//  InfoRow — single info field display
// ─────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, accent }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "0.85rem",
      padding: "0.85rem 0",
      borderBottom: "1px solid var(--neu-border-inner)",
    }}>
      <div style={{
        width: "2.2rem", height: "2.2rem",
        borderRadius: "0.625rem",
        background: "linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))",
        boxShadow: "4px 4px 8px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)",
        border: "1px solid var(--neu-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={14} style={{ color: accent || "var(--neu-text-muted)" }} />
      </div>
      <div>
        <p style={{ fontSize: "0.7rem", color: "var(--neu-text-ghost)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {label}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--neu-text-primary)", fontWeight: 500, marginTop: "2px" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Password field
// ─────────────────────────────────────────────────────────────
function PwdField({ label, fieldKey, showKey, form, set, show, toggleShow }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--neu-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show[showKey] ? "text" : "password"}
          value={form[fieldKey] || ""}
          onChange={e => set(p => ({ ...p, [fieldKey]: e.target.value }))}
          className="neu-input-rect"
          style={{ borderRadius: "0.875rem", paddingRight: "3rem" }}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          style={{
            position: "absolute", right: "0.9rem", top: "50%",
            transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--neu-text-ghost)", padding: "0.2rem",
          }}
        >
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Change Password Modal
// ─────────────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [show, setShow] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleShow = (key) => setShow(p => ({ ...p, [key]: !p[key] }));

  const handleSubmit = async () => {
    if (form.new_password !== form.confirm_password) {
      toast.error("New passwords match nahi hain"); return;
    }
    try {
      setLoading(true);
      await authAPI.changePassword({ old_password: form.old_password, new_password: form.new_password });
      toast.success("Password change ho gaya!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change fail ho gaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(8,12,20,0.75)", backdropFilter: "blur(8px)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div className="neu-card-lg" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--neu-border-inner)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "2.2rem", height: "2.2rem", borderRadius: "0.6rem", background: "rgba(91,138,240,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={15} style={{ color: "#5b8af0" }} />
            </div>
            <p className="neu-heading" style={{ fontSize: "0.95rem" }}>Password Change Karo</p>
          </div>
          <button onClick={onClose} className="neu-icon-btn"><X size={16} /></button>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <PwdField label="Current Password" fieldKey="old_password"     showKey="old"  form={form} set={setForm} show={show} toggleShow={toggleShow} />
          <PwdField label="New Password"     fieldKey="new_password"     showKey="new"  form={form} set={setForm} show={show} toggleShow={toggleShow} />
          <PwdField label="Confirm Password" fieldKey="confirm_password"  showKey="conf" form={form} set={setForm} show={show} toggleShow={toggleShow} />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="neu-btn neu-btn-accent"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.85rem", opacity: loading ? 0.75 : 1 }}
          >
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Updating...</span>
              : "Update Password"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Edit field wrapper
// ─────────────────────────────────────────────────────────────
function EditField({ label, fieldKey, form, setForm }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--neu-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        type="text"
        value={form[fieldKey] || ""}
        onChange={e => setForm(p => ({ ...p, [fieldKey]: e.target.value }))}
        className="neu-input-rect"
        style={{ borderRadius: "0.875rem" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Profile Page
// ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const fileInputRef    = useRef(null);
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [uploadingPic,  setUploadingPic]  = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showFaceEnroll,setShowFaceEnroll]= useState(false);
  const [faceEnrolled,  setFaceEnrolled]  = useState(false);
  const [form,          setForm]          = useState({});

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res  = await authAPI.getProfile();
      const data = res.data.data;
      setProfile(data);
      setFaceEnrolled(data.face_enrolled || false);
      setForm({
        full_name:       data.full_name       || "",
        phone:           data.phone           || "",
        city:            data.city            || "",
        current_address: data.current_address || "",
        designation:     data.designation     || "",
        qualification:   data.qualification   || "",
        specialization:  data.specialization  || "",
      });
    } catch { toast.error("Profile load nahi ho saka"); }
    finally   { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res     = await authAPI.updateProfile(form);
      const updated = res.data.data;
      setProfile(updated);
      authStore.updateUser({ full_name: updated.full_name, profile_picture_url: updated.profile_picture_url });
      setEditing(false);
      toast.success("Profile update ho gaya! ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update fail ho gaya");
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPic(true);
      const res     = await authAPI.uploadProfilePicture(file);
      const updated = res.data.data;
      setProfile(p => ({ ...p, profile_picture_url: updated.profile_picture_url }));
      authStore.updateUser({ profile_picture_url: updated.profile_picture_url });
      toast.success("Picture update ho gaya! 📸");
    } catch {
      toast.error("Picture upload fail ho gaya");
    } finally {
      setUploadingPic(false);
    }
  };

  // ── Face enroll API call (passed to FaceScannerWidget) ────
  const enrollApiCall = useCallback(async (base64) => {
    return await authAPI.enrollFace(base64);
  }, []);

  // ── On face enroll success ────────────────────────────────
  const handleEnrollSuccess = useCallback(() => {
    setFaceEnrolled(true);
    setShowFaceEnroll(false);
    toast.success("Face enroll ho gaya! ✅");
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--neu-accent)" }} />
      </div>
    );
  }

  const rc = ROLE_CONFIG[profile?.role] || ROLE_CONFIG.student;

  const picUrl = profile?.profile_picture_url
    ? (profile.profile_picture_url.startsWith("http")
        ? profile.profile_picture_url
        : `${BASE_URL}${profile.profile_picture_url}`)
    : null;

  const editFields = [
    { key: "full_name",       label: "Full Name"      },
    { key: "phone",           label: "Phone"          },
    { key: "city",            label: "City"           },
    { key: "current_address", label: "Address"        },
    { key: "designation",     label: "Designation"    },
    { key: "qualification",   label: "Qualification"  },
    { key: "specialization",  label: "Specialization" },
  ];

  return (
    <div className="neu-page-bg" style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Header Card ── */}
        <div className="neu-card-lg" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>

            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: "5rem", height: "5rem", borderRadius: "1.25rem",
                background: "linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))",
                boxShadow: "var(--neu-raised)",
                border: "2px solid var(--neu-border)",
                overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {picUrl
                  ? <img src={picUrl} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <User size={28} style={{ color: "var(--neu-text-ghost)" }} />
                }
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPic}
                style={{
                  position: "absolute", bottom: "-6px", right: "-6px",
                  width: "1.6rem", height: "1.6rem", borderRadius: "0.5rem",
                  background: "var(--neu-accent)",
                  border: "2px solid var(--neu-surface)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: uploadingPic ? "not-allowed" : "pointer",
                  boxShadow: "var(--neu-raised)",
                }}
              >
                {uploadingPic
                  ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite", color: "#fff" }} />
                  : <Camera size={11} style={{ color: "#fff" }} />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePictureChange} />
            </div>

            {/* Name + role */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: "0.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <h1 className="neu-heading" style={{ fontSize: "1.3rem" }}>{profile?.full_name}</h1>
                {profile?.is_active && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "3px",
                    padding: "0.2rem 0.55rem",
                    background: "rgba(62,207,142,0.12)", color: "#22a06b",
                    borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 700,
                  }}>
                    <BadgeCheck size={11} /> Active
                  </span>
                )}
              </div>
              <p className="neu-subtext" style={{ marginTop: "2px", fontSize: "0.8rem" }}>{profile?.email}</p>
              <span style={{
                display: "inline-block", marginTop: "0.4rem",
                padding: "0.2rem 0.65rem",
                background: rc.bg, color: rc.accent,
                borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700,
                textTransform: "capitalize", border: `1px solid ${rc.accent}30`,
              }}>
                {rc.label}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>

              {/* Face Enroll button */}
              <button
                onClick={() => setShowFaceEnroll(true)}
                className="neu-btn"
                style={{
                  padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem",
                  color: faceEnrolled ? "#22a06b" : "var(--neu-text-secondary)",
                  borderColor: faceEnrolled ? "rgba(62,207,142,0.3)" : "var(--neu-border)",
                  display: "flex", alignItems: "center",
                }}
              >
                <ScanFace size={14} />
                {faceEnrolled ? "Face Enrolled ✓" : "Face Enroll Karo"}
              </button>

              {/* Edit / Save */}
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="neu-btn neu-btn-accent" style={{ padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem", display: "flex", alignItems: "center" }}>
                    {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="neu-btn" style={{ padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem", display: "flex", alignItems: "center" }}>
                    <X size={13} /> Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="neu-btn" style={{ padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem", display: "flex", alignItems: "center" }}>
                  <Edit3 size={13} /> Edit
                </button>
              )}

              {/* Change Password */}
              <button onClick={() => setShowChangePwd(true)} className="neu-btn" style={{ padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem", display: "flex", alignItems: "center" }}>
                <KeyRound size={13} /> Password
              </button>
            </div>
          </div>
        </div>

        {/* ── Info / Edit Card ── */}
        <div className="neu-card-lg" style={{ padding: "1.75rem" }}>
          <p className="neu-label" style={{ marginBottom: "1rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--neu-text-muted)" }}>
            {editing ? "Edit Information" : "Personal Information"}
          </p>

          {editing ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {editFields.map(({ key, label }) => (
                <EditField key={key} fieldKey={key} label={label} form={form} setForm={setForm} />
              ))}
            </div>
          ) : (
            <div>
              <InfoRow icon={User}      label="Full Name"      value={profile?.full_name}          accent={rc.accent} />
              <InfoRow icon={Mail}      label="Email"          value={profile?.email}              accent={rc.accent} />
              <InfoRow icon={Phone}     label="Phone"          value={profile?.phone}              accent={rc.accent} />
              <InfoRow icon={Hash}      label="Roll Number"    value={profile?.roll_number}        accent={rc.accent} />
              <InfoRow icon={Hash}      label="Employee ID"    value={profile?.employee_id}        accent={rc.accent} />
              <InfoRow icon={MapPin}    label="City"           value={profile?.city}               accent={rc.accent} />
              <InfoRow icon={MapPin}    label="Address"        value={profile?.current_address}    accent={rc.accent} />
              <InfoRow icon={Building2} label="Designation"    value={profile?.designation}        accent={rc.accent} />
              <InfoRow icon={BookOpen}  label="Qualification"  value={profile?.qualification}      accent={rc.accent} />
              <InfoRow icon={BookOpen}  label="Specialization" value={profile?.specialization}     accent={rc.accent} />
              <InfoRow icon={Calendar}  label="Joined"         value={profile?.joining_date}       accent={rc.accent} />
              <InfoRow icon={Shield}    label="Last Login"     value={profile?.last_login ? new Date(profile.last_login).toLocaleString() : null} accent={rc.accent} />
            </div>
          )}
        </div>

      </div>

      {/* ── Modals ── */}
      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}

      {/* ══════════════════════════════════════════════════════
          FaceScannerWidget — mode="enroll"
          Auto-capture, no timer, red border on fail,
          auto-retry jab tak enroll na ho
      ══════════════════════════════════════════════════════ */}
      {showFaceEnroll && (
        <FaceScannerWidget
          mode="enroll"
          apiCall={enrollApiCall}
          onSuccess={handleEnrollSuccess}
          onClose={() => setShowFaceEnroll(false)}
        />
      )}
    </div>
  );
}