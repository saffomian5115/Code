import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, Camera,
  GraduationCap, Mail, Lock, Zap, ShieldCheck, BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";
import { useTheme } from "../../context/ThemeContext";
import FaceScannerWidget from "../../components/shared/FaceScannerWidget";

// ─────────────────────────────────────────────────────────────
//  Floating background orbs
// ─────────────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: "55vw", height: "55vw", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,138,240,0.12) 0%, transparent 70%)",
        animation: "neu-float 7s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%",
        width: "50vw", height: "50vw", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(62,207,142,0.09) 0%, transparent 70%)",
        animation: "neu-float 9s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "55%",
        width: "20vw", height: "20vw", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)",
        animation: "neu-float 5s ease-in-out infinite",
        animationDelay: "1.5s",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Theme Toggle Button
// ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="neu-btn-icon neu-animate-fade-in"
      style={{
        position: "fixed", top: "1.25rem", right: "1.25rem",
        zIndex: 50, width: "2.75rem", height: "2.75rem", fontSize: "1.1rem",
      }}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Login Page
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate     = useNavigate();
  const [form,        setForm]       = useState({ email: "", password: "" });
  const [showPass,    setShowPass]   = useState(false);
  const [loading,     setLoading]    = useState(false);
  const [cameraOpen,  setCameraOpen] = useState(false);
  const [cameraKey,   setCameraKey]  = useState(0);

  const openCamera = () => {
    setCameraKey(k => k + 1);
    setCameraOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email aur password required hain");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(form.email, form.password);
      if (res.data.success) applyLogin(res.data.data, form.email);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const applyLogin = (data, email = null) => {
    const { access_token, refresh_token, role, user_id, full_name, profile_picture_url } = data;
    authStore.setAuth(access_token, refresh_token, {
      id: user_id, role, full_name,
      email: email || data.email,
      profile_picture_url,
    });
    window.dispatchEvent(new Event("profileUpdated"));
    toast.success(`Welcome, ${full_name}!`);
    if (role === "admin")        navigate("/admin/dashboard");
    else if (role === "teacher") navigate("/teacher/dashboard");
    else                         navigate("/student/dashboard");
  };

  // ── FaceScannerWidget ke liye apiCall aur onSuccess ──────
  const faceApiCall = async (base64) => authAPI.faceLogin(base64);

  const handleFaceSuccess = (data) => {
    setCameraOpen(false);
    applyLogin(data);
  };

  // Quick login presets
  const quickLogins = [
    { label: "Admin",   icon: ShieldCheck,   email: "admin@bzu.edu.pk",              pass: "Admin@123",   color: "rgba(155,89,182,0.15)", border: "rgba(155,89,182,0.3)", text: "#9b59b6" },
    { label: "Teacher", icon: BookOpen,      email: "ms.ayesha@bzu.edu.pk",          pass: "Teacher@123", color: "rgba(62,207,142,0.12)", border: "rgba(62,207,142,0.3)", text: "#22a06b" },
    { label: "Student", icon: GraduationCap, email: "ali.hassan@student.bzu.edu.pk", pass: "Student@123", color: "rgba(91,138,240,0.12)", border: "rgba(91,138,240,0.3)", text: "#5b8af0" },
  ];

  const tooltipStyle = {
    position: "absolute",
    bottom: "calc(100% + 10px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--neu-surface)",
    boxShadow: "0 5px 0 #b0bed2, 0 8px 12px -6px rgba(0,0,0,0.18), inset 0 1px 2px white",
    border: "1px solid rgba(255,255,255,0.7)",
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.3rem 0.7rem",
    borderRadius: "0.5rem",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.15s ease, transform 0.15s ease",
    letterSpacing: "0.04em",
    zIndex: 10,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--neu-bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", position: "relative",
      transition: "background 0.35s ease",
    }}>

      <BackgroundOrbs />
      <ThemeToggle />

      {/* ── Main Card ── */}
      <div
        className="neu-card-lg neu-stagger"
        style={{ width: "100%", maxWidth: "400px", padding: "2.5rem 2.25rem", position: "relative", zIndex: 1 }}
      >
        {/* ── Logo / Brand ── */}
        <div className="neu-animate-slide-up" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
            background: "linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))",
            boxShadow: "var(--neu-raised-md)",
            marginBottom: "1rem",
          }}>
            <Zap size={22} style={{ color: "var(--neu-accent)" }} />
          </div>
          <h1 className="neu-heading" style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>
            Smart LMS
          </h1>
          <p className="neu-subtext" style={{ fontSize: "0.82rem" }}>
            AI-Driven Learning Management System
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>

          {/* Email */}
          <div className="neu-animate-slide-up" style={{ animationDelay: "0.12s", position: "relative" }}>
            <div style={{
              position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)",
              color: "var(--neu-text-ghost)", pointerEvents: "none", zIndex: 1, display: "flex",
            }}>
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="neu-input"
              style={{ paddingLeft: "2.75rem" }}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="neu-animate-slide-up" style={{ animationDelay: "0.16s", position: "relative" }}>
            <div style={{
              position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)",
              color: "var(--neu-text-ghost)", pointerEvents: "none", zIndex: 1, display: "flex",
            }}>
              <Lock size={16} />
            </div>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="neu-input"
              style={{ paddingLeft: "2.75rem", paddingRight: "3rem" }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                color: "var(--neu-text-ghost)", background: "none", border: "none", cursor: "pointer",
                display: "flex", padding: "4px", transition: "color 0.18s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--neu-accent)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--neu-text-ghost)"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loading}
            className="neu-btn neu-btn-accent neu-animate-slide-up"
            style={{
              width: "100%", padding: "0.95rem",
              fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.02em",
              animationDelay: "0.2s", opacity: loading ? 0.75 : 1,
            }}
          >
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                  Signing in...
                </span>
              : <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <Zap size={16} /> Sign In
                </span>
            }
          </button>

          {/* OR divider */}
          <div className="neu-animate-slide-up" style={{
            display: "flex", alignItems: "center", gap: "0.75rem", animationDelay: "0.22s",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--neu-border-inner)" }} />
            <span style={{ color: "var(--neu-text-ghost)", fontSize: "0.75rem" }}>ya</span>
            <div style={{ flex: 1, height: "1px", background: "var(--neu-border-inner)" }} />
          </div>

          {/* Face Login + Quick Login buttons */}
          <div className="neu-animate-slide-up" style={{
            display: "flex", justifyContent: "center", gap: "0.75rem", animationDelay: "0.24s",
          }}>
            {/* Face Login */}
            <div className="neu-tooltip-wrap" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={openCamera}
                className="neu-press-btn"
                style={{ width: "52px", height: "52px", color: "var(--neu-success)" }}
              >
                <Camera size={20} />
              </button>
              <span className="neu-tooltip-label" style={{ ...tooltipStyle, color: "var(--neu-text-primary)" }}>
                Face Login
              </span>
            </div>

            {/* Quick Login presets */}
            {quickLogins.map(({ label, icon: Icon, email, pass, color, border, text }) => (
              <div key={label} className="neu-tooltip-wrap" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setForm({ email, password: pass })}
                  className="neu-press-btn"
                  style={{ width: "52px", height: "52px", background: color, border: `1px solid ${border}`, color: text }}
                >
                  <Icon size={19} />
                </button>
                <span className="neu-tooltip-label" style={{ ...tooltipStyle, color: text }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

        </form>

        {/* Footer */}
        <p className="neu-animate-fade-in" style={{
          textAlign: "center", color: "var(--neu-text-ghost)",
          fontSize: "0.7rem", marginTop: "1.5rem", animationDelay: "0.5s",
        }}>
          AI-Driven Smart LMS — Sarfraz RBSIT-21-13
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          FaceScannerWidget — mode="login"
          Purani FaceCameraModal ki jagah yeh use hoga.
          Auto-capture, no timer, red border on fail, auto-retry,
          5 attempts ke baad blocked overlay with retry button.
      ══════════════════════════════════════════════════════════ */}
      {cameraOpen && (
        <FaceScannerWidget
          key={cameraKey}
          mode="login"
          apiCall={faceApiCall}
          onSuccess={handleFaceSuccess}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}