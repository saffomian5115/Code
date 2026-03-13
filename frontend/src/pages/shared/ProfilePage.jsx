
import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Camera, Edit3, Save, X, Loader2, BadgeCheck,
  Building2, BookOpen, Hash, KeyRound, Eye, EyeOff, ScanFace,
  Palette, Bell, ChevronRight, Sun, Moon, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";
import { useTheme } from "../../context/ThemeContext";
import FaceScannerWidget from "../../components/shared/FaceScannerWidget";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ROLE_CONFIG = {
  admin:   { accent: "#9b59b6", bg: "rgba(155,89,182,0.12)", label: "Administrator" },
  teacher: { accent: "#22a06b", bg: "rgba(62,207,142,0.12)", label: "Teacher"       },
  student: { accent: "#5b8af0", bg: "rgba(91,138,240,0.12)", label: "Student"       },
};

// ─────────────────────────────────────────────────────────────
//  DecayCard
// ─────────────────────────────────────────────────────────────
function DecayCard({ children, onCardClick, accent = "#5b8af0" }) {
  const wrapRef         = useRef(null);
  const displacementRef = useRef(null);
  const cursor          = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cachedCursor    = useRef({ ...cursor.current });
  const winsize         = useRef({ width: window.innerWidth, height: window.innerHeight });
  const rafRef          = useRef(null);
  const imgValues       = useRef({ x: 0, y: 0, rz: 0, scale: 0 });

  useEffect(() => {
    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const map  = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;
    const dist = (x1, x2, y1, y2) => Math.hypot(x1 - x2, y1 - y2);
    const onResize = () => { winsize.current = { width: window.innerWidth, height: window.innerHeight }; };
    const onMove   = (ev) => { cursor.current = { x: ev.clientX, y: ev.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    const render = () => {
      const iv = imgValues.current;
      const bnd = 40;
      let tx = lerp(iv.x,  map(cursor.current.x, 0, winsize.current.width,  -80, 80), 0.08);
      let ty = lerp(iv.y,  map(cursor.current.y, 0, winsize.current.height, -80, 80), 0.08);
      let rz = lerp(iv.rz, map(cursor.current.x, 0, winsize.current.width,  -8,  8), 0.08);
      if (tx >  bnd) tx =  bnd + (tx - bnd) * 0.15;
      if (tx < -bnd) tx = -bnd + (tx + bnd) * 0.15;
      if (ty >  bnd) ty =  bnd + (ty - bnd) * 0.15;
      if (ty < -bnd) ty = -bnd + (ty + bnd) * 0.15;
      iv.x = tx; iv.y = ty; iv.rz = rz;
      if (wrapRef.current) gsap.set(wrapRef.current, { x: tx, y: ty, rotateZ: rz });
      const travelled = dist(cachedCursor.current.x, cursor.current.x, cachedCursor.current.y, cursor.current.y);
      iv.scale = lerp(iv.scale, map(travelled, 0, 200, 0, 300), 0.05);
      if (displacementRef.current) gsap.set(displacementRef.current, { attr: { scale: iv.scale } });
      cachedCursor.current = { ...cursor.current };
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", maxWidth: "440px", margin: "0 auto", willChange: "transform", userSelect: "none" }}>
      <div
        onClick={onCardClick}
        style={{
          borderRadius: "2rem", background: "var(--neu-surface)",
          border: "1px solid var(--neu-border)", boxShadow: "var(--neu-raised-lg)",
          overflow: "hidden", position: "relative", cursor: "pointer",
        }}
      >
        <svg viewBox="0 0 440 160" style={{ display: "block", width: "100%", height: "160px" }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="cardDecay">
              {/* <feTurbulence type="turbulence" baseFrequency="0.012" numOctaves="4" seed="7" stitchTiles="stitch" result="turb" /> */}
              <feDisplacementMap ref={displacementRef} in="SourceGraphic" in2="turb" scale="0" xChannelSelector="R" yChannelSelector="B" />
            </filter>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={accent} stopOpacity="0.40" />
              <stop offset="50%"  stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="440" height="160" fill="url(#cardGrad)" filter="url(#cardDecay)" />
          <circle cx="380" cy="30"  r="80" fill={accent} fillOpacity="0.10" filter="url(#cardDecay)" />
          <circle cx="40"  cy="140" r="55" fill={accent} fillOpacity="0.07" filter="url(#cardDecay)" />
        </svg>
        {children}
      </div>
      <p style={{ textAlign: "center", marginTop: "0.6rem", fontSize: "0.7rem", color: "var(--neu-text-ghost)", fontWeight: 500, letterSpacing: "0.05em" }}>
        Click card to open settings
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CardContent
// ─────────────────────────────────────────────────────────────
function CardContent({ profile, picUrl, rc, uploadingPic, fileInputRef }) {
  const handleCameraClick = (e) => {
    e.stopPropagation(); // prevent card's onCardClick from firing
    fileInputRef.current?.click();
  };

  const infoItems = [
    { icon: Mail,      value: profile?.email,                           label: "Email"        },
    { icon: Phone,     value: profile?.phone,                           label: "Phone"        },
    { icon: Hash,      value: profile?.roll_number || profile?.employee_id, label: "ID"       },
    { icon: MapPin,    value: profile?.city,                            label: "City"         },
    { icon: Building2, value: profile?.designation,                     label: "Designation"  },
    { icon: BookOpen,  value: profile?.qualification,                   label: "Qualification"},
    { icon: Calendar,  value: profile?.joining_date,                    label: "Joined"       },
    { icon: Shield,    value: profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : null, label: "Last Login" },
  ].filter(r => r.value);

  return (
    <div style={{ padding: "0 1.75rem 1.75rem", marginTop: "-3.5rem", position: "relative" }}>
      {/* Avatar */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{
            width: "7rem", height: "7rem", borderRadius: "50%",
            border: `3px solid ${rc.accent}`,
            boxShadow: `0 0 0 4px var(--neu-surface), var(--neu-raised)`,
            overflow: "hidden", background: "var(--neu-surface-deep)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {picUrl
              ? <img src={picUrl} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <User size={32} style={{ color: "var(--neu-text-ghost)" }} />
            }
          </div>
          <button
            onClick={handleCameraClick}
            disabled={uploadingPic}
            style={{
              position: "absolute", bottom: "2px", right: "2px",
              width: "1.8rem", height: "1.8rem", borderRadius: "50%",
              background: rc.accent, border: "2px solid var(--neu-surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: uploadingPic ? "not-allowed" : "pointer",
              boxShadow: "var(--neu-raised)", zIndex: 2,
            }}
          >
            {uploadingPic
              ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite", color: "#fff" }} />
              : <Camera size={11} style={{ color: "#fff" }} />
            }
          </button>
        </div>
      </div>

      {/* Name + role */}
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--neu-text-primary)", fontFamily: "Outfit, sans-serif", margin: 0 }}>
          {profile?.full_name || "—"}
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.3rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.75rem", borderRadius: "9999px", background: rc.bg, color: rc.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {rc.label}
          </span>
          {profile?.face_enrolled && (
            <span style={{ fontSize: "0.7rem", color: "#22a06b", display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <BadgeCheck size={13} /> Face ID
            </span>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {infoItems.map(({ icon: Icon, value, label }) => (
          <div key={label} style={{
            padding: "0.6rem 0.75rem", borderRadius: "0.875rem",
            background: "var(--neu-surface-deep)", border: "1px solid var(--neu-border-inner)",
            display: "flex", alignItems: "flex-start", gap: "0.5rem",
          }}>
            <Icon size={13} style={{ color: rc.accent, marginTop: "2px", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.62rem", color: "var(--neu-text-ghost)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                {label}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--neu-text-primary)", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ToggleSwitch
// ─────────────────────────────────────────────────────────────
function ToggleSwitch({ accent, defaultOn = true }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setOn(p => !p); }}
      style={{
        width: "2.5rem", height: "1.35rem", borderRadius: "9999px",
        background: on ? accent : "var(--neu-border)",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s", padding: 0,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "2px",
        left: on ? "calc(100% - 1.1rem)" : "2px",
        width: "1rem", height: "1rem", borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)", display: "block",
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  SettingsPanel
// ─────────────────────────────────────────────────────────────
function SettingsPanel({ onClose, onEditProfile, onChangePwd, onFaceEnroll, faceEnrolled, rc }) {
  const { theme, toggleTheme } = useTheme();
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    // 50ms delay prevents card click from immediately closing
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", onKey);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const MenuItem = ({ icon: Icon, label, onClick: handleClick, badge }) => (
    <button
      onClick={(e) => { e.stopPropagation(); handleClick(); }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "0.85rem",
        padding: "0.8rem 1rem", border: "none", background: "none",
        borderRadius: "0.875rem", cursor: "pointer",
        color: "var(--neu-text-secondary)",
        fontSize: "0.85rem", fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.15s", textAlign: "left",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--neu-surface-deep)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <div style={{
        width: "2rem", height: "2rem", borderRadius: "0.6rem",
        background: "var(--neu-surface-deep)", border: "1px solid var(--neu-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: "2px 2px 6px var(--neu-shadow-dark)",
      }}>
        <Icon size={14} style={{ color: rc.accent }} />
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(34,160,107,0.15)", color: "#22a06b" }}>
          {badge}
        </span>
      )}
      <ChevronRight size={14} style={{ color: "var(--neu-text-ghost)", opacity: 0.4 }} />
    </button>
  );

  const ThemeOption = ({ value, icon: Icon, label }) => {
    const active = theme === value;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); if (!active) toggleTheme(); }}
        style={{
          flex: 1, padding: "0.65rem 0.4rem", borderRadius: "0.75rem",
          border: active ? `2px solid ${rc.accent}` : "2px solid transparent",
          background: active ? rc.bg : "var(--neu-surface-deep)",
          cursor: active ? "default" : "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
          transition: "all 0.15s",
          boxShadow: active ? `0 0 0 3px ${rc.accent}22` : "none",
        }}
      >
        <Icon size={16} style={{ color: active ? rc.accent : "var(--neu-text-muted)" }} />
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: active ? rc.accent : "var(--neu-text-muted)" }}>
          {label}
        </span>
        {active && <Check size={10} style={{ color: rc.accent }} />}
      </button>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)", zIndex: 200, animation: "fadeIn 0.2s ease" }} />
      <div ref={panelRef} style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(340px, 92vw)", background: "var(--neu-surface)",
        borderRadius: "1.75rem", border: "1px solid var(--neu-border)",
        boxShadow: "var(--neu-raised-lg), 0 0 80px rgba(0,0,0,0.2)",
        zIndex: 210, animation: "panelIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid var(--neu-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--neu-text-primary)", fontFamily: "Outfit, sans-serif" }}>Settings</p>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--neu-text-ghost)" }}>Manage your account & preferences</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ width: "2rem", height: "2rem", borderRadius: "0.6rem", border: "1px solid var(--neu-border)", background: "var(--neu-surface-deep)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--neu-text-muted)" }}>
            <X size={14} />
          </button>
        </div>

        {/* Menu items */}
        <div style={{ padding: "0.5rem" }}>
          <MenuItem icon={Edit3}    label="Edit Profile"    onClick={() => { onClose(); onEditProfile(); }} />
          <MenuItem icon={KeyRound} label="Change Password" onClick={() => { onClose(); onChangePwd(); }} />
          <MenuItem icon={ScanFace} label="Enroll Face ID"  onClick={() => { onClose(); onFaceEnroll(); }} badge={faceEnrolled ? "Enrolled ✓" : null} />
        </div>

        <div style={{ height: "1px", background: "var(--neu-border)", margin: "0 1rem" }} />

        {/* Preferences */}
        <div style={{ padding: "0.75rem 1rem 1rem" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--neu-text-ghost)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.65rem 0.25rem" }}>
            Preferences
          </p>
          <div style={{ padding: "0.85rem", borderRadius: "0.875rem", background: "var(--neu-surface-deep)", border: "1px solid var(--neu-border)", marginBottom: "0.6rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
              <Palette size={13} style={{ color: rc.accent }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--neu-text-secondary)" }}>Theme</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <ThemeOption value="light" icon={Sun}  label="Light" />
              <ThemeOption value="dark"  icon={Moon} label="Dark"  />
            </div>
          </div>
          <div style={{ padding: "0.85rem", borderRadius: "0.875rem", background: "var(--neu-surface-deep)", border: "1px solid var(--neu-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bell size={13} style={{ color: rc.accent }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--neu-text-secondary)" }}>Notification Sound</span>
            </div>
            <ToggleSwitch accent={rc.accent} defaultOn={true} />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes panelIn { from { opacity: 0; transform: translate(-50%,-48%) scale(0.95) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  PwdField
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
          style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--neu-text-ghost)", padding: "0.2rem", display: "flex", alignItems: "center" }}
        >
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ChangePasswordModal
// ─────────────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  // Backend ChangePasswordRequest: { current_password: str, new_password: str }
  const [form,    setForm]    = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [show,    setShow]    = useState({});
  const [loading, setLoading] = useState(false);
  const toggleShow = (key) => setShow(p => ({ ...p, [key]: !p[key] }));

  const handleSubmit = async () => {
    if (!form.current_password)   { toast.error("Current password daalen"); return; }
    if (!form.new_password)       { toast.error("New password daalen"); return; }
    if (form.new_password.length < 8) { toast.error("Password 8+ characters ka hona chahiye"); return; }
    if (form.new_password !== form.confirm_password) { toast.error("Dono passwords match nahi karte"); return; }
    try {
      setLoading(true);
      await authAPI.changePassword({ current_password: form.current_password, new_password: form.new_password });
      toast.success("Password change ho gaya! 🔐");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || "Password change fail ho gaya");
    } finally { setLoading(false); }
  };

  return (
    <div className="neu-overlay" style={{ zIndex: 300 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="neu-modal" style={{ padding: "1.75rem", maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--neu-text-primary)", fontFamily: "Outfit, sans-serif" }}>Change Password</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neu-text-muted)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <PwdField label="Current Password" fieldKey="current_password" showKey="cur" form={form} set={setForm} show={show} toggleShow={toggleShow} />
          <PwdField label="New Password"     fieldKey="new_password"     showKey="nw"  form={form} set={setForm} show={show} toggleShow={toggleShow} />
          <PwdField label="Confirm Password" fieldKey="confirm_password" showKey="cf"  form={form} set={setForm} show={show} toggleShow={toggleShow} />
        </div>
        <button onClick={handleSubmit} disabled={loading} className="neu-btn neu-btn-accent" style={{ width: "100%", marginTop: "1.25rem", padding: "0.75rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.4rem", opacity: loading ? 0.75 : 1 }}>
          {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Updating...</> : "Update Password"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  EditProfileModal
// ─────────────────────────────────────────────────────────────
function EditProfileModal({ form, setForm, onClose, onSave, saving }) {
  const fields = [
    { key: "full_name",       label: "Full Name"      },
    { key: "phone",           label: "Phone"          },
    { key: "city",            label: "City"           },
    { key: "current_address", label: "Address"        },
    { key: "designation",     label: "Designation"    },
    { key: "qualification",   label: "Qualification"  },
    { key: "specialization",  label: "Specialization" },
  ];

  return (
    <div className="neu-overlay" style={{ zIndex: 300 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="neu-modal" style={{ padding: "1.75rem", maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--neu-text-primary)", fontFamily: "Outfit, sans-serif" }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neu-text-muted)", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
          {fields.map(({ key, label }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--neu-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
              <input type="text" value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="neu-input-rect" style={{ borderRadius: "0.875rem" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button onClick={onClose} className="neu-btn" style={{ flex: 1, padding: "0.75rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <X size={13} /> Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="neu-btn neu-btn-accent" style={{ flex: 2, padding: "0.75rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.4rem", opacity: saving ? 0.75 : 1 }}>
            {saving ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main ProfilePage
// ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const fileInputRef      = useRef(null);
  const [profile,         setProfile]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [uploadingPic,    setUploadingPic]    = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showChangePwd,   setShowChangePwd]   = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFaceEnroll,  setShowFaceEnroll]  = useState(false);
  const [faceEnrolled,    setFaceEnrolled]    = useState(false);
  const [form,            setForm]            = useState({});

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
    } catch {
      toast.error("Profile load nahi ho saka");
    } finally {
      setLoading(false);
    }
  };

  // ── Edit Profile Save ─────────────────────────────────────
  // PUT /auth/profile  body: UpdateProfileRequest fields
  const handleSave = async () => {
    try {
      setSaving(true);
      const res     = await authAPI.updateProfile(form);
      const updated = res.data.data;
      // Merge — don't overwrite email/role/etc.
      setProfile(prev => ({ ...prev, ...updated }));
      authStore.updateUser({
        full_name:           updated.full_name,
        profile_picture_url: updated.profile_picture_url,
      });
      setShowEditProfile(false);
      toast.success("Profile update ho gaya! ✅");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || "Update fail ho gaya");
    } finally {
      setSaving(false);
    }
  };

  // ── Profile Picture Upload ────────────────────────────────
  const handlePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file re-selectable
    try {
      setUploadingPic(true);
      const res     = await authAPI.uploadProfilePicture(file);
      const updated = res.data.data;
      setProfile(prev => ({ ...prev, profile_picture_url: updated.profile_picture_url }));
      authStore.updateUser({ profile_picture_url: updated.profile_picture_url });
      toast.success("Photo update ho gaya! 📸");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || "Photo upload fail ho gaya");
    } finally {
      setUploadingPic(false);
    }
  };

  // ── Face Enroll ───────────────────────────────────────────
  const enrollApiCall = useCallback(async (base64) => {
    return await authAPI.enrollFace(base64);
  }, []);

  // Called by FaceScannerWidget after successful API response (CARD=false in enroll mode)
  const handleEnrollSuccess = useCallback(() => {
    setFaceEnrolled(true);
    setShowFaceEnroll(false);
    toast.success("Face ID enroll ho gaya! 🎉");
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--neu-accent)" }} />
      </div>
    );
  }

  const rc     = ROLE_CONFIG[profile?.role] || ROLE_CONFIG.student;
  const picUrl = profile?.profile_picture_url
    ? (profile.profile_picture_url.startsWith("http")
        ? profile.profile_picture_url
        : `${BASE_URL}${profile.profile_picture_url}`)
    : null;

  return (
    <div className="neu-page-bg" style={{ minHeight: "100vh", padding: "2rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "520px" }}>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePicChange} />

        {/* Decay Card */}
        <DecayCard onCardClick={() => setShowSettings(true)} accent={rc.accent}>
          <CardContent profile={profile} picUrl={picUrl} rc={rc} uploadingPic={uploadingPic} fileInputRef={fileInputRef} />
        </DecayCard>

      </div>

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onEditProfile={() => setShowEditProfile(true)}
          onChangePwd={() => setShowChangePwd(true)}
          onFaceEnroll={() => setShowFaceEnroll(true)}
          faceEnrolled={faceEnrolled}
          rc={rc}
        />
      )}

      {showEditProfile && (
        <EditProfileModal
          form={form}
          setForm={setForm}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}

      {/* FaceScannerWidget — mode="enroll": CARD=false, onSuccess fires immediately after API success */}
      {showFaceEnroll && (
        <FaceScannerWidget
          mode="enroll"
          apiCall={enrollApiCall}
          onSuccess={handleEnrollSuccess}
          onClose={() => setShowFaceEnroll(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}