// ═══════════════════════════════════════════════════════════════
//  ProfilePage.jsx  —  Neumorphic Premium Profile
//  Replace:  frontend/src/pages/shared/ProfilePage.jsx
//  (Saara original logic same — sirf UI premium hua)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Edit3, Save, X, Loader2, BadgeCheck,
  Building2, BookOpen, Hash, KeyRound, Eye, EyeOff, ScanFace,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";
import FaceEnrollModal from "../../components/shared/FaceEnrollModal";

const BASE_URL = "http://127.0.0.1:8000";

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
          value={form[fieldKey]}
          onChange={(e) => set(fieldKey, e.target.value)}
          className="neu-input-rect"
          placeholder="••••••••"
          style={{ paddingRight: "2.75rem" }}
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          style={{
            position: "absolute", right: "0.9rem", top: "50%",
            transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--neu-text-ghost)", display: "flex",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--neu-accent)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--neu-text-ghost)"}
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
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const set        = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleShow = (k)    => setShow(p => ({ ...p, [k]: !p[k] }));

  const handleSubmit = async () => {
    if (!form.current_password || !form.new_password || !form.confirm_password) {
      toast.error("Sab fields required hain"); return;
    }
    if (form.new_password.length < 8) {
      toast.error("New password kam az kam 8 characters ka hona chahiye"); return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords match nahi karte"); return;
    }
    if (form.current_password === form.new_password) {
      toast.error("New password old se alag hona chahiye"); return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ current_password: form.current_password, new_password: form.new_password });
      toast.success("Password change ho gaya!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(10,14,22,0.55)",
      backdropFilter: "blur(8px)",
      zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div className="neu-card-lg neu-animate-slide-up" style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "0.875rem",
              background: "linear-gradient(145deg, rgba(91,138,240,0.2), rgba(91,138,240,0.08))",
              boxShadow: "var(--neu-raised)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <KeyRound size={16} style={{ color: "var(--neu-accent)" }} />
            </div>
            <h2 className="neu-heading" style={{ fontSize: "1rem" }}>Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="neu-btn-icon"
            style={{ width: "2rem", height: "2rem", borderRadius: "0.625rem" }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <PwdField label="Current Password" fieldKey="current_password" showKey="current" form={form} set={set} show={show} toggleShow={toggleShow} />
          <PwdField label="New Password"     fieldKey="new_password"     showKey="new"     form={form} set={set} show={show} toggleShow={toggleShow} />
          <PwdField label="Confirm Password" fieldKey="confirm_password" showKey="confirm" form={form} set={set} show={show} toggleShow={toggleShow} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button onClick={onClose} className="neu-btn" style={{ flex: 1, padding: "0.75rem" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="neu-btn neu-btn-accent"
            style={{ flex: 1, padding: "0.75rem", opacity: loading ? 0.75 : 1 }}
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
      toast.success("Profile update ho gaya!");
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingPic(true);
      const res = await authAPI.uploadProfilePicture(file);
      const { profile_picture_url } = res.data.data;
      setProfile(p => ({ ...p, profile_picture_url }));
      authStore.updateUser({ profile_picture_url });
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success("Photo update ho gaya!");
    } catch (err) { toast.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploadingPic(false); }
  };

  const avatarUrl = profile?.profile_picture_url ? `${BASE_URL}${profile.profile_picture_url}` : null;
  const rc        = ROLE_CONFIG[profile?.role] || ROLE_CONFIG.student;

  // Edit fields per role
  const editFields = [
    { key: "full_name",       label: "Full Name",     show: true },
    { key: "phone",           label: "Phone",         show: true },
    { key: "city",            label: "City",          show: profile?.role === "student" },
    { key: "current_address", label: "Address",       show: profile?.role === "student" },
    { key: "designation",     label: "Designation",   show: ["teacher","admin"].includes(profile?.role) },
    { key: "qualification",   label: "Qualification", show: profile?.role === "teacher" },
    { key: "specialization",  label: "Specialization",show: profile?.role === "teacher" },
  ].filter(f => f.show);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
      <div style={{
        width: "3.5rem", height: "3.5rem", borderRadius: "50%",
        background: "var(--neu-surface)", boxShadow: "var(--neu-raised-md)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={22} style={{ color: "var(--neu-accent)", animation: "spin 1s linear infinite" }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Header Card ── */}
      <div className="neu-card-lg neu-animate-slide-up" style={{ overflow: "hidden", padding: 0 }}>

        {/* Accent banner */}
        <div style={{
          height: "5rem",
          background: `linear-gradient(135deg, ${rc.accent}cc, ${rc.accent}66)`,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: "-1.5rem", right: "-1.5rem", width: "7rem", height: "7rem", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: "-1rem", left: "30%", width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div style={{ padding: "0 1.75rem 1.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-2.5rem", flexWrap: "wrap", gap: "1rem" }}>

            {/* Avatar group */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
              {/* Avatar */}
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "5rem", height: "5rem",
                  borderRadius: "1.25rem",
                  background: rc.bg,
                  boxShadow: "var(--neu-raised-md)",
                  border: `3px solid var(--neu-surface)`,
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: rc.accent,
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 800, fontSize: "1.75rem",
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span>{profile?.full_name?.[0]?.toUpperCase() || "?"}</span>
                  }
                </div>

                {/* Camera upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPic}
                  className="neu-press-btn"
                  style={{
                    position: "absolute", bottom: "-6px", right: "-6px",
                    width: "1.85rem", height: "1.85rem",
                    background: `linear-gradient(145deg, ${rc.accent}, ${rc.accent}bb)`,
                    boxShadow: `0 4px 0 ${rc.accent}55, 0 6px 10px -4px rgba(0,0,0,0.3)`,
                    border: "2px solid var(--neu-surface)",
                    color: "#fff",
                    borderRadius: "0.5rem",
                  }}
                >
                  {uploadingPic
                    ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                    : <Camera size={11} />
                  }
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePictureChange} />
              </div>

              {/* Name + role */}
              <div style={{ paddingBottom: "0.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <h1 className="neu-heading" style={{ fontSize: "1.3rem" }}>{profile?.full_name}</h1>
                  {profile?.is_active && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "3px",
                      padding: "0.2rem 0.55rem",
                      background: "rgba(62,207,142,0.12)",
                      color: "#22a06b",
                      borderRadius: "9999px",
                      fontSize: "0.68rem", fontWeight: 700,
                    }}>
                      <BadgeCheck size={11} /> Active
                    </span>
                  )}
                </div>
                <p className="neu-subtext" style={{ marginTop: "2px", fontSize: "0.8rem" }}>{profile?.email}</p>

                {/* Role badge */}
                <span style={{
                  display: "inline-block", marginTop: "0.4rem",
                  padding: "0.2rem 0.65rem",
                  background: rc.bg,
                  color: rc.accent,
                  borderRadius: "9999px",
                  fontSize: "0.7rem", fontWeight: 700,
                  textTransform: "capitalize",
                  border: `1px solid ${rc.accent}30`,
                }}>
                  {rc.label}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Face enroll */}
              <button
                onClick={() => setShowFaceEnroll(true)}
                className="neu-btn"
                style={{
                  padding: "0.55rem 1rem",
                  fontSize: "0.78rem",
                  gap: "0.4rem",
                  color: faceEnrolled ? "#22a06b" : "var(--neu-text-secondary)",
                  borderColor: faceEnrolled ? "rgba(62,207,142,0.3)" : "var(--neu-border)",
                }}
              >
                <ScanFace size={14} />
                {faceEnrolled ? "✓ Face Enrolled" : "Add Face Login"}
              </button>

              {/* Change password */}
              <button
                onClick={() => setShowChangePwd(true)}
                className="neu-btn"
                style={{ padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem" }}
              >
                <KeyRound size={14} /> Password
              </button>

              {/* Edit / Save / Cancel */}
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="neu-btn"
                    style={{ padding: "0.55rem 1rem", fontSize: "0.78rem", gap: "0.4rem" }}
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="neu-btn neu-btn-accent"
                    style={{ padding: "0.55rem 1.1rem", fontSize: "0.78rem", gap: "0.4rem", opacity: saving ? 0.75 : 1 }}
                  >
                    {saving
                      ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
                      : <><Save size={13} /> Save</>
                    }
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="neu-btn neu-btn-accent"
                  style={{ padding: "0.55rem 1.1rem", fontSize: "0.78rem", gap: "0.4rem" }}
                >
                  <Edit3 size={13} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Info / Edit Card ── */}
      <div className="neu-card-lg neu-animate-slide-up" style={{ padding: "1.75rem", animationDelay: "0.08s" }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 700,
          color: "var(--neu-text-ghost)",
          letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: "1rem",
        }}>
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
            <InfoRow icon={User}     label="Full Name"     value={profile?.full_name}    accent={rc.accent} />
            <InfoRow icon={Mail}     label="Email"         value={profile?.email}        accent={rc.accent} />
            <InfoRow icon={Phone}    label="Phone"         value={profile?.phone}        accent={rc.accent} />
            <InfoRow icon={Hash}     label="Roll Number"   value={profile?.roll_number}  accent={rc.accent} />
            <InfoRow icon={Hash}     label="Employee ID"   value={profile?.employee_id}  accent={rc.accent} />
            <InfoRow icon={MapPin}   label="City"          value={profile?.city}         accent={rc.accent} />
            <InfoRow icon={MapPin}   label="Address"       value={profile?.current_address} accent={rc.accent} />
            <InfoRow icon={Building2}label="Designation"   value={profile?.designation}  accent={rc.accent} />
            <InfoRow icon={BookOpen} label="Qualification" value={profile?.qualification} accent={rc.accent} />
            <InfoRow icon={BookOpen} label="Specialization"value={profile?.specialization} accent={rc.accent} />
            <InfoRow icon={Calendar} label="Joined"        value={profile?.joining_date} accent={rc.accent} />
            <InfoRow icon={Shield}   label="Last Login"    value={profile?.last_login ? new Date(profile.last_login).toLocaleString() : null} accent={rc.accent} />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showChangePwd  && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
      {showFaceEnroll && (
        <FaceEnrollModal
          onClose={() => setShowFaceEnroll(false)}
          onEnrolled={() => setFaceEnrolled(true)}
        />
      )}
    </div>
  );
}